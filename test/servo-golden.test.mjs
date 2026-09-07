// P2 (servo): the servo driver's emitted C must not move a byte.
//
// generateC's servo driver (bw_servo_set + bw_servo_get, plus a PCA ISR on the
// 8051) was hand-copied per family. P2 factors it into one protocol body
// (_cServoHelper) over per-family bus (_cServoBus): the set wrapper and the
// angle clamp are shared, the getter is shared across the three array-based
// families (arm/avr/avr-Mega), and — the largest single piece of duplication —
// avr and avr-Mega share ONE bus body (identical Timer 1 code), differing only
// in the header routing comment. This pins each family's emitted driver against
// the pre-refactor bytes.
//
// No i8086 row: servo needs a PWM/compare source the 8086 back end does not
// expose, so it stays a measured gap in the 8086 column.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const cOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateC(); };
const prog = (device, pin) =>
    `DEVICE ${device}\nPIN led = ${pin} OUTPUT\nWHEN flag clicked:\n  set myservo angle to 90`;
const PROGRAMS = {
    arm:        prog('PICO', 'GP25'),
    'avr-mega': prog('ARDUINO-MEGA', 'D13'),
    avr:        prog('ARDUINO-UNO', 'D13'),
    '8051':     prog('STC12C5A60S2', 'P1.0'),
};

