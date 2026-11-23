/**
 * The ```assert block grammar, in ONE place.
 *
 * Three readers used to carry their own copy of "where is the assert block and
 * what does a line in it mean": test/assert-physics.test.mjs parsed the lines,
 * scripts/lib/example-enrolment.mjs decided whether an example was enrolled in
 * that gate with a regex of its own, and the claim census
 * (test/helpers/expected-claims.mjs) blanks every fenced block so that a number
 * inside ```assert is assert-physics' territory and never a prose claim. The
 * first two now import from here; the census' fence reader is held to this one
 * by test/assert-blocks.test.mjs, which checks that no census claim sits on a
 * line this module reads as an assertion.
 *
 * Numbers are SIGNED where the quantity is: a node voltage or a branch current
 * can be negative on a split-supply bench, and the corpus writes the sign with
 * an ASCII hyphen or with U+2212 MINUS SIGN (see expected-claims.mjs). A
 * tolerance is a magnitude and stays unsigned.
 */

/** The fence assert-physics has always read: ```assert, newline, body, ```. */
export const ASSERT_FENCE = /```assert\n([\s\S]*?)```/g;

/** The body of every ```assert block in an EXPECTED.md, in order. */
export function assertBlocks (mdText) {
    return [...String(mdText).matchAll(ASSERT_FENCE)].map(m => m[1]);
}

/** Whether an EXPECTED.md carries at least one ```assert block. */
export const hasAssertBlock = (mdText) => assertBlocks(mdText).length > 0;

/** A signed decimal: -4.5, +3.3, −12 (U+2212), .5, 5. */
export const SIGNED = String.raw`[-+\u2212]?(?:\d+(?:\.\d*)?|\.\d+)`;
const UNSIGNED = String.raw`(?:\d+(?:\.\d*)?|\.\d+)`;
const PLUS_MINUS = String.raw`(?:\+-|±)`;

/** parseFloat that reads U+2212 as a minus sign. */
export const signedNumber = (s) => parseFloat(String(s).replace('\u2212', '-'));


/**
 * Parse ```assert blocks from EXPECTED.md.
 * Returns [{kind, ..., raw}] where kind is 'net' | 'current' | 'pin-duty' |
 * 'frequency' | 'loop-period' | 'pulse-555' | 'tone-555' | 'display-kind' |
 * 'display-bus' | 'malformed' | 'unknown'.
 */
