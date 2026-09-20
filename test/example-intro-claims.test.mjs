// Intro claims must match the bench the reader is looking at.
//
// The introductions are read as a description of THIS circuit, and several of
// them described a different one: 25-reaction-timer promised "the 7-segment
// display (or serial output) shows your reaction time" on a bench whose only
// output is one LED, and a "random" delay the program never took (its own
// EXPECTED.md said "fixed delay"). 24-pwm-fade promised "no flicker — like a
// dimmer switch" while running a 10 Hz software PWM, which is flicker by
// definition, and its EXPECTED.md documented the 10 Hz and contradicted the
// intro. Those are fixed; this gate exists so the class cannot grow back.
//
// A RATCHET, not a pass/fail snapshot. Every divergence below is real and
// unfixed: the intro names a component that appears in no circuit variant of
// that example. Fixing one means DELETING its line here — the list may only
// shrink. Adding a new divergence fails the build.
//
// Deliberately NOT flagged, each verified by hand:
//   - serial output: it is a panel, not a part, so no circuit can show it.
//   - faceplate examples: they carry no circuit at all; their "display" is art.
//   - 50-7seg-chase: its text says outright that each segment IS an LED.
//   - 27-led-dice, pc82-mini-roulette: a counter stopped by a human release is
//     a real random source, and both say so.
//   - "What is going on" / "Why it matters": these generalise on purpose.
//     02-dimmer says the same PWM drives a motor, which is true and is not a
//     claim about what is on the board.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Component families an intro can name, and the part kinds that back them. */
const CLAIMS = [
  { id: 'display', re: /\b(7[- ]?segment|seven[- ]segment|display shows|on the display|LCD|OLED|the display)\b/i,
    kinds: [/seven_segment/, /sevenseg/, /char_lcd/, /lcd/, /oled/, /ssd1306/, /led_matrix/,
      /matrix8x8/, /max7219/, /ili9341/, /vdp/, /tm1637/, /display/, /hd44780/, /tms9918/, /ps2/] },
  { id: 'buzzer', re: /\b(buzzer|beeps?|buzzes|piezo|plays a (tone|note|melody)|sound the alarm)\b/i,
    kinds: [/buzzer/, /speaker/, /piezo/] },
  { id: 'button', re: /\b(press (the |a )?button|push(ing)? the button|button press)\b/i,
    kinds: [/button/, /keypad/, /switch/] },
  { id: 'pot', re: /\b(potentiometer|turn the knob|the knob|twist the dial)\b/i,
    kinds: [/potentiometer/, /pot\b/] },
  { id: 'ldr', re: /\b(photoresistor|light sensor|LDR|light-dependent)\b/i, kinds: [/ldr/, /photo/] },
  { id: 'temp', re: /\b(temperature sensor|thermistor|NTC|DS18B20|LM35)\b/i,
    kinds: [/ntc/, /temp_sensor/, /ds18b20/, /lm35/, /thermistor/] },
  { id: 'servo', re: /\bservo\b/i, kinds: [/servo/] },
  { id: 'motor', re: /\b(motor|fan spins)\b/i, kinds: [/motor/, /fan/, /relay/] },
  { id: 'relay', re: /\brelay\b/i, kinds: [/relay/] },
];

