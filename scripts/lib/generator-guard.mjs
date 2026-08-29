/**
 * A generator that would revert a landed repair must refuse.
 *
 * THE MEASUREMENT THAT PRODUCED THIS FILE (2026-08-29)
 * ----------------------------------------------------
 * The four pure-circuit generators are named as if they regenerate the shipped
 * corpus. They do not. Their outputs were hand-repaired afterwards and their
 * own source has drifted, so running one today does not re-derive what ships —
 * it overwrites it with something else.
 *
 * Measured, not assumed. Old generator (86a5bab) and new, run against the SAME
 * pinned siblings in a scratch tree:
 *
 *   regen-pure-circuits   pc01..pc08   BYTE-IDENTICAL, 8 of 8
 *   gen-bausatz-canon     pc81, pc82   differ — and the difference is a FIX:
 *                                      decade_counter's terminals go from the
 *                                      `["a","b"]` stub to the full
 *                                      [clk,rst,en,q0..q9,co], because
 *                                      `getDevice` is now injected and
 *                                      bw-circuit-ui takes the engine's list as
 *                                      authoritative.
 *
 * That stub is EXACTLY the defect commit 0231d74 ("AUDIT-L2: all 8 netlist
 * errors fixed") repaired by hand in the shipped files. So the engine-surface
 * fix repairs it at source — but the generators still do not emit the WIRING
 * that repair added (the 555's threshold to its timing cap, the counter's
 * q0..q9 into the LED chains). Seven shipped files carry 91 such wires:
 *
 *   pc81-led-lauflicht 15   pc82-mini-roulette 17   pc83-gluecksrad    13
 *   pc84-led-herz      17   pc85-led-lampe-puls 12   pc86-led-sanduhr  12
 *   pc88-lichtorgel     5
 *
 * Comparing shipped against regenerated at the pinned engine: pc06/pc07/pc08
 * are electrically IDENTICAL (same net partition, same LED brightness — the
 * only change is terminal ORDER and an equivalent choice of holes, so there is
 * no truth to gain by rewriting them); pc81/pc82 lose their timing capacitor to
 * a floating pair of leads; and pc05-npn-switch is simply a different circuit
 * (the generator has a series switch the shipped bench does not, and its LED
 * reads 0.0000 against the shipped 0.2916). None of that is caused by the
 * engine-surface change — the byte-identical control above proves it — and all
 * of it would be silently written over the corpus by a well-meaning `node
 * scripts/gen-*.mjs`.
 *
 * Hence the guard. It is deliberately about the FILE ON DISK, not a list of
 * example names: a name list goes stale the moment someone repairs an eighth
 * file, and the point is that nobody has to remember.
 *
 * @module
 */

import { readFileSync, existsSync } from 'node:fs';

/**
 * Wire ids a repair pass stamps. `wire_fix_*` is the marker 0231d74 used and
 * the only one in this corpus; the prefix is matched rather than the exact
 * ids so a later repair inherits the protection without editing this file.
 */
const REPAIR_ID = /^wire_fix_/;

/**
 * The hand-added wires in a circuit file, or [] when there are none / the file
 * does not exist / it is not readable as a circuit.
 *
 * @param {string} circuitPath
 * @returns {string[]} the repair wire ids, in file order
 */
export function handRepairs (circuitPath) {
    if (!existsSync(circuitPath)) return [];
    let data;
    try { data = JSON.parse(readFileSync(circuitPath, 'utf8')); } catch { return []; }
    if (!data || !Array.isArray(data.wires)) return [];
    return data.wires
        .map((w) => (w && typeof w.id === 'string' ? w.id : ''))
        .filter((id) => REPAIR_ID.test(id));
}

/**
 * Refuse to overwrite a circuit file that carries hand repairs.
 *
 * Throws rather than warning: a warning in a 90-line generator log is not
 * read, and the failure mode being prevented is silent — the file is rewritten,
 * the suite is still green because the flat twin and the manifest move with it,
 * and the repair is gone.
 *
 * `--force` is accepted so the refusal can be overridden DELIBERATELY, by
 * someone who has decided the generator is now the better source. It is not a
 * flag to reach for when this fires: the honest fix is to teach the generator
 * to emit the wiring the repair added, and then the file has no repair wires
 * left and the guard stops firing on its own.
 *
 * @param {string} circuitPath path the generator is about to write
 * @param {{force?: boolean}} [opts]
 * @throws {Error} when repairs are present and force is not set
 */
export function refuseToRevertRepairs (circuitPath, opts = {}) {
    const repairs = handRepairs(circuitPath);
    if (repairs.length === 0) return;
    if (opts.force) return;
    throw new Error(
        `${circuitPath} carries ${repairs.length} hand-added wire(s) this generator ` +
        `does not emit (${repairs.slice(0, 3).join(', ')}${repairs.length > 3 ? ', …' : ''}). ` +
        'Writing it would silently revert them. Those wires were added by commit ' +
        '0231d74 ("AUDIT-L2: all 8 netlist errors fixed") after this script last ran, ' +
        'and the script was never taught to produce them. Teach it to emit that wiring ' +
        '— then this file has no repair wires left and the guard stops firing by itself ' +
        '— or pass --force if you have decided the generator is now the better source ' +
        'and have re-measured the corpus either side.');
}

/** True when the process was started with `--force`. */
export const forced = () => process.argv.includes('--force');
