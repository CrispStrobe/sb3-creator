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

  return {
    async open ({ baudRate = 115200, parity = 'none' } = {}) {
      if (fd !== null) { try { fs.closeSync(fd); } catch { /* already gone */ } fd = null; }
      configure(baudRate, parity);
      fd = fs.openSync(path, 'r+');
    },
    async close () {
      if (fd !== null) { try { fs.closeSync(fd); } catch { /* already gone */ } fd = null; }
    },
    get writable () {
      return { getWriter: () => ({
        async write (bytes) { fs.writeSync(fd, Buffer.from(bytes)); },
        releaseLock () {},
      }) };
    },
    get readable () {
      return { getReader: () => ({
        // A blocking-with-timeout read: the tty is in raw mode, so read()
        // returns as soon as ANY byte is available, or the fd's own
        // read... returns 0 at EOF. flasher.js's serialTransport pumps
        // this in a loop and applies its own per-command deadline.
        read () {
          return new Promise((resolve) => {
            const buf = Buffer.alloc(4096);
            fs.read(fd, buf, 0, buf.length, null, (err, n) => {
              if (err || !n) { resolve({ value: undefined, done: true }); return; }
              resolve({ value: new Uint8Array(buf.subarray(0, n)), done: false });
            });
          });
        },
        async cancel () {},
        releaseLock () {},
      }) };
    },
    // No setSignals: see the header. Its ABSENCE is the contract flasher.js
    // reads — do not add a no-op, which would make flashAvr think it pulsed.
  };
}

export default nodeSerialPort;
