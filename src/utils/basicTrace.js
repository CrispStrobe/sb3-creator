/**
 * TRACE-stream decoder — the runtime half of BASIC source-level
 * debugging. BBC BASIC's TRACE ON prints each executed line's number in
 * square brackets onto the output stream, generateBASIC's lineMap knows
 * which Scratch block owns each line, and this decoder joins them: feed
 * it the raw serial/VDU byte stream and it (a) reports the owning block
 * for every trace token, and (b) hands back the stream with the tokens
 * stripped, so the terminal shows what the program printed, not the
 * debugger's chatter.
 *
 * Streaming-safe: a token split across serial chunks ("[1" + "0]") is
 * held back and completed on the next feed; flush() releases any
 * dangling partial. STATED LIMITATION: a program that PRINTs a
 * bracketed number indistinguishable from a trace token will glow a
 * block — TRACE's format is not escapable, and the alternative
 * (glowing nothing) would break stepping for every real program to
 * protect a pathological one.
 *
 * @module
 */

// A complete trace token anywhere in the buffer: [10], [ 10 ] — plus
// the single trailing space TRACE prints after it, when present.
const TOKEN = /\[\s*(\d+)\s*\] ?/g;
// A trailing PARTIAL token: an unclosed bracket that could still become
// one — hold it back rather than emitting it as text.
const PARTIAL_TAIL = /\[\s*\d*\s*$/;

/**
 * @param {Record<number|string, string>} lineMap generateBASIC's map
 * @param {{ onBlock?: (blockId: string, line: number) => void,
 *           onLine?: (line: number) => void,
 *           onText?: (text: string) => void }} [hooks]
 *   onBlock fires only for mapped lines; onLine for every trace token
 *   (scaffolding lines trace too — they are stripped but own no block).
 */
export function createTraceDecoder(lineMap, hooks = {}) {
    let buf = '';
    let eatSpace = false;   // a token ended the last chunk; its trailing
    // space may arrive at the head of the next one.
    const emitText = (s) => { if (s && hooks.onText) hooks.onText(s); };

    const drain = (final) => {
        if (eatSpace) {
            if (buf.startsWith(' ')) buf = buf.slice(1);
            if (buf.length || final) eatSpace = false;
        }
        let out = '';
        let last = 0;
        TOKEN.lastIndex = 0;
        let m;
        let tokenAtEnd = false;
        while ((m = TOKEN.exec(buf)) !== null) {
            out += buf.slice(last, m.index);
            last = TOKEN.lastIndex;
            tokenAtEnd = last === buf.length && !m[0].endsWith(' ');
            const line = Number(m[1]);
            if (hooks.onLine) hooks.onLine(line);
            const blockId = lineMap ? lineMap[line] : undefined;
            if (blockId && hooks.onBlock) hooks.onBlock(blockId, line);
        }
        let rest = buf.slice(last);
        if (!final) {
            if (tokenAtEnd) eatSpace = true;
            const tail = rest.match(PARTIAL_TAIL);
            if (tail) {
                buf = rest.slice(tail.index);
                rest = rest.slice(0, tail.index);
            } else {
                buf = '';
            }
        } else {
            buf = '';
        }
        out += rest;
        emitText(out);
    };

    return {
        /** @param {string|Uint8Array} chunk raw program output */
        feed(chunk) {
            buf += typeof chunk === 'string' ? chunk
                : String.fromCharCode(...chunk);
            drain(false);
        },
        /** Release any held-back partial token as plain text. */
        flush() { drain(true); },
    };
}

export default createTraceDecoder;