// MEASURED 2026-09-20 by the check below, then read one by one against each
// example's circuits. `${id}:${claim}`.
const KNOWN_DIVERGENCES = new Set([
  // A potentiometer stands in for the sensor, and the text does not say so.
  '03-night-light:ldr', '04-thermostat:temp', '16-ldr-bargraph:ldr',
  'arduino-sk-p03-love-o-meter:temp', 'arduino-sk-p06-light-theremin:ldr',
  // The named part is simply absent from every variant.
  '26-debounce:display', '53-servo-sweep:servo', '53-servo-sweep:motor',
  '54-motor-driver:motor', 'arduino-03-fading:pot', 'arduino-sk-p05-servo-mood:servo',
  'arduino-sk-p06-light-theremin:buzzer', 'arduino-sk-p14-serial-pot:pot',
  'pc58-555-audio-pulse:pot',
  // Ports whose bench holds nothing but an MCU, power and a breadboard, while
  // the text describes a whole project. See EMPTY_BENCHES below.
  'arduino-sk-p07-keyboard:button', 'arduino-sk-p09-motorized-pinwheel:button',
  'arduino-sk-p09-motorized-pinwheel:motor', 'arduino-sk-p10-zoetrope:motor',
  'arduino-sk-p12-knock-lock:buzzer', 'arduino-sk-p12-knock-lock:button',
  'arduino-sk-p12-knock-lock:servo', 'arduino-sk-p15-hacking-buttons:button',
]);

// Intros that name a component and then say, in the same breath, what actually
// stands in for it. Not divergences: the reader is told the truth. Each one is
// quoted so a later edit that removes the explanation stops being exempt.
const EXPLAINS_ITS_STAND_IN = new Map([
  ['50-7seg-chase:display', /every segment is just an LED/i],
]);

// Kinds that are scaffolding rather than something to look at.
const INERT = new Set(['vcc', 'gnd', 'breadboard', 'mcu', 'arduino_uno', 'arduino_nano',
  'arduino_mega', 'pi_pico', 'stc_mcu', 'stc15_mcu', 'attiny85', 'attiny88', 'stm32f030',
  'atmega168p', 'microbit', 'microbit_breakout', 'pybadge']);

// A bench with nothing on it is correct for a serial-only exercise and wrong for
// a project description. These are the serial-only ones, verified by hand.
const SERIAL_ONLY = new Set(['arduino-04-ascii-table', 'arduino-08-char-analysis',
  'arduino-08-string-append', 'arduino-08-string-case', 'arduino-08-string-chars',
  'arduino-08-string-compare', 'arduino-08-string-constructors', 'arduino-08-string-indexof',
  'arduino-08-string-length', 'arduino-08-string-length-trim', 'arduino-08-string-replace',
  'arduino-08-string-startswith', 'arduino-08-string-substring', 'arduino-08-string-toint']);

// MEASURED 2026-09-20: benches carrying no component at all whose text still
// describes a project. Shrinks as each is either built out or rewritten.
const KNOWN_EMPTY_BENCHES = new Set(['79-a2-sampler', '80-a2-lcd-moving-text',
  '81-8051-lcd1602-parallel', '82-a2-led-row', 'arduino-sk-p07-keyboard',
  'arduino-sk-p08-hourglass', 'arduino-sk-p09-motorized-pinwheel', 'arduino-sk-p10-zoetrope',
  'arduino-sk-p11-crystal-ball', 'arduino-sk-p12-knock-lock', 'arduino-sk-p13-touch-lamp',
  'arduino-sk-p14-serial-pot']);

function exampleDirs() {
  return readdirSync(EXAMPLES).filter(id => {
    const d = join(EXAMPLES, id);
    return statSync(d).isDirectory() && existsSync(join(d, 'intro.md'));
  }).sort();
}

function partKinds(dir) {
  const kinds = new Set();
  for (const f of readdirSync(dir)) {
    if (!/^circuit.*\.json$/.test(f)) continue;
    try {
      for (const p of JSON.parse(readFileSync(join(dir, f), 'utf8')).parts || []) {
        kinds.add(String(p.kind).toLowerCase());
      }
    } catch { /* a malformed circuit is another gate's business */ }
  }
  return kinds;
}

/** Only the sections that describe THIS bench. */
function describedSections(intro) {
  const body = intro.replace(/^---\n[\s\S]*?\n---\n/, '');
  const lines = body.split('\n');
  const grab = name => {
    const start = lines.findIndex(l => new RegExp(`^##\\s+${name}\\s*$`).test(l));
    if (start < 0) return '';
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break; }
    return lines.slice(start + 1, end).join('\n');
  };
  return `${grab('What you see')}\n${grab('Try this')}`;
}

