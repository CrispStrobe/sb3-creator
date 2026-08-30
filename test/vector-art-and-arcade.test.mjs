/**
 * The dialect brickwright-lite was carrying downstream, now owned here.
 *
 * WHY IT MOVED
 * ------------
 * lite carried 112 non-upstream lines on its VENDORED copy of `sb3Creator.js`:
 * the `art` costume verb, the arcade/pybadge/pybadge-lc/samd51 device tables,
 * and a deletion. Re-vendoring silently ATE all of it. The vendor could not
 * see the loss because every import it left behind still resolved — there were
 * none — and the first symptom was fourteen game tests failing with
 * `Unknown SHAPE "art"`, three commits and one push later. `LOCAL_FILES` in
 * lite's `scripts/sync-sb3creator.mjs` became a tripwire for the one import
 * edge it could see, and its own comment says the real fix is upstreaming.
 * This is that.
 *
 * THE SPLIT, and why it is where it is
 * ------------------------------------
 * The VERB is a dialect feature and lives here. The ARTWORK is a downstream
 * product decision and does not: a game gallery's 264 hand-drawn sprites are
 * not something every consumer of this transpiler should carry. So the
 * registry is INJECTABLE and starts empty, a host calls
 * `SB3Creator.registerVectorArt()`, and the next sync has nothing to eat
 * because there is no longer a downstream patch to eat.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

/** Two distinguishable pieces of art, sized so the rotation centre is checkable. */
const ART = {
    'demo/bird': '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48">'
        + '<rect width="64" height="48" fill="#00ff00"/><text>BIRD</text></svg>',
    'demo/hill': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30">'
        + '<rect width="120" height="30" fill="#884400"/></svg>',
};

const sprite = (lines) => ['SPRITE Bird:', ...lines.map((l) => `  ${l}`), '',
    'WHEN flag clicked:', '  say "hi"'].join('\n');

