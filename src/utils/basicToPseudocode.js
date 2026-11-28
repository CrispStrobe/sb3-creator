import {CRISPBASIC_PSEUDOCODE_MARKER, hasCrispBasicPinMap, crispBasicLogicalPin} from './crispBasicMode.js';

/**
 * basicToPseudocode — BBC BASIC (numbered or structured) → the dialect.
 *
 * The other half of the BASIC lane: reads what generateBASIC emits (both
 * modes, round-trip tested) AND a useful subset of real-world BBC BASIC
 * (the CC0 example corpus is the fixture set). The reader's doctrine is
 * the C reader's: map what it can, and NAME every line it cannot — an
 * unmapped statement becomes a `# BASIC: <line>` comment plus a warning,
 * never a silent drop.
 *
 * Covered (tutorial chapter in brackets): assignments incl. %-integers
 * and $-strings, PRINT, FOR/NEXT with STEP [11], REPEAT/UNTIL [12] (BBC's
 * post-check: the first pass is duplicated ahead of the loop so Scratch's
 * pre-check `repeat until` keeps the semantics — commented, not hidden),
 * WHILE/ENDWHILE [12] (maps exactly: `REPEAT UNTIL not`), single-line and
 * multi-line IF/ELSE/ENDIF [9], DEF PROC/ENDPROC with parameters [16],
 * single-line DEF FN [17] (macro-expanded at call sites — the dialect has
 * no value-returning custom blocks yet, and inlining preserves meaning),
 * generateBASIC's own TIME-wait and VIA-poke patterns (via the REM @bw
 * header), GOTO loop shapes from our own emissions, colon-separated
 * statements, REM.
 *
 * Now also covered: INPUT (→ ask/answer), DIM/arrays [14], CLG (→ clear),
 * MODE (→ REM), GCOL (→ set pen color), MOVE/DRAW (→ go to), TIME=0
 * (→ reset timer), bw_pen% (→ pen down/up), MID$/LEN/INSTR in expressions
 * (→ letter/length/contains), INT(x+0.5) (→ round), SQR/ABS/INT (→ mathop),
 * TIME/100 (→ timer).
 *
 * Not covered, by name: multi-line FN,
 * PLOT, COLOUR, CLS, VDU, SOUND, ENVELOPE — all
 * warned per line. A GOTO that is not a recognized loop shape is warned
 * and kept as a comment.
 *
 * CrispBASIC's portable pin/time library is a deliberately refused boundary:
 * its simulated clock, electrical reads and output latches have no qualified
 * block equivalent in this reader. Live calls or definitions return ok:false
 * and no pseudocode, before unknown FNs can become 0 or PROCs become custom
 * blocks. Callers must check ok before replacing a project. REM and quoted
 * text remain ordinary comments/data, not evidence of a library call.
 *
 * @module
 */

const UNMAPPED = new Set(['PLOT', 'COLOUR', 'COLOR', 'CLS',
    'VDU', 'SOUND', 'ENVELOPE', 'DATA', 'READ', 'RESTORE',
    'WHEN', 'OTHERWISE', 'ENDCASE', 'ON', 'OSCLI', 'CALL', 'CHAIN', 'LOCAL', 'CLEAR',
    'PRINTTAB']);

const CRISPBASIC_CALLS = new Set([
    'procpinmode', 'procdigitalwrite', 'procdigitaltoggle', 'fndigitalread', 'procdelay', 'fnmillis'
]);
// Exact conventional pin/time API names only: these are not implemented by
// the portable library either. Do not reserve all PROC/FN names, or
// prefixes such as PROCdigitalWriteLog belonging to ordinary user routines.
const CRISPBASIC_UNSUPPORTED_CALLS = new Set([
    'procanalogwrite', 'fnanalogread', 'procpwm', 'proctone', 'procnotone',
    'proctoggle', 'procdelaymicroseconds', 'fnmicros',
    'procattachinterrupt', 'procdetachinterrupt'
]);
// BBC keywords can abut the next expression (PRINTFNdigitalRead, THENPROC...).
// These keyword spellings do not require a following name delimiter in the
// pinned BBCSDL lexer. Consume them before a name, but never search INSIDE a
// variable or a PROC/FN name. Uppercase compact keywords match the runtime;
// ordinary lowercase identifiers such as readFNmillis remain whole names.
// See BBCSDL@6c302988ee2a08c5f9a65fa3eb8e76bcacc6079f src/bbmain.c, keywds/lexan.
const COMPACT_BBC_KEYWORDS = ('AND ABS ACS ADVAL ASC ASN ATN COLOUR COLOR CALL CASE CHAIN CHR$ '
    + 'COS CIRCLE DEG DEF DIV DIM DRAW ENVELOPE ELSE EVAL ERROR EOR EXP ELLIPSE FOR FILL '
    + 'GOTO GET$ GET GOSUB GCOL INPUT IF INKEY$ INKEY INT INSTR( INSTALL LINE LOCAL LEFT$( '
    + 'LEN LET LOG LN MID$( MODE MOD MOVE MOUSE NEXT NOT ORIGIN OR OPENIN OPENOUT OPENUP '
    + 'OSCLI OTHERWISE PRINT PRIVATE PLOT POINT( RAD READ REPEAT RESTORE RIGHT$( RECTANGLE '
    + 'STEP SGN SIN SQR SPC STR$ STRING$( SOUND SUM SWAP SYS TAN TAB( THEN TINT TO TRACE '
    + 'UNTIL USR VDU VAL WHILE WHEN WIDTH').split(' ').sort((a, b) => b.length - a.length);

