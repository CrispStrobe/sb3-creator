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
 * Not covered, by name: CASE [10], DIM/arrays [14], multi-line FN, INPUT,
 * graphics/VDU statements (MODE, GCOL, DRAW, PLOT, COLOUR, CLS, …) — all
 * warned per line. A GOTO that is not a recognized loop shape is warned
 * and kept as a comment.
 *
 * @module
 */

const UNMAPPED = new Set(['MODE', 'GCOL', 'DRAW', 'PLOT', 'MOVE', 'COLOUR', 'COLOR', 'CLS',
    'CLG', 'VDU', 'SOUND', 'ENVELOPE', 'INPUT', 'DIM', 'DATA', 'READ', 'RESTORE', 'CASE',
    'WHEN', 'OTHERWISE', 'ENDCASE', 'ON', 'OSCLI', 'CALL', 'CHAIN', 'LOCAL', 'CLEAR',
    'PRINTTAB']);

export default function basicToPseudocode(source, opts = {}) {
    void opts;
    const warnings = [];
    const stats = { lines: 0, mapped: 0 };
    const mapped = () => stats.mapped++;

    // ---- split into logical statements ---------------------------------
    const stmts = [];   // { text, lineNo }
    for (const raw of String(source || '').split(/\r?\n/)) {
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
        for (const ch of rest) {
            if (ch === '"') inStr = !inStr;
            if (ch === ':' && !inStr) { parts.push(cur); cur = ''; continue; }
            cur += ch;
        }
        parts.push(cur);
        for (const p of parts) if (p.trim()) stmts.push({ text: p.trim(), lineNo });
    }
    stats.lines = stmts.length;   // statements, colon-split — same unit as `mapped`

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
                        stmts[k] = { text: `WHILE NOT (${m[1]})`, lineNo: stmts[k].lineNo };
                        stmts[j] = { text: 'ENDWHILE', lineNo: stmts[j].lineNo };
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
                            stmts[k] = { text: `IF ${m[1]} THEN`, lineNo: stmts[k].lineNo };
                            stmts[e - 1] = { text: 'ELSE', lineNo: stmts[e - 1].lineNo };
                            stmts.splice(a, 0, { text: 'ENDIF', lineNo: null });
                        } else {
                            stmts[k] = { text: `IF ${m[1]} THEN`, lineNo: stmts[k].lineNo };
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
                        stmts[k] = { text: 'UNTIL FALSE', lineNo: stmts[k].lineNo };
                        stmts.splice(top, 0, { text: 'REPEAT', lineNo: null });
                        changed = true;
                        break;
                    }
                }
            }
        }
    }

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
        x = x.replace(/<>/g, '!=');
        x = x.replace(/\bTRUE\b/gi, '1').replace(/\bFALSE\b/gi, '0');
        x = x.replace(/[A-Za-z_]\w*[%$]?/g, (w) => {
            const up = w.toUpperCase();
            if (['MOD', 'DIV', 'AND', 'OR', 'NOT'].includes(up)) return up.toLowerCase();
            if (['PICK', 'RANDOM', 'TO'].includes(up)) return w;
            if (/^(SIN|COS|TAN|SQR|INT|ABS|LOG|LN|EXP|LEN|GET|VAL|TIME|PI|CHR\$|STR\$)$/.test(up)) {
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
        if (/^REM\b/i.test(t)) {
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
            line(`set item ${trExpr(m[2])} of array "${vName(m[1])}" to ${/^".*"$/.test(m[3].trim()) ? m[3].trim() : trExpr(m[3])}`);
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
        if ((m = t.match(/^PRINT\s+"([^"]*)"$/i))) { line(`print "${m[1]}"`); mapped(); return; }
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
    return { pseudocode: head.join('\n') + '\n' + out.join('\n') + '\n', warnings, stats };
}
