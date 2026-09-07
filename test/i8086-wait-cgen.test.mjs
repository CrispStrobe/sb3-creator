// N2c — `wait` on the single-script 8086 C route.
//
// SmallerC cannot express the DOS interrupt inline, so the emitter names the
// bw_delay_ms boundary that brickwright-lite supplies beside bw_outb/bw_inb.
// Its argument is one unsigned 16-bit word: literal durations that would wrap
// are refused here, before compilation. Multi-script timing remains outside
// this lane and continues through the existing `now` refusal.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const WAIT = [
    'DEVICE i8086',
    'PIN led = P1.0 OUTPUT',
    'WHEN flag clicked:',
    '  wait 0.05 seconds',
    '  turn on led'
].join('\n');

const emit = src => {
    const creator = new SB3Creator();
    creator.parse(src);
    const generated = creator.generateC();
    return {code: typeof generated === 'string' ? generated : generated.code,
        warnings: creator._cWarnings || []};
};

test('single-script i8086 wait crosses the named bw_delay_ms boundary in milliseconds', () => {
    const {code, warnings} = emit(WAIT);
    assert.match(code, /^extern void bw_delay_ms\(unsigned ms\);$/m);
    assert.match(code, /^    bw_delay_ms\(50\);$/m);
    assert.doesNotMatch(code, /No C emitted/, 'wait still hit the i8086 verb choke');
    assert.doesNotMatch(code, /static void delay_ms/, 'the 8086 route must not inherit a CPU-burning delay loop');
    assert.match(code, /computed waits are not emitted/, 'the literal-only contract is not stated');
    assert.equal(warnings.length, 0, `unexpected warnings: ${warnings.join(' | ')}`);
});

test('65535 ms is admitted and the next millisecond is refused by name, never wrapped', () => {
    assert.match(emit(WAIT.replace('0.05', '65.535')).code, /bw_delay_ms\(65535\);/);
    const {code, warnings} = emit(WAIT.replace('0.05', '65.536'));
    assert.match(code, /^\/\* No C emitted for DEVICE I8086\./);
    assert.match(code, /0 to 65535 milliseconds/);
    assert.match(code, /65\.536 seconds/);
    assert.doesNotMatch(code, /bw_delay_ms\(0\)/, 'the overflowing duration wrapped to zero');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /65\.536/);
});

test('a negative literal wait is refused as a duration, not converted to unsigned', () => {
    const {code, warnings} = emit(WAIT.replace('0.05', '-1'));
    assert.match(code, /No C emitted/);
    assert.match(code, /-1 seconds/);
    assert.doesNotMatch(code, /bw_delay_ms\(65535\)/);
    assert.equal(warnings.length, 1);
});

test('a non-finite literal wait is refused by its spelling', () => {
    const creator = new SB3Creator();
    creator.parse(WAIT);
    const wait = creator.project.targets.flatMap(target => Object.values(target.blocks))
        .find(block => block.opcode === 'control_wait');
    wait.inputs.DURATION = [1, [4, 'Infinity']];
    const generated = creator.generateC();
    const code = typeof generated === 'string' ? generated : generated.code;
    const warnings = creator._cWarnings || [];
    assert.match(code, /No C emitted/);
    assert.match(code, /Infinity seconds/);
    assert.equal(warnings.length, 1);
});

test('a computed wait is refused by name instead of overflowing before its unsigned cast', () => {
    const src = WAIT.replace('wait 0.05 seconds', 'set pause to 1\n  wait pause seconds');
    const {code, warnings} = emit(src);
    assert.match(code, /No C emitted for DEVICE I8086/);
    assert.match(code, /computes a wait duration at run time/);
    assert.match(code, /multiply could overflow/);
    assert.doesNotMatch(code, /bw_delay_ms\(/, 'unsafe computed wait leaked into emitted C');
    assert.equal(warnings.length, 1);
});

test('multi-script i8086 timing is not widened by N2c', () => {
    const src = WAIT + '\n\nWHEN flag clicked:\n  turn off led';
    const {code} = emit(src);
    assert.match(code, /No C emitted for DEVICE I8086/);
    assert.match(code, /now/, 'the existing scheduler-time refusal should remain named');
    assert.doesNotMatch(code, /extern void bw_delay_ms/,
        'multi-script waits must not masquerade as the single-script blocking route');
});