function divergences() {
  const found = new Set();
  for (const id of exampleDirs()) {
    const dir = join(EXAMPLES, id);
    const kinds = partKinds(dir);
    if (kinds.size === 0) continue; // faceplate/art example: no circuit to contradict
    const described = describedSections(readFileSync(join(dir, 'intro.md'), 'utf8'));
    for (const claim of CLAIMS) {
      if (!claim.re.test(described)) continue;
      if ([...kinds].some(k => claim.kinds.some(rx => rx.test(k)))) continue;
      const explained = EXPLAINS_ITS_STAND_IN.get(`${id}:${claim.id}`);
      if (explained && explained.test(described)) continue;
      found.add(`${id}:${claim.id}`);
    }
  }
  return found;
}

function emptyBenches() {
  const found = new Set();
  for (const id of exampleDirs()) {
    if (SERIAL_ONLY.has(id)) continue;
    const kinds = partKinds(join(EXAMPLES, id));
    if (kinds.size === 0) continue;
    if (![...kinds].some(k => !INERT.has(k))) found.add(id);
  }
  return found;
}

describe('example intros describe the bench in front of the reader', () => {
  test('no NEW intro names a component its circuits do not contain', () => {
    const now = divergences();
    const added = [...now].filter(d => !KNOWN_DIVERGENCES.has(d));
    assert.deepEqual(added, [], 'these intros claim a part no circuit variant has:\n  '
      + added.join('\n  '));
  });

  test('the known divergences only shrink', () => {
    const now = divergences();
    const fixed = [...KNOWN_DIVERGENCES].filter(d => !now.has(d));
    assert.deepEqual(fixed, [], 'these are fixed — delete them from KNOWN_DIVERGENCES:\n  '
      + fixed.join('\n  '));
  });

  test('no NEW example ships a bench with nothing on it', () => {
    const now = emptyBenches();
    const added = [...now].filter(id => !KNOWN_EMPTY_BENCHES.has(id));
    assert.deepEqual(added, [], 'these benches hold only power, breadboard and an MCU:\n  '
      + added.join('\n  '));
  });

  test('the known empty benches only shrink', () => {
    const now = emptyBenches();
    const fixed = [...KNOWN_EMPTY_BENCHES].filter(id => !now.has(id));
    assert.deepEqual(fixed, [], 'these now carry components — delete them from '
      + 'KNOWN_EMPTY_BENCHES:\n  ' + fixed.join('\n  '));
  });

  test('the two examples this gate was written for stay fixed', () => {
    // 25-reaction-timer: no display claim, no random claim, and the counter
    // must stay in 10 ms units or the readout becomes 50 s of blinking again.
    const rt = join(EXAMPLES, '25-reaction-timer');
    const rtIntro = describedSections(readFileSync(join(rt, 'intro.md'), 'utf8'));
    assert.doesNotMatch(rtIntro, /7[- ]?segment|serial output/i);
    assert.doesNotMatch(rtIntro, /\brandom\b/i);
    const rtProg = readFileSync(join(rt, 'program.bw'), 'utf8')
      .split('\n').map(l => l.replace(/#.*$/, '')).join('\n');
    assert.match(rtProg, /change counter by 1\s*\n\s*wait 0\.01 seconds/);

    // 24-pwm-fade: the tick IS the claim. 100 duty steps x 0.1 ms = 10 ms =
    // 100 Hz; at 1 ms it is 10 Hz and "no flicker" becomes false.
    const pwm = readFileSync(join(EXAMPLES, '24-pwm-fade', 'program.bw'), 'utf8');
    assert.equal((pwm.match(/wait 0\.0001 seconds/g) || []).length, 4,
      'all four PWM ticks must be 0.1 ms');
    assert.doesNotMatch(pwm.split('\n').filter(l => !l.trim().startsWith('#')).join('\n'),
      /wait 0\.001 seconds/);
  });
});