describe('the `art` costume verb', () => {
    beforeEach(() => { SB3Creator.clearVectorArt(); SB3Creator.registerVectorArt(ART); });
    afterEach(() => { SB3Creator.clearVectorArt(); });

    test('the registry is injectable, additive, case-insensitive, and clearable', () => {
        SB3Creator.clearVectorArt();
        assert.deepEqual(SB3Creator.vectorArtNames(), [],
            'upstream ships NO art — that is the whole point of the split');
        assert.equal(SB3Creator.getVectorArt('demo/bird'), null);
        assert.equal(SB3Creator.registerVectorArt({ 'A/One': '<svg/>' }), 1);
        assert.equal(SB3Creator.registerVectorArt({ 'A/Two': '<svg/>' }), 2,
            'a second call ADDS — a host may load art in passes');
        assert.equal(SB3Creator.getVectorArt('a/ONE'), '<svg/>', 'names match case-blind');
        // Junk is skipped rather than stored, so a bad entry cannot become a
        // costume with an empty asset.
        assert.equal(SB3Creator.registerVectorArt({ 'A/Three': '', 'A/Four': null, 5: '<svg/>' }), 3);
        SB3Creator.clearVectorArt();
        assert.deepEqual(SB3Creator.vectorArtNames(), []);
    });

    test('accepts a Map and an entry array as well as an object', () => {
        SB3Creator.clearVectorArt();
        SB3Creator.registerVectorArt(new Map([['m/one', '<svg/>']]));
        SB3Creator.registerVectorArt([['a/two', '<svg/>']]);
        assert.deepEqual(SB3Creator.vectorArtNames().sort(), ['a/two', 'm/one']);
    });

    test('SHAPE art replaces costume 0 and centres on the artwork', () => {
        const c = new SB3Creator();
        const project = c.parse(sprite(['SHAPE art demo/bird']));
        assert.deepEqual(c.warnings, []);
        const bird = project.targets.find((t) => t.name === 'Bird');
        assert.equal(bird.costumes.length, 1, 'it REPLACES, it does not append');
        // 64x48 art -> centre 32,24. buildBackdrop hardcodes 240/180; this must not.
        assert.equal(bird.costumes[0].rotationCenterX, 32);
        assert.equal(bird.costumes[0].rotationCenterY, 24);
        assert.equal(bird.costumes[0].dataFormat, 'svg');
        const svgs = [...c.assets.values()].filter((a) => a.type === 'svg').map((a) => a.data);
        assert.ok(svgs.some((s) => s.includes('BIRD')), 'the authored bytes are baked in');
    });

    test('dimensions come from viewBox when width/height are absent', () => {
        const c = new SB3Creator();
        const project = c.parse(sprite(['SHAPE art demo/hill']));
        assert.deepEqual(c.warnings, []);
        const bird = project.targets.find((t) => t.name === 'Bird');
        assert.equal(bird.costumes[0].rotationCenterX, 60);
        assert.equal(bird.costumes[0].rotationCenterY, 15);
    });

    test('COSTUME <name> art appends, BACKDROP <name> art lands on the Stage', () => {
        const c = new SB3Creator();
        const project = c.parse([
            'SPRITE Bird:', '  SHAPE art demo/bird', '  COSTUME wing art demo/hill', '',
            'BACKDROP sky art demo/hill', '',
            'WHEN flag clicked:', '  say "hi"',
        ].join('\n'));
        assert.deepEqual(c.warnings, []);
        const bird = project.targets.find((t) => t.name === 'Bird');
        const stage = project.targets.find((t) => t.isStage);
        assert.deepEqual(bird.costumes.map((x) => x.name), ['costume1', 'wing']);
        assert.deepEqual(stage.costumes.map((x) => x.name), ['backdrop1', 'sky']);
    });

    test('ROUND TRIP: all three forms decompile to what was written', () => {
        const src = [
            'SPRITE Bird:', '  SHAPE art demo/bird', '  COSTUME wing art demo/hill', '',
            'BACKDROP sky art demo/hill', '',
            'WHEN flag clicked:', '  say "hi"',
        ].join('\n');
        const c = new SB3Creator();
        const out = new SB3Creator().decompile(c.parse(src));
        assert.match(out, /^ {2}SHAPE art demo\/bird$/m);
        assert.match(out, /^ {2}COSTUME wing art demo\/hill$/m);
        assert.match(out, /^BACKDROP sky art demo\/hill$/m);
        // And it re-parses to the same costumes, which is the test that a
        // round trip is a round trip rather than a similar-looking string.
        const again = new SB3Creator();
        const project = again.parse(out);
        assert.deepEqual(again.warnings, []);
        assert.deepEqual(
            project.targets.find((t) => t.name === 'Bird').costumes.map((x) => x.name),
            ['costume1', 'wing']);
    });

    test('an unknown name warns, and says WHICH kind of unknown it is', () => {
        const c = new SB3Creator();
        c.parse(sprite(['SHAPE art nope/nope']));
        assert.equal(c.warnings.length, 1, JSON.stringify(c.warnings));
        assert.match(c.warnings[0], /Unknown vector art "nope\/nope" \(2 registered\)/);

        // The other cause, which needs a different sentence: a host that
        // registered nothing at all. This is the state upstream ships in, and
        // the message has to point at the fix rather than blame the program.
        SB3Creator.clearVectorArt();
        const empty = new SB3Creator();
        empty.parse(sprite(['SHAPE art demo/bird']));
        assert.equal(empty.warnings.length, 1);
        assert.match(empty.warnings[0], /no art is registered/);
        assert.match(empty.warnings[0], /registerVectorArt/);
    });

    test('an unknown name adds no costume and no asset', () => {
        const c = new SB3Creator();
        const project = c.parse([
            'SPRITE Bird:', '  COSTUME wing art nope/nope', '',
            'WHEN flag clicked:', '  say "hi"',
        ].join('\n'));
        const bird = project.targets.find((t) => t.name === 'Bird');
        assert.equal(bird.costumes.length, 1, 'only the default costume survives');
        assert.ok(!bird.costumes.some((x) => x.name === 'wing'));
    });

    test('the geometric kinds are untouched, and the warning names art', () => {
        const c = new SB3Creator();
        c.parse(sprite(['SHAPE circle 18 #ff0000']));
        assert.deepEqual(c.warnings, []);
        const bad = new SB3Creator();
        bad.parse(sprite(['SHAPE hexagon 18']));
        assert.match(bad.warnings[0], /use art\/rect\/square/,
            'the vocabulary offered must match the vocabulary accepted');
    });
});

/**
 * The Arcade family: MakeCode-Arcade-style console plus the two concrete
 * ATSAMD51J19 boards and the bare chip.
 */