// Exact emitted driver block (header comment → the getter, or the PCA ISR on the
// 8051), captured from the emitter BEFORE the P2 refactor. This is the golden.
const GOLDEN = {
    arm: `/* Servo driver: PWM slice 0 at 50 Hz — servo 1 = GP16 (channel A),
 * servo 2 = GP17 (channel B). TOP 19999 at the 1 MHz slice clock is
 * a 20 ms frame, and CC is then the pulse width in MICROSECONDS
 * directly (500-2500). Slice 0 belongs to the servos: dimming on
 * GP16/GP17 in the same program would retune their frame. */
static int _servo_angle[2];

static void bw_servo_set(int servo, int angle)
{
    uint32_t gpio, us;
    if (servo < 1 || servo > 2) return;
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    _servo_angle[servo - 1] = angle;
    gpio = 15u + (uint32_t)servo;            /* 1 -> GP16, 2 -> GP17 */
    us = 500u + (uint32_t)angle * 2000u / 180u;
    BW_IOBANK0_CTRL(gpio) = 4u;              /* funcsel PWM */
    BW_PWM_DIV(0) = 125u << 4;               /* 1 MHz slice clock */
    BW_PWM_TOP(0) = 19999u;                  /* 20 ms frame */
    if (gpio & 1u) BW_PWM_CC(0) = (BW_PWM_CC(0) & 0xFFFFu) | (us << 16);
    else BW_PWM_CC(0) = (BW_PWM_CC(0) & 0xFFFF0000u) | us;
    BW_PWM_CSR(0) = 1u;
}

static int bw_servo_get(int servo)
{ return (servo >= 1 && servo <= 2) ? _servo_angle[servo - 1] : 0; }`,
    avr: `/* Servo driver: Timer 1 in mode 14 (fast PWM, ICR1 TOP) at 50 Hz —
 * servo 1 = D9 (OC1A), servo 2 = D10 (OC1B). Prescaler 8 gives
 * 0.5 µs ticks: ICR1 = 39999 is 20 ms and OCR1x = 2 × pulse-µs.
 * Timer 1 belongs to the servos in this program (bw_setup put it
 * in mode 14, not the dimmer's 8-bit mode). */
static int _servo_angle[2];

static void bw_servo_set(int servo, int angle)
{
    unsigned int us;
    if (servo < 1 || servo > 2) return;
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    _servo_angle[servo - 1] = angle;
    us = (unsigned int)(500u + (unsigned long)angle * 2000u / 180u);
    if (servo == 1) { TCCR1A |= (1 << COM1A1); OCR1A = us * 2u; }
    else            { TCCR1A |= (1 << COM1B1); OCR1B = us * 2u; }
}

static int bw_servo_get(int servo)
{ return (servo >= 1 && servo <= 2) ? _servo_angle[servo - 1] : 0; }`,
    'avr-mega': `/* Servo driver: Timer 1 in mode 14 (fast PWM, ICR1 TOP) at 50 Hz —
 * Mega routing: servo 1 = D11 (OC1A/PB5), servo 2 = D12 (OC1B/PB6).
 * Prescaler 8 gives 0.5 µs ticks: ICR1 = 39999 is 20 ms and
 * OCR1x = 2 × pulse-µs. Timer 1 belongs to the servos here. */
static int _servo_angle[2];

static void bw_servo_set(int servo, int angle)
{
    unsigned int us;
    if (servo < 1 || servo > 2) return;
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    _servo_angle[servo - 1] = angle;
    us = (unsigned int)(500u + (unsigned long)angle * 2000u / 180u);
    if (servo == 1) { TCCR1A |= (1 << COM1A1); OCR1A = us * 2u; }
    else            { TCCR1A |= (1 << COM1B1); OCR1B = us * 2u; }
}

static int bw_servo_get(int servo)
{ return (servo >= 1 && servo <= 2) ? _servo_angle[servo - 1] : 0; }`,
    '8051': `/* Servo driver: PCA module 0 in 16-bit compare/match mode (50 Hz). */
/* Pin: P1.3 (CCP0). Note: P1.3 is also the ADC example pin — a */
/* project using both servo and ADC on P1.3 would conflict. CCP1 on */
/* P1.4 is available as an alternative. */
/* FOSC/12 clock: 20 ms = FOSC_HZ/12/50 counts. Pulse: 500-2500 µs. */
#define SERVO_PERIOD  ((unsigned int)(FOSC_HZ / 12UL / 50UL))
#define SERVO_MIN_US  500
#define SERVO_MAX_US  2500
static unsigned int _servo_pulse;   /* pulse width in timer counts */
static unsigned int _servo_phase;   /* 0 = rising edge, 1 = falling */
static int _servo_angle;

static void bw_servo_set(int servo, int angle)
{
    unsigned long us;
    (void)servo;
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    _servo_angle = angle;
    us = SERVO_MIN_US + (unsigned long)angle * (SERVO_MAX_US - SERVO_MIN_US) / 180;
    _servo_pulse = (unsigned int)(us * (FOSC_HZ / 12UL) / 1000000UL);
}

static int bw_servo_get(int servo) { (void)servo; return _servo_angle; }

/* PCA ISR: toggles the servo pin at the pulse edges. */
/* Module 0 match flag (CCF0) fires twice per period: */
/*   phase 0: set pin HIGH, schedule falling edge at +_servo_pulse */
/*   phase 1: set pin LOW,  schedule rising edge at +(PERIOD-pulse) */
void bw_pca_isr(void) __interrupt(7)
{
    unsigned int next;
    if (!(CCON & 0x01)) return;  /* not CCF0 */
    CCON &= ~0x01;               /* clear CCF0 */
    if (_servo_phase == 0) {
        P1_3 = 1;                /* pulse start */
        next = ((unsigned int)CCAP0H << 8) | CCAP0L;
        next += _servo_pulse;
        CCAP0L = (unsigned char)(next & 0xFF);
        CCAP0H = (unsigned char)(next >> 8);
        _servo_phase = 1;
    } else {
        P1_3 = 0;                /* pulse end */
        next = ((unsigned int)CCAP0H << 8) | CCAP0L;
        next += SERVO_PERIOD - _servo_pulse;
        CCAP0L = (unsigned char)(next & 0xFF);
        CCAP0H = (unsigned char)(next >> 8);
        _servo_phase = 0;
    }
}`,
};

// Extract the servo driver: from its header comment, exactly as many lines as
// the golden — so an added/removed line inside the block still fails the match.
function extractDriver(code, expected) {
    const lines = code.split('\n');
    const start = lines.findIndex((l) => /Servo driver/.test(l));
    assert.ok(start >= 0, 'no servo driver found in emitted C');
    return lines.slice(start, start + expected.split('\n').length).join('\n');
}

for (const [fam, src] of Object.entries(PROGRAMS)) {
    test(`servo driver emitted C is byte-identical to golden (${fam})`, () => {
        const driver = extractDriver(cOf(src), GOLDEN[fam]);
        assert.equal(driver, GOLDEN[fam],
            `${fam} servo driver drifted from the golden — the protocol/bus split must not change a byte`);
    });
}

test('avr and avr-Mega share one servo body (only the header comment differs)', () => {
    // The dominant piece of the duplication P2 removes: strip the leading header
    // comment block from each, and the rest must be byte-identical.
    const body = (g) => g.split('\n').filter((l) => !l.startsWith(' *') && !l.startsWith('/*')).join('\n');
    assert.equal(body(GOLDEN.avr), body(GOLDEN['avr-mega']),
        'avr and avr-Mega servo bodies diverged — they must be one shared bus body');
});
