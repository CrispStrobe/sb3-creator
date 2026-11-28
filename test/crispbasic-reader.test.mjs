import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import basicToPseudocode from '../src/utils/basicToPseudocode.js';

const refused = source => {
    const result = basicToPseudocode(source);
    assert.equal(result.ok, false);
    assert.equal(result.pseudocode, '', 'a failed conversion must not offer a partial replacement project');
    assert.ok(result.reasons.length > 0);
    assert.deepEqual(result.reasons, result.diagnostics.map(d => d.message));
    assert.equal(result.stats.mapped, 0, 'refusal precedes legacy PROC/FN lowering');
    for (const diagnostic of result.diagnostics) {
        assert.ok(['crispbasic-to-blocks-unsupported', 'basic-to-blocks-dynamic-source'].includes(diagnostic.code));
        assert.equal(diagnostic.severity, 'error');
        assert.match(diagnostic.message, /To blocks/);
        assert.ok(diagnostic.line >= 1);
    }
    return result;
};

describe('CrispBASIC portable-library To blocks boundary', () => {
    for (const source of [
        'PROCpinMode(13, "output")',
        'PROCdigitalWrite(13, 1)',
        'PROCdelay(25)',
        'PRINT FNdigitalRead(13)',
        'elapsed = FNmillis',
        'IF FNdigitalRead(2) = 0 THEN PROCdigitalWrite(13, 1)',
        'PROCother(FNdigitalRead(1), FNmillis)',
        "PRINT 'FNdigitalRead(2)", // BBC PRINT's apostrophe is not a comment.
        'procDIGITALwrite(13, 1)'
    ]) {
        test(`refuses live ${source}`, () => refused(`${source}\nEND`));
    }

    test('reports physical editor lines separately from BASIC numbers', () => {
        const result = refused('\n  100 PRINT 7\n\n  65000 PROCdelay(25):PRINT FNmillis\n  65010 END');
        assert.deepEqual(result.diagnostics.map(d => [d.line, d.basicLine, d.operation]), [
            [4, 65000, 'PROCdelay'],
            [4, 65000, 'FNmillis']
        ]);
        assert.match(result.reasons[0], /Line 4 \(BASIC 65000\)/);
    });

    test('deduplicates one call name on one line without hiding later source locations', () => {
        const result = refused('PRINT FNmillis + FNmillis\nPRINT FNmillis');
        assert.deepEqual(result.diagnostics.map(d => [d.line, d.basicLine, d.operation]), [
            [1, null, 'FNmillis'], [2, null, 'FNmillis']
        ]);
    });

    test('refuses overriding definitions rather than assuming the bridge meaning', () => {
        for (const source of [
            'DEF PROCdigitalWrite(pin, value)\nPRINT value\nENDPROC',
            'DEF FNdigitalRead(pin)=0',
            'DEF FNmillis=42',
            'DEF PROCother\nPROCdelay(1)\nENDPROC'
        ]) refused(source);
    });

    test('names unsupported neighboring pin/time operations explicitly', () => {
        for (const source of [
            'PROCanalogWrite(13, 127)', 'PRINT FNanalogRead(0)',
            'PROCtone(13, 440)', 'PROCnoTone(13)', 'PROCpwm(13, 50)',
            'PROCtoggle(13)', 'PROCdigitalToggle(13)',
            'PROCdelayMicroseconds(100)', 'PRINT FNmicros',
            'PROCattachInterrupt(2, 1)', 'PROCdetachInterrupt(2)'
        ]) {
            const result = refused(source);
            assert.match(result.reasons[0], /outside CrispBASIC's five-operation portable library/);
        }
    });

    test('quoted names do not hide an actual call later on the same line', () => {
        const result = refused('PRINT "PROCdelay:FNmillis":PRINT FNdigitalRead(2)');
        assert.deepEqual(result.diagnostics.map(d => d.operation), ['FNdigitalRead']);
    });

    test('a REM inside quoted text does not turn a following call into a comment', () => {
        const result = refused('PRINT "REM: ignored":PROCdelay(5)');
        assert.deepEqual(result.diagnostics.map(d => d.operation), ['PROCdelay']);
    });

    test('BBC compact keywords cannot hide live calls or definitions', () => {
        for (const source of [
            'PRINTFNdigitalRead(1)',
            'IF TRUE THENPROCdigitalWrite(1,1)',
            'IF1THENPROCdigitalWrite(1,1)',
            'IFTRUE THENPROCdelay(1)',
            'REPEATUNTILFNmillis>1',
            'PRINTABSFNmillis',
            'DEFFNdigitalRead(pin)=0',
            'DEFPROCdigitalWrite(pin,value)\nENDPROC',
            'PRO.digitalWrite(1,1)',
            'PROC.digitalWrite(1,1)',
            'PRINT FN.digitalRead(1)',
            'PRINTFN.millis'
        ]) refused(source);
    });

    test('EVAL is refused because constructed source can execute portable calls', () => {
        for (const source of [
            'PRINT EVAL("FNdigitalRead(13)")',
            'x=EVAL("FN"+"millis")',
            'x=EVAL(text$)',
            'PRINTEVAL"FNmillis"',
            'PRINT EV.("FNmillis")',
            'PRINTEVA."FNmillis"'
        ]) {
            const result = refused(source);
            assert.equal(result.diagnostics[0].code, 'basic-to-blocks-dynamic-source');
            assert.match(result.reasons[0], /EVAL's computed BASIC source/);
        }
        assert.equal(basicToPseudocode('PRINT "EVAL(quoted data):FNmillis"').ok, true);
    });
});

describe('comments, strings and legacy BASIC remain distinct from portable calls', () => {
    test('REM retains all of its colon-separated hardware text as one comment', () => {
        const result = basicToPseudocode([
            'REM turn on led:PROCdigitalWrite(13, 1):PROCdelay(25)',
            'PRINT 7:REM PRINT FNmillis:PRINT FNdigitalRead(13)',
            'IF 1 THEN REM PROCpinMode(13, "output"):PROCtoggle(13)',
            'END'
        ].join('\n'));
        assert.equal(result.ok, true);
        assert.deepEqual(result.diagnostics, []);
        assert.deepEqual(result.warnings, []);
        assert.match(result.pseudocode, /# BASIC: turn on led:PROCdigitalWrite\(13, 1\):PROCdelay\(25\)/);
        assert.match(result.pseudocode, /# BASIC: PRINT FNmillis:PRINT FNdigitalRead\(13\)/);
        assert.match(result.pseudocode, /# BASIC: PROCpinMode\(13, "output"\):PROCtoggle\(13\)/);
        assert.equal(result.pseudocode.split('\n').filter(line => /^\s*print /.test(line)).length, 1);
        assert.doesNotMatch(result.pseudocode, /^\s*(?:delay|digitalwrite|pinmode|toggle) /m);
    });

    test('compact REM consumes the entire line without promoting text to calls', () => {
        const result = basicToPseudocode('REMfoo:PROCdelay(1):PRINTFNdigitalRead(1)\nPRINT 7\nEND');
        assert.equal(result.ok, true);
        assert.deepEqual(result.diagnostics, []);
        assert.deepEqual(result.warnings, []);
        assert.match(result.pseudocode, /# BASIC: foo:PROCdelay\(1\):PRINTFNdigitalRead\(1\)/);
        assert.equal(result.pseudocode.split('\n').filter(line => /^\s*print /.test(line)).length, 1);
    });

    test('quoted call names and doubled quotes are data, including embedded colons', () => {
        for (const source of [
            'PRINT "FNdigitalRead(13):PROCdelay(25)"',
            'message$="FNmillis"',
            'message$="quote ""PROCpinMode"": PROCanalogWrite(0, 1)"',
            'PRINT "PROCdigitalWrite":REM FNmillis'
        ]) {
            const result = basicToPseudocode(source);
            assert.equal(result.ok, true, source);
            assert.deepEqual(result.diagnostics, []);
            assert.ok(result.pseudocode.length > 0);
        }
    });

    test('does not reserve name prefixes belonging to ordinary routines', () => {
        const result = basicToPseudocode([
            'PROCdigitalWriteLog(3)',
            'PROCtoggleLed',
            'PROCanalogWriteReport',
            'PRINT FNmillisCounter',
            'LETreadFNmillis=3',
            'PRINTreadFNmillis',
            'PRO.digitalWriteLog(3)',
            'PRINT FN.millisCounter',
            'PROCPROCdelay',
            'PRINT FNFNmillis',
            'DEF PROCdigitalWriteLog(value)',
            'PRINT value',
            'ENDPROC'
        ].join('\n'));
        assert.equal(result.ok, true);
        assert.deepEqual(result.diagnostics, []);
        assert.match(result.pseudocode, /digitalwritelog 3/);
    });

    test('ordinary BBC clock and control conversion still succeeds', () => {
        const result = basicToPseudocode([
            'TIME=0',
            'time_target=TIME+0.25*100',
            'REPEAT UNTIL TIME>=time_target',
            'PRINT TIME/100',
            'END'
        ].join('\n'));
        assert.equal(result.ok, true);
        assert.deepEqual(result.reasons, []);
        assert.deepEqual(result.diagnostics, []);
        assert.deepEqual(result.warnings, []);
        assert.match(result.pseudocode, /reset timer/);
        assert.match(result.pseudocode, /wait 0\.25 seconds/);
        assert.match(result.pseudocode, /print timer/);
    });
});

test('bw read refuses portable BASIC before writing or replacing output', () => {
    const work = mkdtempSync(path.join(tmpdir(), 'bw-crispbasic-reader-'));
    try {
        const source = path.join(work, 'program.bas');
        const output = path.join(work, 'program.bw');
        const bin = fileURLToPath(new URL('../bin/bw.mjs', import.meta.url));
        writeFileSync(source, '\n100 PRINT FNdigitalRead(13)\n110 END\n');
        writeFileSync(output, 'previous project\n');
        const result = spawnSync(process.execPath, [bin, 'read', source, '-o', output], {encoding: 'utf8'});
        assert.equal(result.status, 1, result.stderr);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /read refused: Line 2 \(BASIC 100\): To blocks/);
        assert.equal(readFileSync(output, 'utf8'), 'previous project\n');

        const stdout = spawnSync(process.execPath, [bin, 'read', source], {encoding: 'utf8'});
        assert.equal(stdout.status, 1, stdout.stderr);
        assert.equal(stdout.stdout, '');
        assert.match(stdout.stderr, /FNdigitalRead/);

        writeFileSync(source, 'REM PROCdelay(1):PRINT FNmillis\nPRINT 7\nEND\n');
        const legacy = spawnSync(process.execPath, [bin, 'read', source, '-o', output], {encoding: 'utf8'});
        assert.equal(legacy.status, 0, legacy.stderr);
        assert.match(readFileSync(output, 'utf8'), /# BASIC: PROCdelay\(1\):PRINT FNmillis\n\s*print 7/);
    } finally {
        rmSync(work, {recursive: true, force: true});
    }
});
