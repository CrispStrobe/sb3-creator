// A Web-Serial-shaped port over a POSIX raw file descriptor, so the ONE
// tested flasher (flasher.js, vendored from stc-compiler) runs unchanged
// in the `bw` CLI — the same bytes the browser proves, no serialport
// native dependency.
//
// It presents exactly the surface flasher.js touches:
//   port.open({baudRate, parity})   — stty the tty, (re)open the fd
//   port.close()
//   port.writable.getWriter() -> { write(Uint8Array), releaseLock() }
//   port.readable.getReader() -> { read() -> {value,done}, cancel(), releaseLock() }
//
// setSignals is deliberately ABSENT: a raw fd cannot toggle DTR/RTS
// without a termios ioctl this has no binding for, and flasher.js guards
// `if (port.setSignals)` before pulsing. STC (cold power-on) and STM32
// (BOOT0) need no pulse and flash fully; AVR's optiboot needs the DTR
// reset, so it depends on the USB adapter asserting DTR on open — many
// do, some do not, and the caller is told so rather than it failing
// mysteriously.
//
// macOS/Linux only (stty + /dev tty). Windows uses the app or a native tool.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

/** @param {string} path a tty device, e.g. /dev/cu.usbserial-XXXX */
export function nodeSerialPort (path) {
  let fd = null;
  let settings = { baudRate: 115200, parity: 'none' };
  let recovering = null;
  const trace = typeof process !== 'undefined' && process.env.BW_SERIAL_TRACE === '1';
  const sttyFlag = process.platform === 'darwin' ? '-f' : '-F';

  function configure (baud, parity) {
    // raw, no echo, no flow control; even parity for STM32's 8E1, none
    // otherwise. cs8 always. `stty` on the path applies to the tty line
    // discipline; we then (re)open so the fd sees the new settings.
    const args = [sttyFlag, path, String(baud), 'cs8', 'raw', '-echo', '-crtscts', 'clocal'];
    if (parity === 'even') args.push('parenb', '-parodd');
    else args.push('-parenb');
    execFileSync('stty', args, { stdio: 'pipe' });
  }

  const discard = (onlyFd = fd) => {
    if (fd !== onlyFd) return;
    try { fs.closeSync(fd); } catch { /* already gone */ }
    fd = null;
  };

  // On boards such as the YL-39, the target power switch also briefly
  // re-enumerates the onboard USB UART. Native serial libraries reopen that
  // path; a bare Node fd otherwise remains stale and its next write is EIO.
  async function recover () {
    if (!recovering) {
      recovering = (async () => {
        const deadline = Date.now() + 5000;
        let last;
        while (Date.now() < deadline) {
          try {
            fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_NONBLOCK);
            configure(settings.baudRate, settings.parity);
            return;
          } catch (err) {
            last = err;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
        throw last || new Error(`serial device ${path} did not reappear`);
      })().finally(() => { recovering = null; });
    }
    await recovering;
  }

  const retryable = (err) =>
    ['EIO', 'ENXIO', 'EBADF', 'ENOENT', 'EAGAIN', 'EWOULDBLOCK'].includes(err?.code);

  return {
    async open ({ baudRate = 115200, parity = 'none' } = {}) {
      discard();
      settings = { baudRate, parity };
      fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_NONBLOCK);
      // Some USB tty drivers restore their default baud on open. Apply the
      // termios settings after opening so 2400 really reaches the wire (the
      // STC89 frequency word exposes a 4x error immediately: 02A7 vs 0A79).
      configure(baudRate, parity);
    },
    async close () {
      discard();
    },
    get writable () {
      return { getWriter: () => ({
        async write (bytes) {
          const data = Buffer.from(bytes);
          if (trace) console.error(`serial tx ${data.length}: ${data.toString('hex')}`);
          const fastDeadline = Date.now() + 500;
          let last;
          while (Date.now() < fastDeadline) {
            try { fs.writeSync(fd, data); return; } catch (err) {
              if (!retryable(err)) throw err;
              last = err;
              await new Promise((resolve) => setTimeout(resolve, 5));
            }
          }
          discard();
          await recover();
          try { fs.writeSync(fd, data); } catch (err) { throw last || err; }
        },
        releaseLock () {},
      }) };
    },
    get readable () {
      return { getReader: () => {
        let cancelled = false;
        return {
        // A blocking-with-timeout read: the tty is in raw mode, so read()
        // returns as soon as ANY byte is available, or the fd's own
        // read... returns 0 at EOF. flasher.js's serialTransport pumps
        // this in a loop and applies its own per-command deadline.
        async read () {
          while (!cancelled) {
            if (fd === null) await recover();
            const readFd = fd;
            const buf = Buffer.alloc(4096);
            try {
              const n = fs.readSync(readFd, buf, 0, buf.length, null);
              if (n) {
                if (trace) console.error(`serial rx ${n}: ${buf.subarray(0, n).toString('hex')}`);
                return { value: new Uint8Array(buf.subarray(0, n)), done: false };
              }
            } catch (err) {
              // EAGAIN is the normal no-data result for this nonblocking fd.
              // EIO also occurs briefly when the YL-39 target is switched;
              // retaining the descriptor gives its short BSL window priority.
              if (!retryable(err)) throw err;
            }
            await new Promise((resolve) => setTimeout(resolve, 5));
          }
          return { value: undefined, done: true };
        },
        // serialTransport.close() waits for its pending read before asking the
        // port to reopen at another baud. Closing the descriptor is how a
        // POSIX async read is cancelled; a no-op here deadlocks every STC baud
        // transition because that read otherwise has no reason to finish.
        async cancel () {
          cancelled = true;
          discard();
        },
        releaseLock () {},
      } } };
    },
    // No setSignals: see the header. Its ABSENCE is the contract flasher.js
    // reads — do not add a no-op, which would make flashAvr think it pulsed.
  };
}

export default nodeSerialPort;