describe('the Arcade family retargets, and refuses C', () => {
    const SRC = ['DEVICE ARDUINO-UNO', 'CLOCK 16000000', 'PIN led = D13 OUTPUT',
        'PIN btn = D2 INPUT', '', 'WHEN flag clicked:', '  turn on led'].join('\n');
    const FAMILY = ['arcade', 'pybadge', 'pybadge-lc', 'samd51'];

    test('each one is in every table it needs to be in', () => {
        for (const d of FAMILY) {
            assert.ok(SB3Creator.STC_PARTS[d], `${d} missing from STC_PARTS`);
            assert.ok(SB3Creator.RETARGET_POOLS[d], `${d} missing from RETARGET_POOLS`);
            assert.equal(SB3Creator.STC_PARTS[d].core, 'samd51');
        }
        // Only the boards claim the console faceplate; the bare chip does not.
        assert.ok(SB3Creator.STC_PARTS.arcade.arcade);
        assert.ok(SB3Creator.STC_PARTS.pybadge.arcade);
        assert.ok(!SB3Creator.STC_PARTS.samd51.arcade,
            'samd51 is the bare package, not a console');
        // Only PyBadge has real pads, so only PyBadge gets an I2C pair.
        assert.deepEqual(SB3Creator.I2C_PINS.pybadge, { sda: 'SDA', scl: 'SCL' });
        assert.equal(SB3Creator.I2C_PINS.arcade, undefined);
        assert.equal(SB3Creator.I2C_PINS['pybadge-lc'], undefined);
    });

    test('each retargets, re-parses clean, and lands on its own pins', () => {
        for (const d of FAMILY) {
            const r = SB3Creator.retargetPseudocode(SRC, d);
            assert.ok(r.ok, `${d} refused: ${JSON.stringify(r.reasons)}`);
            const c = new SB3Creator();
            c.parse(r.pseudocode);
            assert.deepEqual(c.warnings, [],
                `${d} retarget does not re-parse clean: ${JSON.stringify(c.warnings)}`);
            assert.match(r.pseudocode, /^CLOCK 120000000$/m,
                `${d} must clock at the ATSAMD51J19's rated 120 MHz`);
        }
        // The bare chip speaks package coordinates; the boards speak header labels.
        assert.match(SB3Creator.retargetPseudocode(SRC, 'samd51').pseudocode, /= PA\d+ /);
        assert.match(SB3Creator.retargetPseudocode(SRC, 'pybadge').pseudocode, /= D13 /);
    });

    test('a virtual target WARNS rather than refusing, and says why', () => {
        for (const d of ['arcade', 'pybadge-lc']) {
            const r = SB3Creator.retargetPseudocode(SRC, d);
            assert.ok(r.ok, `${d} must retarget — the pins are real to the runtime`);
            assert.ok(r.warnings.some((w) => /simulated GPIO/.test(w) && /no exposed circuit header/.test(w)),
                `${d} did not warn: ${JSON.stringify(r.warnings)}`);
            assert.ok(SB3Creator.RETARGET_POOLS[d].virtual);
        }
        for (const d of ['pybadge', 'samd51']) {
            const r = SB3Creator.retargetPseudocode(SRC, d);
            assert.ok(!r.warnings.some((w) => /simulated GPIO/.test(w)),
                `${d} has real pads and must NOT claim simulated GPIO`);
        }
    });

    test('THE REFUSAL: no Arcade-family target ever emits C', () => {
        // The claim in STC_PARTS is "selecting one of these can never silently
        // produce firmware for a different ARM part". That is enforced by
        // generateC()'s core allow-list rather than promised in a comment, and
        // this is the test that says so — the gap the upstreaming found was
        // that nothing asserted it anywhere.
        for (const d of FAMILY) {
            const r = SB3Creator.retargetPseudocode(SRC, d);
            const c = new SB3Creator();
            c.parse(r.pseudocode);
            const out = c.generateC();
            assert.match(out, /No C emitted for DEVICE/,
                `${d} EMITTED C — this is the failure the refusal exists to prevent`);
            assert.ok(!/avr\/io\.h|sfr |#include <8051/.test(out),
                `${d} emitted bare-metal register code for another part`);
            assert.ok((c._cWarnings || []).length > 0, `${d} refused silently`);
        }
        // And the console boards say something TRUE about themselves rather
        // than borrowing the Arduino sentence.
        const arcade = new SB3Creator();
        arcade.parse(SB3Creator.retargetPseudocode(SRC, 'arcade').pseudocode);
        arcade.generateC();
        assert.ok(arcade._cWarnings.some((w) => /no C back end here/.test(w)
            && /DIFFERENT ARM part/.test(w)), JSON.stringify(arcade._cWarnings));
    });

    test('pin vocabulary is enforced per board, not shared', () => {
        // PyBadge has no D4 on its breakouts; Arcade's D-space runs to D31.
        const bad = new SB3Creator();
        bad.parse(['DEVICE PYBADGE', 'PIN x = D4 OUTPUT', '', 'WHEN flag clicked:', '  turn on x'].join('\n'));
        assert.ok(bad.warnings.some((w) => /is not how pybadge names a pin/.test(w)),
            JSON.stringify(bad.warnings));
        const ok = new SB3Creator();
        ok.parse(['DEVICE ARCADE', 'PIN x = D31 OUTPUT', '', 'WHEN flag clicked:', '  turn on x'].join('\n'));
        assert.deepEqual(ok.warnings, []);
        // And the board still ends somewhere.
        const past = new SB3Creator();
        past.parse(['DEVICE ARCADE', 'PIN x = D32 OUTPUT', '', 'WHEN flag clicked:', '  turn on x'].join('\n'));
        assert.ok(past.warnings.some((w) => /goes up to D31/.test(w)), JSON.stringify(past.warnings));
    });

    test('the widened PIN regex admits PA31 and the named I2C pads', () => {
        const c = new SB3Creator();
        c.parse(['DEVICE SAMD51', 'PIN x = PA23 OUTPUT', '', 'WHEN flag clicked:', '  turn on x'].join('\n'));
        assert.deepEqual(c.warnings, [], 'two-digit port pins must parse');
        const i2c = new SB3Creator();
        i2c.parse(['DEVICE PYBADGE', 'PIN d = SDA OUTPUT', '', 'WHEN flag clicked:', '  turn on d'].join('\n'));
        assert.deepEqual(i2c.warnings, [], 'silkscreened SDA/SCL must parse');
        // The widening must not carry another board's looseness from one digit
        // to two. FOUND BY THIS TEST: stm32f030's row was `/^P[AB]\d+$/i`,
        // which accepted PB9 while its own message said PB1 — already wrong at
        // one digit, and `P[A-D]\d` -> `P[A-D]\d+` would have extended it to
        // PB19. The row now spells out what the message promises.
        for (const bad of ['PB9', 'PB19', 'PA23']) {
            const stm = new SB3Creator();
            stm.parse(['DEVICE STM32F030', `PIN x = ${bad} OUTPUT`, '', 'WHEN flag clicked:', '  turn on x'].join('\n'));
            assert.ok(stm.warnings.some((w) => /is not how stm32f030 names a pin/.test(w)),
                `${bad} was accepted: ${JSON.stringify(stm.warnings)}`);
        }
        for (const good of ['PA0', 'PA7', 'PA9', 'PA10', 'PB1']) {
            const stm = new SB3Creator();
            stm.parse(['DEVICE STM32F030', `PIN x = ${good} OUTPUT`, '', 'WHEN flag clicked:', '  turn on x'].join('\n'));
            assert.deepEqual(stm.warnings, [], `${good} is in the message and must parse`);
        }
    });
});