export default function basicToPseudocode(source, opts = {}) {
    const portableMode = opts.mode === 'crispbasic';
    if (opts.mode !== undefined && opts.mode !== 'legacy' && !portableMode) {
        const message = `Unknown BASIC reverse mode ${String(opts.mode)}; use legacy or crispbasic.`;
        return {ok: false, pseudocode: '', reasons: [message], warnings: [],
            diagnostics: [{code: 'crispbasic-read-mode', severity: 'error', line: 1, message}], stats: {lines: 0, mapped: 0}};
    }
    const warnings = [];
    const diagnostics = [];
    const diagnosed = new Set();
    const stats = { lines: 0, mapped: 0 };
    const mapped = () => stats.mapped++;

    // ---- split into logical statements ---------------------------------
    const stmts = [];   // { text, lineNo, sourceLine }
    for (const [physicalIndex, raw] of String(source || '').split(/\r?\n/).entries()) {
        const sourceLine = physicalIndex + 1;
        const t = raw.trim();
        if (!t) continue;
        const m = t.match(/^(\d+)\s*(.*)$/);
        const lineNo = m ? Number(m[1]) : null;
        const rest = m ? m[2] : t;
        if (!rest) continue;
        stats.lines++;
        let cur = '';
        let inStr = false;
        const parts = [];
        for (let at = 0; at < rest.length; at++) {
            const ch = rest[at];
            if (ch === '"') {
                cur += ch;
                // A doubled quote is a literal quote inside BASIC text.
                if (inStr && rest[at + 1] === '"') { cur += rest[++at]; continue; }
                inStr = !inStr;
                continue;
            }
            if (!inStr && /[A-Za-z_]/.test(ch)) {
                const tail = rest.slice(at);
                let token = tail.match(/^[A-Za-z_]\w*[%$]?/)[0];
                // REM consumes the rest of the physical line, including its
                // colons. Splitting it again used to promote hardware comments
                // such as REM write pin:PROCdelay(25) into executable commands.
                // REMfoo is valid BBC too; remfoo is an ordinary lowercase name.
                if (tail.startsWith('REM') || token.toUpperCase() === 'REM') { cur += tail; break; }
                let consumed = token.length;
                // BBC's dot abbreviations PRO./PROC. and FN. tokenize as the
                // same PROC/FN keywords. The name itself remains unabridged.
                const abbreviated = tail.match(/^(PRO(?:C)?\.|FN\.)([A-Za-z_]\w*[%$]?)/i);
                const abbreviatedEval = tail.match(/^EV(?:A(?:L)?)?\./);
                if (abbreviated) {
                    token = `${/^FN/i.test(abbreviated[1]) ? 'FN' : 'PROC'}${abbreviated[2]}`;
                    consumed = abbreviated[0].length;
                } else if (abbreviatedEval) {
                    token = 'EVAL'; consumed = abbreviatedEval[0].length;
                } else {
                    const keyword = COMPACT_BBC_KEYWORDS.find(word => tail.startsWith(word));
                    if (keyword) { token = keyword; consumed = keyword.length; }
                }
                const key = token.toLowerCase();
                const portable = CRISPBASIC_CALLS.has(key);
                const dynamic = key === 'eval';
                if (((portable && !portableMode) || dynamic || CRISPBASIC_UNSUPPORTED_CALLS.has(key)) &&
                    !diagnosed.has(`${sourceLine}:${key}`)) {
                    diagnosed.add(`${sourceLine}:${key}`);
                    const location = `Line ${sourceLine}${lineNo === null ? '' : ` (BASIC ${lineNo})`}`;
                    const message = dynamic
                        ? `${location}: To blocks cannot preserve EVAL's computed BASIC source or verify the portable calls it may execute. Keep this program as BASIC.`
                        : portable
                            ? `${location}: To blocks cannot preserve ${token}'s CrispBASIC pin/time semantics; `
                              + 'portable-library calls and definitions are not supported by this converter. Keep this program as BASIC.'
                            : `${location}: To blocks does not support ${token}; it is also outside CrispBASIC\'s `
                              + 'portable library. Conversion refused; resolve this operation in the BASIC source.';
                    diagnostics.push({code: dynamic ? 'basic-to-blocks-dynamic-source' : 'crispbasic-to-blocks-unsupported', severity: 'error',
                        line: sourceLine, basicLine: lineNo, operation: token, message});
                }
                cur += tail.slice(0, consumed);
                at += consumed - 1;
                continue;
            }
            if (ch === ':' && !inStr) { parts.push(cur); cur = ''; continue; }
            cur += ch;
        }
        parts.push(cur);
        for (const p of parts) if (p.trim()) stmts.push({ text: p.trim(), lineNo, sourceLine });
    }
    stats.lines = stmts.length;   // statements, colon-split — same unit as `mapped`
    if (diagnostics.length) {
        return {ok: false, pseudocode: '', reasons: diagnostics.map(d => d.message), warnings, diagnostics, stats};
    }

    if (portableMode) {
        const physical = [...new Map(stmts.map(statement => [statement.sourceLine, statement])).values()];
        const numbered = physical.filter(statement => statement.lineNo !== null);
        if (numbered.length && (numbered.length !== physical.length || numbered.some((statement, index) =>
            statement.lineNo <= 0 || index && statement.lineNo <= numbered[index - 1].lineNo))) {
            const message = 'Portable reverse conversion requires wholly unnumbered source or strictly increasing, unique BASIC line numbers.';
            return {ok: false, mode: 'crispbasic', pseudocode: '', reasons: [message], warnings,
                diagnostics: [{code: 'crispbasic-read-line-order', severity: 'error', line: 1, message}], stats};
        }
    }

    // ---- destructure: numbered GOTO shapes → structured statements ------
    // Recovers the exact shapes generateBASIC's numbered mode emits (and
    // any real-world code that happens to share them), GUARDED: a transform
    // applies only when no other GOTO enters the region. Anything the
    // guards reject stays a named comment downstream — restructuring never
    // guesses.
    {
        const idxOf = (lineNo) => stmts.findIndex((s) => s.lineNo === lineNo);
        const targetsOf = () => {
            const t = [];
            for (const s of stmts) {
                const g = s.text.match(/GOTO\s+(\d+)/i);
                // A self-loop (the wait-until shape) targets its own line and
                // is no obstacle to restructuring the code around it.
                if (g && Number(g[1]) !== s.lineNo) t.push(Number(g[1]));
            }
            return t;
        };
        const countTargets = (list, n) => list.filter((x) => x === n).length;
        let changed = true;
        let guard = 0;
        while (changed && guard++ < 200) {
            changed = false;
            const targets = targetsOf();
            for (let k = 0; k < stmts.length; k++) {
                const t = stmts[k].text;
                let m;
                // repeat-until: top: IF c THEN GOTO after / … / GOTO top / after:
                if ((m = t.match(/^IF\s+(.+?)\s+THEN\s+GOTO\s+(\d+)$/i)) && !/^NOT\s*\(/i.test(m[1])) {
                    const after = Number(m[2]);
                    const j = stmts.findIndex((s2, kk) => kk > k && new RegExp(`^GOTO\\s+${stmts[k].lineNo}$`, 'i').test(s2.text));
                    if (j > k && idxOf(after) === j + 1
                        && countTargets(targets, stmts[k].lineNo) === 1 && countTargets(targets, after) === 1) {
                        stmts[k] = { ...stmts[k], text: portableMode ? `WHILE NOT ((${m[1]})<>0)` : `WHILE NOT (${m[1]})` };
                        stmts[j] = { ...stmts[j], text: 'ENDWHILE' };
                        changed = true;
                        break;
                    }
                }
                // if / if-else: IF NOT (c) THEN GOTO E [… GOTO A] E: … [A:]
                if ((m = t.match(/^IF\s+NOT\s+\((.+)\)\s+THEN\s+GOTO\s+(\d+)$/i)) && Number(m[2]) !== stmts[k].lineNo) {
                    const e = idxOf(Number(m[2]));
                    if (e > k && countTargets(targets, Number(m[2])) === 1) {
                        const ge = stmts[e - 1].text.match(/^GOTO\s+(\d+)$/i);
                        if (ge && idxOf(Number(ge[1])) > e && countTargets(targets, Number(ge[1])) === 1) {
                            const a = idxOf(Number(ge[1]));
                            stmts[k] = { ...stmts[k], text: `IF ${m[1]} THEN` };
                            stmts[e - 1] = { ...stmts[e - 1], text: 'ELSE' };
                            stmts.splice(a, 0, { text: 'ENDIF', lineNo: null });
                        } else {
                            stmts[k] = { ...stmts[k], text: `IF ${m[1]} THEN` };
                            stmts.splice(e, 0, { text: 'ENDIF', lineNo: null });
                        }
                        changed = true;
                        break;
                    }
                }
                // forever: top: … GOTO top (backward, sole entry)
                if ((m = t.match(/^GOTO\s+(\d+)$/i)) && stmts[k].lineNo !== null && Number(m[1]) < stmts[k].lineNo) {
                    const top = idxOf(Number(m[1]));
                    if (top >= 0 && top < k && countTargets(targets, Number(m[1])) === 1) {
                        stmts[k] = { ...stmts[k], text: 'UNTIL FALSE' };
                        stmts.splice(top, 0, { text: 'REPEAT', lineNo: null });
                        changed = true;
                        break;
                    }
                }
            }
        }
    }

    if (portableMode) return readPortableBasic(stmts, stats);

    // ---- @bw header (our own emissions) ---------------------------------
    let device = null;
    const pins = [];
    for (const s of stmts) {
        let m = s.text.match(/^REM @bw device (\S+)/i);
        if (m) device = m[1];
        m = s.text.match(/^REM @bw pin (\S+) (\S+) (\S+)( active-low)?/i);
        if (m) pins.push({ name: m[1], where: m[2], direction: m[3], activeLow: !!m[4] });
    }
    const pinByPoke = new Map();
    for (const p of pins) {
        const bit = Number(String(p.where).replace(/^P[AB]/i, ''));
        pinByPoke.set(`${/^PB/i.test(p.where) ? 0 : 1}:${1 << bit}`, p);
    }

    // ---- FN macros (ch. 17, single-line form) ---------------------------
    const fns = new Map();
    for (const s of stmts) {
        const m = s.text.match(/^DEF\s+FN([A-Za-z_]\w*)\s*(\(([^)]*)\))?\s*=\s*(.+)$/i);
        if (m) fns.set(m[1].toUpperCase(), { params: (m[3] || '').split(',').map((x) => x.trim()).filter(Boolean), body: m[4] });
    }

    // ---- expressions ----------------------------------------------------
    const exprWarn = new Set();
    const vName = (n) => n.replace(/[%$]$/, (c) => (c === '%' ? '_i' : '_s')).toLowerCase();
    /** DIM'd 1D array names (BASIC spelling, uppercased). BBC arrays are
     *  0-based and so is the arrays extension — indices map with NO shift,
     *  which is exactly why DIM lands on `array` and not on 1-based lists. */
    const dims = new Set();
    const trExpr = (e) => {
        let x = String(e).trim();
        // Array reads first: a(i) → item i of array a — innermost first so
        // nested subscripts like a(b(0)) resolve outward.
        for (let pass = 0; pass < 4; pass++) {
            let hit = false;
            x = x.replace(/([A-Za-z_]\w*[%$]?)\(([^()]*)\)/g, (mm, name, idx) => {
                if (!dims.has(name.toUpperCase())) return mm;
                hit = true;
                return `(item ${trExpr(idx)} of array "${vName(name)}")`;
            });
            if (!hit) break;
        }
        x = x.replace(/FN([A-Za-z_]\w*)\s*(\(([^()]*)\))?/gi, (mm, name, _p, argsText) => {
            const fn = fns.get(name.toUpperCase());
            if (!fn) { exprWarn.add(`FN${name} has no single-line DEF FN — left as 0`); return '0'; }
            let body = fn.body;
            const args = (argsText || '').split(',').map((a) => a.trim());
            fn.params.forEach((prm, k) => {
                body = body.replace(new RegExp(`\\b${prm.replace(/[%$]/g, '\\$&')}\\b`, 'g'), `(${args[k] ?? '0'})`);
            });
            return `(${body})`;
        });
        x = x.replace(/RND\s*\(\s*([^)]+)\)/gi, 'pick random 1 to $1');
        // MID$(s, i, 1) → letter i of s.
        x = x.replace(/MID\$\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*1\s*\)/gi, (_, s2, idx) => `letter ${trExpr(idx)} of ${trExpr(s2)}`);
        // LEN(s) → length of s.
        x = x.replace(/LEN\s*\(\s*([^)]+)\)/gi, (_, s2) => `length of ${trExpr(s2)}`);
        // INSTR(a, b) > 0 → a contains b.
        x = x.replace(/\(INSTR\s*\(\s*([^,]+)\s*,\s*([^)]+)\)\s*>\s*0\)/gi, (_, a2, b2) => `${trExpr(a2)} contains ${trExpr(b2)}`);
        // INT(x+0.5) → round x.
        x = x.replace(/INT\s*\(\s*([^+]+)\+\s*0\.5\s*\)/gi, (_, a2) => `round ${trExpr(a2)}`);
        // SQR(x) → sqrt of x.
        x = x.replace(/\bSQR\s*\(\s*([^)]+)\)/gi, (_, a2) => `sqrt of ${trExpr(a2)}`);
        // ABS(x) → abs of x.
        x = x.replace(/\bABS\s*\(\s*([^)]+)\)/gi, (_, a2) => `abs of ${trExpr(a2)}`);
        // INT(x) → floor of x.
        x = x.replace(/\bINT\s*\(\s*([^)]+)\)/gi, (_, a2) => `floor of ${trExpr(a2)}`);
        // TIME/100 → timer.
        x = x.replace(/\(TIME\s*\/\s*100\)/gi, 'timer');
        x = x.replace(/TIME\s*\/\s*100/gi, 'timer');
        x = x.replace(/<>/g, '!=');
        x = x.replace(/\bTRUE\b/gi, '1').replace(/\bFALSE\b/gi, '0');
        x = x.replace(/[A-Za-z_]\w*[%$]?/g, (w) => {
            const up = w.toUpperCase();
            if (['MOD', 'DIV', 'AND', 'OR', 'NOT'].includes(up)) return up.toLowerCase();
            if (['PICK', 'RANDOM', 'TO'].includes(up)) return w;
            if (/^(SIN|COS|TAN|LOG|LN|EXP|GET|VAL|PI|CHR\$|STR\$)$/.test(up)) {
                exprWarn.add(`${up} has no dialect equivalent yet — kept textually`);
                return w;
            }
            return vName(w);
        });
        return x;
    };
    const trCond = (c) => {
        const m = String(c).match(/^\(*\s*\(\(\?&([0-9A-F]+) AND (\d+)\) DIV \2\)\s*\)*\s*=\s*(\d+)\s*\)*$/i);
        if (m) {
            const pin = pinByPoke.get(`${parseInt(m[1], 16) & 1}:${m[2]}`);
            if (pin) return `read ${pin.name} = ${m[3]}`;
        }
        return trExpr(c);
    };

    // ---- emission --------------------------------------------------------
    const out = [];
    let depth = 1;
    const line = (s) => out.push('  '.repeat(depth) + s);
    const comment = (s) => line(`# BASIC: ${s}`);
    const named = (s) => { warnings.push(`no dialect form for "${s.text}" — kept as a comment`); comment(s.text); };
    const procs = [];
    let i = 0;
    const at = (k) => stmts[k];

    const bodyUsesVar = (v, from) => {
        for (let k = from; k < stmts.length; k++) {
            if (/^NEXT\b/i.test(stmts[k].text)) return false;
            if (new RegExp(`\\b${v}\\b`, 'i').test(stmts[k].text)) return true;
        }
        return false;
    };

    const pokeToPin = (port, exprText) => {
        const e = exprText.replace(/\s+/g, ' ').trim();
        let m;
        // EOR before OR: "EOR 1" contains "OR 1" and must not read as set-high.
        if ((m = e.match(/\bEOR (\d+)$/i))) {
            const pin = pinByPoke.get(`${port & 1}:${m[1]}`);
            if (pin) { line(`toggle ${pin.name}`); return true; }
        }
        if ((m = e.match(/\bOR (\d+)$/i))) {
            const pin = pinByPoke.get(`${port & 1}:${m[1]}`);
            if (pin) { line(pin.activeLow ? `turn off ${pin.name}` : `turn on ${pin.name}`); return true; }
        }
        if ((m = e.match(/\bAND (\d+)$/i))) {
            const pin = pinByPoke.get(`${port & 1}:${255 - Number(m[1])}`);
            if (pin) { line(pin.activeLow ? `turn on ${pin.name}` : `turn off ${pin.name}`); return true; }
        }
        if (port === 2 || port === 3) return true;   // DDR: implied by PIN declarations
        return false;
    };

    // walk(stopRe): dispatch statements until one matches stopRe (leaving i
    // pointing AT it) or the input ends.
    const walk = (stopRe) => {
        for (; i < stmts.length; i++) {
            if (stopRe && stopRe.test(stmts[i].text)) return;
            dispatch(stmts[i]);
        }
    };

    const dispatch = (s) => {
        const t = s.text;
        let m;
        if (/^REM/.test(t) || /^REM\b/i.test(t)) {
            if (!/^REM @bw /i.test(t) && !/^REM generated by/i.test(t)) comment(t.replace(/^REM\s*/i, ''));
            mapped(); return;
        }
        if (/^(END|STOP)$/i.test(t)) { mapped(); return; }
        if (/^ENDPROC$/i.test(t)) {
            warnings.push('early ENDPROC — the dialect has no early return; kept as a comment');
            comment(t); return;
        }
        if (/^DEF\s+FN/i.test(t)) { mapped(); return; }   // consumed as macros
        if ((m = t.match(/^DEF\s+PROC([A-Za-z_]\w*)\s*(\(([^)]*)\))?$/i))) {
            const params = (m[3] || '').split(',').map((x) => x.trim()).filter(Boolean).map(vName);
            const start = out.length;
            const saved = depth;
            depth = 1;
            i++;
            walk(/^ENDPROC$/i);
            const body = out.splice(start);
            depth = saved;
            // generateBASIC names come out as PROCdo_<name> (the emitter's
            // proccode mangle); strip the prefix so the round trip is a
            // fixed point instead of accreting do_do_….
            procs.push({ name: vName(m[1]).replace(/^_/, '').replace(/^do_/, ''), params, body });
            mapped(); return;
        }
        if ((m = t.match(/^PROC([A-Za-z_]\w*)\s*(\(([^)]*)\))?$/i))) {
            const args = (m[3] || '').split(',').filter((x) => x.trim()).map((x) => trExpr(x));
            line(`${vName(m[1]).replace(/^_/, '').replace(/^do_/, '')}${args.length ? ' ' + args.join(' ') : ''}`);
            mapped(); return;
        }
        if ((m = t.match(/^([a-z_]\w*)\s*=\s*TIME\+(.+)\*100$/i))) {
            const nxt = at(i + 1);
            if (nxt && new RegExp(`^REPEAT UNTIL TIME>=${m[1]}$`, 'i').test(nxt.text)) {
                line(`wait ${trExpr(m[2])} seconds`);
                mapped(); mapped(); i++;
                return;
            }
        }
        if ((m = t.match(/^\?&([0-9A-F]+)\s*=\s*(.+)$/i))) {
            if (pokeToPin(parseInt(m[1], 16) & 3, m[2])) { mapped(); return; }
            named(s); return;
        }
        if ((m = t.match(/^DIM\s+([A-Za-z_]\w*[%$]?)\s*\(\s*(\d+)\s*\)$/i))) {
            // BBC DIM a(n) makes 0..n inclusive; the arrays extension is
            // 0-based too (feature parity by design) — n+1 zeros, no shift.
            dims.add(m[1].toUpperCase());
            line(`new array "${vName(m[1])}" = [${Array(Number(m[2]) + 1).fill(0).join(',')}]`);
            mapped();
            return;
        }
        if ((m = t.match(/^DIM\s+/i))) {
            warnings.push(`only 1D numeric DIM maps to the arrays extension so far — "${t}" kept as a comment`);
            comment(t);
            return;
        }
        if ((m = t.match(/^([A-Za-z_]\w*[%$]?)\s*\(([^()]*)\)\s*=\s*(.+)$/)) && dims.has(m[1].toUpperCase())) {
            line(`set item ${trExpr(m[2])} of array "${vName(m[1])}" to ${/^".*"$/.test(m[3].trim()) ? JSON.stringify(m[3].trim().slice(1, -1)) : trExpr(m[3])}`);
            mapped();
            return;
        }
        if ((m = t.match(/^CASE\s+(.+?)\s+OF$/i))) {
            // CASE (ch. 10) → an IF/ELSE chain on the subject expression.
            const subj = trExpr(m[1]);
            const branches = [];
            let otherwise = null;
            i++;
            while (i < stmts.length && !/^ENDCASE$/i.test(stmts[i].text)) {
                let w;
                if ((w = stmts[i].text.match(/^WHEN\s+(.+)$/i))) {
                    const vals = w[1].split(',').map((x) => trExpr(x));
                    branches.push({ cond: vals.map((vv) => `${subj} = ${vv}`).join(' or '), start: out.length });
                    branches[branches.length - 1].mark = out.length;
                    i++;
                    const collectStart = out.length;
                    const saved = depth;
                    depth = 0;
                    walk(/^(WHEN\b|OTHERWISE$|ENDCASE$)/i);
                    depth = saved;
                    branches[branches.length - 1].body = out.splice(collectStart);
                    continue;
                }
                if (/^OTHERWISE$/i.test(stmts[i].text)) {
                    i++;
                    const collectStart = out.length;
                    const saved = depth;
                    depth = 0;
                    walk(/^(WHEN\b|ENDCASE$)/i);
                    depth = saved;
                    otherwise = out.splice(collectStart);
                    continue;
                }
                i++;   // stray statement before the first WHEN — skip
            }
            const emitChain = (k) => {
                if (k >= branches.length) {
                    if (otherwise) out.push(...otherwise.map((l) => '  '.repeat(depth) + l));
                    return;
                }
                line(`IF (${branches[k].cond}) THEN:`);
                depth++;
                out.push(...branches[k].body.map((l) => '  '.repeat(depth) + l));
                depth--;
                if (k + 1 < branches.length || otherwise) {
                    line('ELSE:');
                    depth++;
                    emitChain(k + 1);
                    depth--;
                }
            };
            emitChain(0);
            mapped(); mapped();
            return;
        }
        // INPUT → ask/answer. Two forms: PRINT question / INPUT var$ → ask, or INPUT var$.
        if ((m = t.match(/^INPUT\s+(.+)$/i))) {
            const vr = vName(m[1].trim());
            // Check if the previous output line was a PRINT (the question).
            const prev = out[out.length - 1];
            const prevMatch = prev && prev.match(/^(\s*)print (.+)$/);
            if (prevMatch) {
                out[out.length - 1] = prevMatch[1] + `ask ${prevMatch[2]} and wait`;
            } else {
                line('ask "" and wait');
            }
            line(`set ${vr} to answer`);
            mapped(); return;
        }
        // CLG → clear (pen).
        if (/^CLG$/i.test(t)) { line('clear'); mapped(); return; }
        // MODE n → REM (graphics init).
        if (/^MODE\b/i.test(t)) { comment(t); mapped(); return; }
        // TIME=0 → reset timer.
        if (/^TIME\s*=\s*0$/i.test(t)) { line('reset timer'); mapped(); return; }
        // bw_pen%=TRUE/FALSE → pen down/up.
        if (/^bw_pen%\s*=\s*TRUE$/i.test(t)) { line('pen down'); mapped(); return; }
        if (/^bw_pen%\s*=\s*FALSE$/i.test(t)) { line('pen up'); mapped(); return; }
        // GCOL color → set pen color.
        if ((m = t.match(/^GCOL\s+\d+\s*,\s*(.+)$/i))) { line(`set pen color to ${trExpr(m[1])}`); mapped(); return; }
        // MOVE x,y → go to (pen-space coords: reverse the *4+640/512 transform).
        if ((m = t.match(/^MOVE\s+(.+?)\s*,\s*(.+)$/i))) {
            line(`go to x: ${trExpr(m[1])} y: ${trExpr(m[2])}`);
            mapped(); return;
        }
        // DRAW x,y → pen draw (same coords).
        if ((m = t.match(/^DRAW\s+(.+?)\s*,\s*(.+)$/i))) {
            line(`go to x: ${trExpr(m[1])} y: ${trExpr(m[2])}`);
            mapped(); return;
        }
        // BASIC text has no escapes; the dialect's text does (task D6), so a
        // backslash is written as one: JSON.stringify spells the dialect's.
        if ((m = t.match(/^PRINT\s+"([^"]*)"$/i))) { line(`print ${JSON.stringify(m[1])}`); mapped(); return; }
        if ((m = t.match(/^PRINT\s+([^;,'"]+)$/i))) { line(`print ${trExpr(m[1])}`); mapped(); return; }
        if ((m = t.match(/^FOR\s+([A-Za-z_]\w*[%$]?)\s*=\s*(.+?)\s+TO\s+(.+?)(\s+STEP\s+(.+))?$/i))) {
            const v = vName(m[1]);
            const from = trExpr(m[2]); const to = trExpr(m[3]); const step = m[5] ? trExpr(m[5]) : '1';
            const plain = from === '1' && step === '1' && !bodyUsesVar(m[1], i + 1);
            if (plain) line(`REPEAT ${to}:`);
            else { line(`set ${v} to ${from}`); line(`REPEAT ((${to}) - (${from}) + 1):`); }
            depth++;
            i++;
            walk(new RegExp(`^NEXT(\\s+\\S+)?$`, 'i'));
            if (!plain) line(`change ${v} by ${step}`);
            depth--;
            mapped(); mapped();
            return;
        }
        if ((m = t.match(/^REPEAT UNTIL\s+(.+)$/i)) && !/^TIME\s*>=/i.test(m[1])) {
            // The structured wait-until: an empty-bodied REPEAT UNTIL.
            // (TIME>= is excluded: those belong to the two-line wait shape.)
            line(`wait until ${trCond(m[1])}`);
            mapped();
            return;
        }
        if (/^REPEAT$/i.test(t)) {
            const start = out.length;
            depth++;
            i++;
            walk(/^UNTIL\b/i);
            depth--;
            const um = at(i) && at(i).text.match(/^UNTIL\s+(.+)$/i);
            const body = out.splice(start);
            if (um && /^FALSE$/i.test(um[1].trim())) {
                // REPEAT … UNTIL FALSE is the structured forever.
                line('FOREVER:');
                out.push(...body);
                mapped(); mapped();
                return;
            }
            const cond = um ? trCond(um[1]) : '1';
            line('# first pass (BASIC REPEAT tests after the body)');
            out.push(...body.map((l) => l.slice(2)));
            line(`REPEAT UNTIL ${cond}:`);
            out.push(...body);
            mapped(); mapped();
            return;
        }
        if ((m = t.match(/^WHILE\s+(.+)$/i))) {
            // WHILE NOT (x) reads back as REPEAT UNTIL x — no double negation,
            // which is what makes the NUMBERED round trip a fixed point too.
            const inner = m[1].match(/^NOT\s+\((.+)\)$/i);
            line(`REPEAT UNTIL ${inner ? trCond(inner[1]) : `not (${trCond(m[1])})`}:`);
            depth++;
            i++;
            walk(/^ENDWHILE$/i);
            depth--;
            mapped(); mapped();
            return;
        }
        if (/^UNTIL FALSE$/i.test(t)) { mapped(); return; }
        if ((m = t.match(/^IF\s+NOT\s+\((.+)\)\s+THEN\s+GOTO\s+(\d+)$/i)) && Number(m[2]) === s.lineNo) {
            // Our numbered wait-until: a self-targeting guarded GOTO.
            line(`wait until ${trCond(m[1])}`);
            mapped();
            return;
        }
        if ((m = t.match(/^IF\s+(.+?)\s+THEN$/i))) {
            line(`IF (${trCond(m[1])}) THEN:`);
            depth++;
            i++;
            walk(/^(ELSE|ENDIF)$/i);
            if (at(i) && /^ELSE$/i.test(at(i).text)) {
                depth--;
                line('ELSE:');
                depth++;
                i++;
                walk(/^ENDIF$/i);
            }
            depth--;
            mapped(); mapped();
            return;
        }
        if ((m = t.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/i)) || (m = t.match(/^IF\s+(.+?)\s+((?:PROC|ENDPROC|PRINT|GOTO)\b.*)$/i))) {
            line(`IF (${trCond(m[1])}) THEN:`);
            depth++;
            dispatch({ text: m[2].trim(), lineNo: s.lineNo });
            depth--;
            mapped();
            return;
        }
        if (/^GOTO\s+\d+$/i.test(t)) {
            warnings.push(`unstructured "${t}" — restructure, or keep it as BASIC`);
            comment(t);
            return;
        }
        if ((m = t.match(/^([A-Za-z_]\w*[%$]?)\s*=\s*(.+)$/))) {
            const v = vName(m[1]);
            const rhs = m[2].trim();
            const inc = rhs.match(new RegExp(`^${m[1].replace(/[%$]/g, '\\$&')}\\s*\\+\\s*(.+)$`));
            if (inc) line(`change ${v} by ${trExpr(inc[1])}`);
            else line(`set ${v} to ${/^".*"$/.test(rhs) ? rhs : trExpr(rhs)}`);
            mapped();
            return;
        }
        named(s);
    };

    walk(null);

    // ---- assemble --------------------------------------------------------
    const head = [`DEVICE ${(device || 'EATER6502').toUpperCase()}`];
    for (const p of pins) head.push(`PIN ${p.name} = ${p.where.toUpperCase()} ${p.direction.toUpperCase()}${p.activeLow ? ' ACTIVE LOW' : ''}`);
    head.push('');
    for (const pr of procs) {
        head.push(`DEFINE ${pr.name}${pr.params.map((p) => ` (${p})`).join('')}:`);
        head.push(...pr.body);
        head.push('');
    }
    head.push('WHEN flag clicked:');
    for (const w of exprWarn) warnings.push(w);
    return { ok: true, pseudocode: head.join('\n') + '\n' + out.join('\n') + '\n',
        reasons: [], warnings, diagnostics, stats };
}

/** Strict source-to-source bridge. The resulting dialect must be compiled
 * with mode:'crispbasic' and run in a fresh portable host, not executed as an
 * ordinary Scratch project. In particular, solved reads and output latches
 * are different operations, and the clock advances only on explicit delays. */
function readPortableBasic(stmts, stats) {
    const diagnostics = [], variables = new Set(), pinIds = new Map(), pinNames = new Set();
    const capabilities = Object.freeze({pseudocode: true, blocks: false, requiredRuntime: 'crispbasic',
        simulationABI: 2, freshRun: true, clock: 'explicit-integer-milliseconds'});
    let current = stmts[0], device = null;
    const fail = (code, message, statement = current) => {
        const line = statement?.sourceLine ?? 1, basicLine = statement?.lineNo ?? null;
        const diagnostic = {code: `crispbasic-read-${code}`, severity: 'error', line, basicLine,
            message: `Line ${line}${basicLine === null ? '' : ` (BASIC ${basicLine})`}: ${message}`};
        diagnostics.push(diagnostic);
        throw diagnostic;
    };
    const integer = text => /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) ? Number(text) : null;
    const logical = where => crispBasicLogicalPin(device, where);
    const lookup = (text, write = false) => {
        const id = integer(text), pin = pinIds.get(id);
        if (!pin || id === null) fail('pin', `Unknown or computed logical pin ${text}; declare a matching REM @bw pin.`);
        if (write && pin.direction !== 'output') fail('pin-mode', `Cannot write input pin ${pin.name}.`);
        return pin;
    };
    const node = (text, kind = 'number', value) => ({text, kind, value});
    const literal = value => node(String(value), value === 0 || value === 1 ? 'bit' : value === -1 ? 'bbc-bool' : 'number', value);
    const truth = n => n.condition ?? `(${n.text} != 0)`;
    const predicate = (condition, kind = 'bbc-bool') => ({text: null, condition, kind});
    const requireNumber = n => {
        if (n.text === null) fail('boolean-value', 'A comparison embedded in arithmetic needs an explicit numeric assignment before conversion.');
        return n.text;
    };
    const scalar = name => {
        // The portable generator emits lowercase, unsuffixed numeric names.
        // BBC %-integer coercion, $-strings and case-distinct aliases need a
        // separate type contract; never erase these suffixes in this mode.
        if (!/^[a-z_][a-z0-9_]*$/.test(name) || /^bw_/.test(name)) {
            fail('variable', `Variable ${name} is outside the portable lowercase numeric scalar subset.`);
        }
        const mapped = `cb_${name}`;
        variables.add(mapped);
        return mapped;
    };
    const expression = source => {
        const tokens = [];
        const input = String(source).trim();
        let p = 0;
        while (p < input.length) {
            if (/\s/.test(input[p])) { p++; continue; }
            const match = input.slice(p).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?|^[A-Za-z_][A-Za-z0-9_]*[%$]?|^(?:<>|<=|>=|[()+\-*/=<>!,])/);
            if (!match) fail('expression', `Unsupported expression near ${input.slice(p)}.`);
            tokens.push(match[0]); p += match[0].length;
        }
        let at = 0;
        const take = expected => {
            if (tokens[at] !== expected) fail('expression', `Expected ${expected} in ${input}.`);
            at++;
        };
        const prec = {OR: 1, AND: 2, '=': 3, '<>': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '+': 4, '-': 4, '*': 5, '/': 5};
        const isBBCBool = n => n.kind === 'bbc-bool' || n.value === 0;
        const parse = (minimum = 0) => {
            const token = tokens[at++];
            let left;
            if (token === '(') { left = parse(); take(')'); }
            else if (token === '+' || token === '-') {
                const value = parse(6);
                left = value.value !== undefined ? literal(token === '-' ? -value.value : value.value) :
                    value.condition !== undefined ? predicate(value.condition, token === '+' ? value.kind : value.kind === 'bit' ? 'bbc-bool' : 'bit') :
                    node(`(${token}${value.text})`);
            } else if (token === 'NOT') {
                const value = parse(3);
                if (!isBBCBool(value)) fail('bitwise', 'BBC NOT requires a proven -1/0 Boolean operand; numeric bitwise NOT has no portable Boolean mapping.');
                left = predicate(`not (${truth(value)})`);
            } else if (token === 'TRUE') left = literal(-1);
            else if (token === 'FALSE') left = literal(0);
            else if (token !== undefined && /^(?:\d|\.)/.test(token)) {
                const value = Number(token);
                if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) fail('number', `Numeric literal ${token} is outside the portable finite safe range.`);
                left = literal(value);
            } else if (token === 'FNdigitalRead') {
                take('('); const pin = lookup(tokens[at++]); take(')');
                const read = `(read ${pin.name})`;
                left = node(pin.activeLow ? `(1 - ${read})` : read, 'bit');
            } else if (token === 'FNmillis') {
                // timer is seconds; rounding recovers the host's exact integer
                // milliseconds after the floating division/multiplication.
                left = node('(round (timer * 1000))');
            } else if (token === 'ABS' || token === 'INT') {
                take('('); const value = parse(); take(')');
                left = value.condition !== undefined ? predicate(value.condition, token === 'ABS' ? 'bit' : value.kind) :
                    node(`(${token === 'ABS' ? 'abs' : 'floor'} of (${value.text}))`,
                        token === 'ABS' && isBBCBool(value) ? 'bit' : value.kind === 'bit' ? 'bit' : 'number');
            } else if (token && /^[a-z_][a-z0-9_]*$/.test(token)) left = node(scalar(token));
            else fail('expression', `Unsupported token ${token ?? '(end)'} in ${input}.`);
            while (at < tokens.length && prec[tokens[at]] !== undefined && prec[tokens[at]] >= minimum) {
                const op = tokens[at++], right = parse(prec[op] + 1);
                if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
                    if (left.condition !== undefined && right.value === 0) {
                        const positive = left.kind === 'bit';
                        const same = op === '<>' || op === (positive ? '>' : '<');
                        const inverse = op === '=' || op === (positive ? '<=' : '>=');
                        if (!same && !inverse) fail('constant-predicate', 'This comparison has a constant result but its operand must still be evaluated; use an explicit numeric assignment first.');
                        left = same ? predicate(left.condition) : predicate(`not (${left.condition})`);
                    } else {
                        left = predicate(`(${requireNumber(left)} ${op === '<>' ? '!=' : op} ${requireNumber(right)})`);
                    }
                } else if (op === 'AND' || op === 'OR') {
                    if (!isBBCBool(left) || !isBBCBool(right)) fail('bitwise', `BBC ${op} requires proven -1/0 Boolean operands.`);
                    left = predicate(`(${truth(left)}) ${op.toLowerCase()} (${truth(right)})`);
                } else {
                    const bit = op === '-' && left.value === 1 && right.kind === 'bit';
                    left = node(`(${requireNumber(left)} ${op} ${requireNumber(right)})`, bit ? 'bit' : 'number');
                }
            }
            return left;
        };
        const result = parse();
        if (at !== tokens.length) fail('expression', `Unexpected token ${tokens[at]} in ${input}.`);
        return result;
    };
    try {
        // Metadata provides names, never executable authority. Every declaration
        // must match exactly one static mode call before executable statements.
        const declarations = [];
        for (const s of stmts) {
            current = s;
            let m;
            if ((m = /^REM @bw device ([a-z0-9-]+)$/i.exec(s.text))) {
                if (device !== null) fail('device', 'Multiple device headers are ambiguous.');
                device = m[1].toLowerCase();
            } else if (/^REM @bw device/i.test(s.text)) fail('device', 'Malformed portable device header.');
            if ((m = /^REM @bw pin ([a-z_][a-z0-9_]*) ([A-Z0-9.]+) (input|output)( active-low)?$/i.exec(s.text))) {
                declarations.push({name: m[1], where: m[2].toUpperCase(), direction: m[3].toLowerCase(), activeLow: !!m[4], statement: s});
            } else if (/^REM @bw pin/i.test(s.text)) fail('pin', 'Malformed portable pin header.');
        }
        if (device && !hasCrispBasicPinMap(device)) fail('device', `DEVICE ${device} has no qualified reverse pin map.`);
        for (const declaration of declarations) {
            current = declaration.statement;
            const id = logical(declaration.where), key = declaration.name.toLowerCase();
            if (id === null || pinIds.has(id) || pinNames.has(key)) fail('pin', `Invalid or duplicate pin declaration ${declaration.name} (${declaration.where}).`);
            pinIds.set(id, {...declaration, id}); pinNames.add(key);
        }
        const configured = new Set(), out = [];
        let cursor = 0, bodyStarted = false, canvasInitialized = false, topEnded = false;
        const renderPosition = 'IF bw_pen% THEN DRAW bw_x%*4+640,bw_y%*4+512 ELSE MOVE bw_x%*4+640,bw_y%*4+512';
        const canvasInteger = (text, offset) => {
            const value = Number(text);
            if (!/^-?\d+$/.test(text) || !Number.isSafeInteger(value) || value * 4 + offset < -32768 || value * 4 + offset > 32767) {
                fail('canvas', 'Generated canvas coordinates require integer positions representable by the signed 16-bit VDU path.');
            }
            return value;
        };
        const emit = (text, depth) => out.push(`${'  '.repeat(depth)}${text}`);
        let temporary = 0;
        const numberText = (value, depth) => {
            if (value.text !== null) return value.text;
            let name;
            do { name = `cb_truth_${temporary++}`; }
            while (variables.has(name) || stmts.some(statement => new RegExp(`\\b${name.slice(3)}\\b`).test(statement.text)));
            variables.add(name);
            emit(`IF ${truth(value)} THEN:`, depth);
            emit(`set ${name} to ${value.kind === 'bit' ? 1 : -1}`, depth + 1);
            emit('ELSE:', depth);
            emit(`set ${name} to 0`, depth + 1);
            return name;
        };
        const begin = () => {
            if (configured.size !== pinIds.size) fail('pin-mode', 'Every declared pin requires exactly one matching PROCpinMode before the program body.');
            bodyStarted = true;
        };
        const walk = (depth, closers = []) => {
            while (cursor < stmts.length) {
                const s = stmts[cursor]; current = s;
                const t = s.text;
                if (closers.some(close => close.test(t))) return;
                let m;
                if (/^REM/.test(t) || /^REM\b/i.test(t)) {
                    if (!/^REM (?:@bw |generated by)/i.test(t)) emit(`# BASIC: ${t.replace(/^REM\s*/i, '')}`, depth);
                    cursor++; continue;
                }
                if ((m = /^PROCpinMode\((\d+),"(input|input-pullup|output)"\)$/.exec(t))) {
                    const pin = lookup(m[1]);
                    const expected = pin.direction === 'output' ? 'output' : pin.activeLow ? 'input-pullup' : 'input';
                    if (bodyStarted || configured.has(pin.id) || [...pinIds.keys()][configured.size] !== pin.id || m[2] !== expected) fail('pin-mode', 'Dynamic, repeated or mismatched pin modes cannot become static PIN declarations.');
                    configured.add(pin.id); cursor++; continue;
                }
                begin();
                if ((m = /^PROCdigitalWrite\((\d+),(.+)\)$/.exec(t))) {
                    const pin = lookup(m[1], true), value = expression(m[2]);
                    if (value.kind !== 'bit') fail('digital-value', 'Digital writes require a proven 0/1 value; arbitrary nonzero BASIC values must retain their runtime error.');
                    if (value.condition !== undefined) {
                        emit(`IF ${truth(value)} THEN:`, depth); emit(`set ${pin.name} high`, depth + 1);
                        emit('ELSE:', depth); emit(`set ${pin.name} low`, depth + 1);
                    } else emit(value.value === 0 || value.value === 1 ? `set ${pin.name} ${value.value ? 'high' : 'low'}` : `set ${pin.name} to ${value.text}`, depth);
                } else if ((m = /^PROCdigitalToggle\((\d+)\)$/.exec(t))) {
                    emit(`toggle ${lookup(m[1], true).name}`, depth);
                } else if ((m = /^PROCdelay\((\d+)\)$/.exec(t))) {
                    const milliseconds = integer(m[1]);
                    if (milliseconds === null || milliseconds > 2147483647) fail('delay', 'Delay must be a literal integer from 0 through 2147483647 milliseconds.');
                    emit(`wait ${milliseconds / 1000} seconds`, depth);
                } else if (/^PROCdelay\b/.test(t)) fail('delay', 'Computed delays require an integer/range proof; use an explicit integer millisecond duration.');
                else if ((m = /^PRINT\s+"((?:[^"]|"")*)"$/.exec(t))) emit(`print ${JSON.stringify(m[1].replace(/""/g, '"'))}`, depth);
                else if ((m = /^PRINT\s+(.+)$/.exec(t))) emit(`print ${numberText(expression(m[1]), depth)}`, depth);
                else if ((m = /^([a-z_][a-z0-9_]*)\s*=\s*(.+)$/.exec(t))) emit(`set ${scalar(m[1])} to ${numberText(expression(m[2]), depth)}`, depth);
                else if ((m = /^FOR ([a-z_][a-z0-9_]*)=1 TO (\d+)$/.exec(t))) {
                    const count = integer(m[2]);
                    if (count === null || count < 1 || count > 1000000) fail('for', 'FOR conversion supports literal iteration counts from 1 through 1000000.');
                    const name = m[1];
                    const mentions = stmts.filter(statement => new RegExp(`\\b${name}\\b`).test(statement.text));
                    if (mentions.length !== 2) fail('for', `FOR counter ${name} is observed or reused; its post-loop value cannot be dropped.`);
                    emit(`REPEAT ${count}:`, depth); cursor++;
                    walk(depth + 1, [/^NEXT\b/]);
                    if (stmts[cursor]?.text !== `NEXT ${name}`) fail('structure', `Expected NEXT ${name}.`);
                } else if ((m = /^IF (.+) THEN$/.exec(t))) {
                    emit(`IF ${truth(expression(m[1]))} THEN:`, depth); cursor++;
                    walk(depth + 1, [/^ELSE$/, /^ENDIF$/]);
                    if (stmts[cursor]?.text === 'ELSE') {
                        emit('ELSE:', depth); cursor++; walk(depth + 1, [/^ENDIF$/]);
                    }
                    if (stmts[cursor]?.text !== 'ENDIF') fail('structure', 'Expected ENDIF.');
                } else if ((m = /^WHILE (.+)$/.exec(t))) {
                    emit(`REPEAT UNTIL not (${truth(expression(m[1]))}):`, depth); cursor++;
                    walk(depth + 1, [/^ENDWHILE$/]);
                    if (stmts[cursor]?.text !== 'ENDWHILE') fail('structure', 'Expected ENDWHILE.');
                } else if (t === 'REPEAT') {
                    emit('FOREVER:', depth); cursor++; walk(depth + 1, [/^UNTIL\b/]);
                    if (stmts[cursor]?.text !== 'UNTIL FALSE') fail('structure', 'Only REPEAT ... UNTIL FALSE has a qualified portable mapping.');
                } else if (t === 'END') {
                    // Preserve early termination too: END is not a harmless
                    // separator which permits following statements to execute.
                    emit('stop all', depth);
                    if (depth === 1) topEnded = true;
                } else if (t === 'bw_x%=0' && stmts[cursor + 1]?.text === 'bw_y%=0' &&
                    stmts[cursor + 2]?.text === 'bw_dir%=90' && stmts[cursor + 3]?.text === 'bw_pen%=FALSE') {
                    if (canvasInitialized || depth !== 1 || out.some(line => !line.trimStart().startsWith('#'))) {
                        fail('canvas', 'Canvas initialization must appear once before executable statements.');
                    }
                    canvasInitialized = true; cursor += 3;
                } else if (/^bw_pen%=(TRUE|FALSE)$/.test(t)) emit(t.endsWith('TRUE') ? 'pen down' : 'pen up', depth);
                else if ((m = /^bw_x%=(-?\d+)$/.exec(t)) && /^bw_y%=-?\d+$/.test(stmts[cursor + 1]?.text || '') &&
                    stmts[cursor + 2]?.text === renderPosition) {
                    if (!canvasInitialized) fail('canvas', 'Generated coordinate writes require the complete initial canvas state.');
                    const y = stmts[cursor + 1].text.slice('bw_y%='.length);
                    emit(`go to x: ${canvasInteger(m[1], 640)} y: ${canvasInteger(y, 512)}`, depth);
                    cursor += 2;
                } else if ((m = /^bw_([xy])%=(-?\d+)$/.exec(t)) && stmts[cursor + 1]?.text === renderPosition) {
                    if (!canvasInitialized) fail('canvas', 'Generated coordinate writes require the complete initial canvas state.');
                    emit(`set ${m[1]} to ${canvasInteger(m[2], m[1] === 'x' ? 640 : 512)}`, depth); cursor++;
                } else if ((m = /^PROCpen_colour\(([0-7])\)$/.exec(t))) {
                    const definition = stmts.findIndex(statement => statement.text === 'DEF PROCpen_colour(c%)');
                    if (definition < 0 || stmts.filter(statement => /^DEF PROCpen_colour/.test(statement.text)).length !== 1 || stmts[definition + 1]?.text !== 'GCOL 0,(c% MOD 8)+1' || stmts[definition + 2]?.text !== 'ENDPROC' ||
                        !stmts.slice(0, definition).some(statement => statement.text === 'END')) fail('canvas', 'The exact generated pen-colour helper is required.');
                    emit(`set pen color to ${m[1]}`, depth);
                } else if (t === 'DEF PROCpen_colour(c%)' && stmts[cursor + 1]?.text === 'GCOL 0,(c% MOD 8)+1' && stmts[cursor + 2]?.text === 'ENDPROC') {
                    if (depth !== 1 || !topEnded) fail('canvas', 'Pen helper definitions must follow top-level END.');
                    cursor += 2;
                } else if (t === 'CLG') emit('clear', depth);
                else if ((m = /^(MOVE|DRAW) (-?\d+),(-?\d+)$/.exec(t))) {
                    const x = Number(m[2]), y = Number(m[3]);
                    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x < -32768 || x > 32767 || y < -32768 || y > 32767 ||
                        (x - 640) % 4 || (y - 512) % 4) fail('canvas', 'Canvas coordinates must be signed 16-bit values on the generator\'s four-unit grid.');
                    emit(m[1] === 'DRAW' ? 'pen down' : 'pen up', depth);
                    emit(`go to x: ${(x - 640) / 4} y: ${(y - 512) / 4}`, depth);
                } else if ((m = /^GCOL 0,([1-8])$/.exec(t))) emit(`set pen color to ${Number(m[1]) - 1}`, depth);
                else fail('statement', `Unsupported portable statement "${t}"; conversion produces no partial pseudocode.`);
                stats.mapped++;
                cursor++;
            }
        };
        walk(1);
        if (configured.size !== pinIds.size) fail('pin-mode', 'Missing portable pin-mode prelude.');
        const header = [CRISPBASIC_PSEUDOCODE_MARKER, '# Requires CrispBASIC mode and a fresh portable simulation host; not generic Blocks execution.'];
        if (device) header.push(`DEVICE ${device.toUpperCase()}`);
        for (const pin of pinIds.values()) header.push(`PIN ${pin.name} = ${pin.where} ${pin.direction.toUpperCase()}${pin.activeLow ? ' ACTIVE LOW' : ''}`);
        for (const name of variables) header.push(`GLOBAL ${name}`);
        header.push('', 'WHEN flag clicked:');
        return {ok: true, mode: 'crispbasic', pseudocode: `${header.join('\n')}\n${out.join('\n')}\n`,
            reasons: [], warnings: ['Portable source round trip requires CrispBASIC execution; To blocks is not qualified.'], diagnostics, stats, capabilities};
    } catch (error) {
        if (!diagnostics.includes(error)) throw error;
        return {ok: false, mode: 'crispbasic', pseudocode: '', reasons: diagnostics.map(d => d.message),
            warnings: [], diagnostics, stats, capabilities};
    }
}
