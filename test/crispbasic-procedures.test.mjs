import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import basicToPseudocode from '../src/utils/basicToPseudocode.js';

const portable = {profile: 'bbc', mode: 'crispbasic'};
function generate(source, lineNumbers = false) {
    const creator = new SB3Creator();
    creator.parse(source);
    assert.deepEqual(creator.warnings, []);
    const result = creator.generateBASIC(undefined, {...portable, lineNumbers});
    assert.equal(result.ok, true, JSON.stringify(result));
    return result.basic;
}
function convert(source, lineNumbers = false) {
    const result = basicToPseudocode(source, {mode: 'crispbasic'});
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(result.diagnostics, []);
    return {...result, basic: generate(result.pseudocode, lineNumbers)};
}
function refuse(source, code) {
    const result = basicToPseudocode(source, {mode: 'crispbasic'});
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.pseudocode, '');
    assert.ok(result.diagnostics.some(item => item.code === `crispbasic-read-${code}`), JSON.stringify(result));
}

const pulse = `DEVICE ARDUINO-UNO
PIN led = D13 OUTPUT
GLOBAL count
DEFINE pulse (seconds):
  turn on led
  wait seconds seconds
  turn off led
  change count by 1
DEFINE pair:
  pulse (0.0015)
  pulse (0.0025)
WHEN flag clicked:
  pair
  print count
  print timer`;