describe('MicroPython retargeting is explicit and remains distinct from C generation', () => {
    test('micro:bit has a reachable retarget pool', () => {
        const r = SB3Creator.retargetPseudocode(
            'DEVICE ARDUINO-NANO\nPIN led = D13 OUTPUT\n\nWHEN flag clicked:\n  turn on led\n',
            'microbit');
        assert.equal(r.ok, true, r.reasons.join('; '));
        assert.match(r.pseudocode, /^PIN led = P0 OUTPUT$/m);
        assert.equal(SB3Creator.STC_PARTS.microbit.core, 'micropython');
        assert.ok(SB3Creator.RETARGET_POOLS.microbit);
    });

    test('generateC still refuses a MicroPython board, and that guard is reachable', () => {
        // The OTHER refusal, which is real and tested in ctarget.test.mjs. It
        // must survive the deletion above — they are different guards.
        const c = new SB3Creator();
        c.parse('DEVICE MICROBIT\nPIN led = P0 OUTPUT\n\nWHEN flag clicked:\n  turn on led\n');
        assert.deepEqual(c.warnings, []);
        assert.match(c.generateC(), /No C emitted for DEVICE MICROBIT/);
        assert.ok(c._cWarnings.some((w) => /the program IS the artefact/.test(w)));
    });
});