export function parseAssertions(mdText) {
    const assertions = [];
    for (const block of assertBlocks(mdText)) {
        for (const line of block.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // net <label> V <value> +-<tol>      (value may be signed: -4.5, +3.3, −12)
            // net <label> mV <value> +-<tol>
            //
            // A node voltage is SIGNED. A split-supply bench has nodes below
            // ground, and reading the value as `[\d.]+` turned
            // `net out V -4.5 +-0.1` into an unknown assertion that was skipped
            // — the claim was never compared, and nothing said so in red.
            const netMatch = trimmed.match(new RegExp(String.raw`^net\s+(\S+)\s+(V|v|mV)\s+(${SIGNED})\s*${PLUS_MINUS}\s*(${UNSIGNED})$`));
            if (netMatch) {
                const scale = netMatch[2] === 'mV' ? 1 / 1000 : 1;
                assertions.push({
                    kind: 'net', label: netMatch[1],
                    unit: 'V', expected: signedNumber(netMatch[3]) * scale,
                    tolerance: parseFloat(netMatch[4]) * scale, raw: trimmed
                });
                continue;
            }

            // pin <name> duty <value> +-<tol>
            const pinMatch = trimmed.match(/^pin\s+(\S+)\s+duty\s+~?([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (pinMatch) {
                assertions.push({
                    kind: 'pin-duty', pin: pinMatch[1],
                    expected: parseFloat(pinMatch[2]),
                    tolerance: parseFloat(pinMatch[3]), raw: trimmed
                });
                continue;
            }

            // current <partId> mA <value> +-<tol>
            const curMatch = trimmed.match(new RegExp(String.raw`^current\s+(\S+)\s+mA\s+(${SIGNED})\s*${PLUS_MINUS}\s*(${UNSIGNED})$`));
            if (curMatch) {
                assertions.push({
                    kind: 'current', partId: curMatch[1],
                    expected: signedNumber(curMatch[2]),
                    tolerance: parseFloat(curMatch[3]), raw: trimmed
                });
                continue;
            }

            // frequency <label> Hz <value> +-<tol>
            const freqMatch = trimmed.match(/^frequency\s+(\S+)\s+Hz\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (freqMatch) {
                assertions.push({
                    kind: 'frequency', label: freqMatch[1],
                    expected: parseFloat(freqMatch[2]),
                    tolerance: parseFloat(freqMatch[3]), raw: trimmed
                });
                continue;
            }

            // refresh_ms / tick_ms: <value> [+- <tol>] | [+- <n>%]
            //
            // These are PROGRAM-LOOP periods, not circuit quantities: the
            // interval at which the FOREVER loop repeats, which is the `wait`
            // inside it. Checking them cross-checks the shipped documentation
            // against the shipped program, which is a real drift class — a
            // waveform bench once declared 100 Hz in its circuit and ran at
            // 1000.1 Hz, and its EXPECTED.md predicted a voltage that bench
            // could not produce.
            const periodMatch = trimmed.match(
                /^(refresh_ms|tick_ms)\s*:\s*([\d.]+)\s*(?:(?:\+-|±)\s*([\d.]+)(%?))?$/);
            if (periodMatch) {
                const expected = parseFloat(periodMatch[2]);
                const rawTol = periodMatch[3] === undefined ? null : parseFloat(periodMatch[3]);
                assertions.push({
                    kind: 'loop-period', key: periodMatch[1], expected,
                    // No stated tolerance means exact: the program either waits
                    // that long or the document is wrong.
                    tolerance: rawTol === null ? 0
                        : (periodMatch[4] === '%' ? expected * rawTol / 100 : rawTol),
                    raw: trimmed
                });
                continue;
            }

            // pulse_duration_ms: <value> [+- <tol>[%]]
            //
            // A 555 in monostable: t = 1.1 * R * C, where R and C are found by
            // TOPOLOGY, never by name or magnitude. Every one of these circuits
            // carries three resistors, so "the big one" would be a guess that
            // happens to work until it does not.
            const pulseMatch = trimmed.match(
                /^pulse_duration_ms\s*:\s*([\d.]+)\s*(?:(?:\+-|±)\s*([\d.]+)(%?))?$/);
            if (pulseMatch) {
                const expected = parseFloat(pulseMatch[1]);
                const rawTol = pulseMatch[2] === undefined ? null : parseFloat(pulseMatch[2]);
                assertions.push({
                    kind: 'pulse-555', expected,
                    tolerance: rawTol === null ? expected * 0.02
                        : (pulseMatch[3] === '%' ? expected * rawTol / 100 : rawTol),
                    raw: trimmed
                });
                continue;
            }

            // buzzer_tone_hz: <value> [+- <tol>[%]] — a 555 astable's frequency
            const toneMatch = trimmed.match(
                /^buzzer_tone_hz\s*:\s*([\d.]+)\s*(?:(?:\+-|±)\s*([\d.]+)(%?))?$/);
            if (toneMatch) {
                const expected = parseFloat(toneMatch[1]);
                const rawTol = toneMatch[2] === undefined ? null : parseFloat(toneMatch[2]);
                assertions.push({
                    kind: 'tone-555', expected,
                    tolerance: rawTol === null ? expected * 0.02
                        : (toneMatch[3] === '%' ? expected * rawTol / 100 : rawTol),
                    raw: trimmed
                });
                continue;
            }

            // display: <kind> [(<chip>)]   |   interface: i2c|spi|parallel
            const dispMatch = trimmed.match(/^display\s*:\s*(.+)$/);
            if (dispMatch) {
                assertions.push({ kind: 'display-kind', claim: dispMatch[1].trim(), raw: trimmed });
                continue;
            }
            const ifMatch = trimmed.match(/^interface\s*:\s*(i2c|spi|parallel)\s*$/i);
            if (ifMatch) {
                assertions.push({ kind: 'display-bus', bus: ifMatch[1].toLowerCase(), raw: trimmed });
                continue;
            }

            // A line that names a KNOWN kind and still matched none of the
            // grammars above is a claim its author meant to make and the
            // parser cannot read. Filing it under `unknown` skips it quietly,
            // which is how a negative voltage went unchecked; it is reported
            // as malformed instead, and assert-physics fails on it.
            const known = trimmed.match(/^(net|current|pin|frequency)\s/);
            if (known) {
                assertions.push({ kind: 'malformed', keyword: known[1], raw: trimmed });
                continue;
            }

            // Unknown assertion kind — explicit skip
            assertions.push({ kind: 'unknown', raw: trimmed });
        }
    }
    return assertions;
}
