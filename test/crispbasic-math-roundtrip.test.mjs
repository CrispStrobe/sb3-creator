import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import basicToPseudocode from '../src/utils/basicToPseudocode.js';

const portable = {profile: 'bbc', mode: 'crispbasic'};
function generate(source, lineNumbers = false) {
    const creator = new SB3Creator(); creator.parse(source);
    assert.deepEqual(creator.warnings, []);
    const result = creator.generateBASIC(undefined, {...portable, lineNumbers});
    assert.equal(result.ok, true, JSON.stringify(result));
    return result.basic;
}
function roundtrip(source, lineNumbers = false) {
    const result = basicToPseudocode(source, {mode: 'crispbasic'});
    assert.equal(result.ok, true, JSON.stringify(result));
    return {pseudocode: result.pseudocode, basic: generate(result.pseudocode, lineNumbers)};
}

for (const [expression, pseudo, regenerated] of [
    ['PI', 'pi', 'PI'],
    ['SQR(9)', 'sqrt of (9)', 'SQR(9)'],
    ['LN(1)', 'ln of (1)', 'LN(1)'],
    ['SIN(RAD(30))', 'sin of (30)', 'SIN(RAD(30))'],
    ['COS(RAD(60))', 'cos of (60)', 'COS(RAD(60))'],
    ['TAN(RAD(45))', 'tan of (45)', 'TAN(RAD(45))'],
    ['DEG(ASN(1))', 'asin of (1)', 'DEG(ASN(1))'],
    ['DEG(ACS(1))', 'acos of (1)', 'DEG(ACS(1))'],
    ['DEG(ATN(1))', 'atan of (1)', 'DEG(ATN(1))'],
    ['7 MOD 3', '7 mod 3', '(7 MOD 3)'],
    ['-7 MOD 3', '-7 mod 3', '(-7 MOD 3)'],
    ['7 MOD -3', '7 mod (-3)', '(7 MOD -3)'],
    ['LN(100)/LN(10)', 'ln of (100)', '(LN(100)/LN(10))']
]) test(`portable numeric expression ${expression} retains its BASIC operation`, () => {
    const result = roundtrip(`PRINT ${expression}\nEND`);
    assert.ok(result.pseudocode.includes(pseudo), result.pseudocode);
    assert.ok(result.basic.includes(`PRINT ${regenerated}\n`), result.basic);
    roundtrip(result.basic);
});

for (const lineNumbers of [false, true]) {
    test(`generated math in numeric procedures round-trips (${lineNumbers})`, () => {
        const source = generate(`DEFINE sample (angle):
  print sin of angle
  print cos of angle
  print tan of angle
  print sqrt of (angle + 4)
  print ln of (angle + 1)
WHEN flag clicked:
  sample (30)`, lineNumbers);
        const result = roundtrip(source, lineNumbers);
        for (const keyword of ['SIN(RAD(', 'COS(RAD(', 'TAN(RAD(', 'SQR(', 'LN(']) {
            assert.ok(result.basic.includes(keyword));
        }
    });
}

test('ceiling uses one floor evaluation and does not add BBC true=-1', () => {
    const source = generate(`DEVICE ARDUINO-UNO
PIN input = D2 INPUT
WHEN flag clicked:
  print ceiling of ((read input) + 0.2)
  print ceiling of -1.2
  print ceiling of 1.2`);
    assert.match(source, /PRINT \(-INT\(-\(\(FNdigitalRead\(2\)\+0\.2\)\)\)\)/);
    assert.equal((source.match(/FNdigitalRead/g) || []).length, 1);
    const result = roundtrip(source);
    assert.equal((result.basic.match(/FNdigitalRead/g) || []).length, 1);
    assert.doesNotMatch(source, /<>INT/);
    assert.doesNotMatch(source, /ceiling_of/, 'negative operands must not turn math reporter names into variables');
    assert.match(source, /PRINT \(-INT\(-\(-1\.2\)\)\)/);
});

test('signed math operands retain the established unparenthesized reporter precedence', () => {
    const source = generate('GLOBAL value\nWHEN flag clicked:\n  set value to -4\n  print abs of value * -1\n  print 1 + abs of -3\n  print 7 mod -3\n  print round -1.2');
    assert.match(source, /PRINT \(ABS\(value\)\*-1\)/);
    assert.match(source, /PRINT \(1\+ABS\(-3\)\)/);
    assert.match(source, /PRINT \(7 MOD -3\)/);
    assert.match(source, /PRINT INT\(-1\.2\+0\.5\)/);
    assert.doesNotMatch(source, /abs_of|round_/);
});

for (const expression of ['SIN(PI/2)', 'COS(0)', 'TAN(1)', 'RAD(30)', 'DEG(1)', 'ASN(1)', 'ACS(1)', 'ATN(1)', 'SQR(1=1)', '7 DIV 3', '2^3']) {
    test(`unqualified numeric conversion refuses ${expression}`, () => {
        const result = basicToPseudocode(`PRINT ${expression}\nEND`, {mode: 'crispbasic'});
        assert.equal(result.ok, false);
        assert.equal(result.pseudocode, '');
    });
}