for (const lineNumbers of [false, true]) {
    test(`numeric procedures and computed waits round-trip in ${lineNumbers ? 'numbered' : 'structured'} form`, () => {
        const result = convert(generate(pulse, lineNumbers), lineNumbers);
        assert.match(result.pseudocode, /DEFINE cb_proc_do_pulse \(cb_arg_do_pulse_seconds\):/);
        assert.match(result.pseudocode, /DEFINE cb_proc_do_pair:/);
        assert.match(result.pseudocode, /wait \(cb__bw_crisp_seconds\) seconds/);
        assert.equal((result.basic.match(/PROCdigitalWrite\(13,/g) || []).length, 2);
        assert.equal((result.basic.match(/PROCdelay\(/g) || []).length, 1);
        assert.match(result.basic, /IF _bw_crisp_seconds<0 OR _bw_crisp_seconds>2147483\.647 THEN ERROR 204/);
        convert(result.basic, lineNumbers);
    });

    test(`recursive procedure arguments remain local (${lineNumbers})`, () => {
        const original = generate(`DEFINE countdown (remaining):
  print remaining
  IF remaining > 0 THEN:
    countdown (remaining - 1)
  print remaining
WHEN flag clicked:
  countdown (3)`, lineNumbers);
        const result = convert(original, lineNumbers);
        assert.match(result.pseudocode, /DEFINE cb_proc_do_countdown \(cb_arg_do_countdown_remaining\):/);
        assert.doesNotMatch(result.pseudocode, /GLOBAL cb_arg_do_countdown_remaining/);
        assert.equal((result.basic.match(/PROCdo_cb_proc_do_countdown\(/g) || []).length, 3, 'definition plus main and recursive call');
        convert(result.basic, lineNumbers);
    });
}

test('procedure arguments sample electrical reads once and in source order', () => {
    const original = `REM @bw device arduino-uno
REM @bw pin a D2 input
REM @bw pin b D3 input
PROCpinMode(2,"input")
PROCpinMode(3,"input")
PROCconsume(FNdigitalRead(2),FNdigitalRead(3)=1)
END
DEF PROCconsume(first,second)
PRINT first
PRINT second
ENDPROC`;
    const result = convert(original);
    const sample2 = result.basic.indexOf('FNdigitalRead(2)');
    const sample3 = result.basic.indexOf('FNdigitalRead(3)');
    const call = result.basic.indexOf('PROCdo_cb_proc_consume(');
    assert.ok(sample2 >= 0 && sample3 > sample2 && call > sample3);
    assert.equal((result.basic.match(/FNdigitalRead\(/g) || []).length, 2);
    assert.match(result.pseudocode, /set cb_truth_\d+ to -1/, 'BBC Boolean arguments retain -1 instead of becoming Scratch true=1');
});

test('generated argument names cannot shadow authored globals', () => {
    const result = convert('arg_task_value=12\nPROCtask(3)\nPRINT arg_task_value\nEND\nDEF PROCtask(value)\nPRINT value\nENDPROC');
    assert.match(result.pseudocode, /GLOBAL cb_arg_task_value\n/);
    assert.match(result.pseudocode, /DEFINE cb_proc_task \(cb_arg_task_value_\):/);
    assert.match(result.basic, /PRINT cb_arg_task_value_/);
});

test('separate procedures may use the same parameter spelling without sharing locals', () => {
    const result = convert('PROCouter(9)\nEND\nDEF PROCouter(value)\nPROCinner(3)\nPRINT value\nENDPROC\nDEF PROCinner(value)\nPRINT value\nENDPROC');
    assert.match(result.pseudocode, /DEFINE cb_proc_outer \(cb_arg_outer_value\):/);
    assert.match(result.pseudocode, /DEFINE cb_proc_inner \(cb_arg_inner_value\):/);
});

for (const [source, code] of [
    ['PROCmissing\nEND', 'procedure'],
    ['PROCtask(1)\nEND\nDEF PROCtask\nPRINT 1\nENDPROC', 'procedure'],
    ['PROCtask(1,)\nEND\nDEF PROCtask(a,b)\nPRINT a\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask(a,a)\nPRINT a\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask(a%)\nPRINT a%\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask(a$)\nPRINT a$\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask(BYREF a)\nPRINT a\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask(a())\nPRINT 1\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask\nPRINT 1\nENDPROC\nDEF PROCtask\nENDPROC', 'procedure'],
    ['DEF PROCtask\nPRINT 1\nENDPROC\nEND', 'procedure'],
    ['END\nDEF PROCtask\nPRINT 1', 'procedure'],
    ['END\nDEF PROCtask\nDEF PROCother\nENDPROC\nENDPROC', 'procedure'],
    ['END\nDEF PROCdelay(ms)\nENDPROC', 'procedure'],
    ['END\nDEF PROCtask(value)\nvalue=3\nENDPROC', 'procedure-scope'],
    ['value=7\nEND\nDEF PROCtask(value)\nPRINT value\nENDPROC', 'procedure-scope'],
    ['PROCouter(7)\nEND\nDEF PROCouter(value)\nPROCinner\nENDPROC\nDEF PROCinner\nPRINT value\nENDPROC', 'procedure-scope'],
    ['END\nDEF PROCtask(value)\nLOCAL x\nENDPROC', 'statement'],
    ['END\nDEF PROCtask(value)\nIF value THEN\nENDPROC\nENDIF\nENDPROC', 'statement'],
    ['n=0.1\nPROCdelay(INT(n*1000+0.5))\nEND', 'delay']
]) test(`portable procedure admission refuses ${source.replaceAll('\n', ' / ')}`, () => refuse(source, code));

test('computed wait admission requires the exact bounds, error and rounding', () => {
    const source = 'n=0.0015\nIF n<0 OR n>2147483.647 THEN ERROR 204,"CrispBASIC wait seconds outside 0..2147483.647"\nPROCdelay(INT(n*1000+0.5))\nPRINT n\nEND';
    const result = convert(source);
    assert.match(result.pseudocode, /wait \(cb_n\) seconds/);
    assert.match(result.pseudocode, /print cb_n/);
    for (const altered of [
        source.replace('n<0', 'n<1'),
        source.replace('n>2147483.647', 'n>2147483.648'),
        source.replace('ERROR 204', 'ERROR 205'),
        source.replace('outside 0..2147483.647', 'invalid'),
        source.replace('+0.5', '+0.4'),
        source.replace('PROCdelay(INT(n*1000+0.5))', 'PRINT n\nPROCdelay(INT(n*1000+0.5))')
    ]) refuse(altered, 'statement');
});
