// P2 (motor): the DC-motor driver's emitted C must not move a byte.
//
// generateC's motor driver (bw_motor_speed / _get_speed / bw_motor_dir /
// _get_dir, an L293D H-bridge) was hand-copied once per family. P2 factors it
// into ONE protocol body (_cMotorHelper) over per-family BUS primitives
// (_cMotorBus): the two getters are identical everywhere, and speed/dir differ
// only in the PWM pin and how the direction pins are set up and driven. This
// test pins the exact emitted driver for every family that has one — arm,
// avr (Mega and Uno routings), 8051 — against the pre-refactor bytes.
//
// No i8086 row: motor needs a PWM source and an H-bridge, and the 8086 back end
// has neither the pwm_set primitive nor a bench part to prove one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const cOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateC(); };

// speed + direction, so both driver functions emit. A PIN forces bare metal.
const prog = (device, pin) =>
    `DEVICE ${device}\nPIN led = ${pin} OUTPUT\nWHEN flag clicked:\n  set mymotor speed to 50\n  set mymotor direction to reverse`;
const PROGRAMS = {
    arm:        prog('PICO', 'GP25'),
    'avr-mega': prog('ARDUINO-MEGA', 'D13'),
    avr:        prog('ARDUINO-UNO', 'D13'),
    '8051':     prog('STC12C5A60S2', 'P1.0'),
};

// The exact emitted driver block (header comment → bw_motor_get_dir), captured
// from the emitter BEFORE the P2 refactor. This is the golden.
const GOLDEN = {
    arm: `/* DC motor driver: GP18 (PWM slice 1A) carries speed at 1 kHz;
 * direction is GP19 (IN1) and GP20 (IN2) into an L293D-style
 * H-bridge — the 8051 build's P3.4/P3.5 convention in Pico
 * spelling. The servo's slice 0 (GP16/GP17) is untouched. */
static int _motor_speed;
static int _motor_dir;

static void bw_motor_speed(int motor, int speed)
{
    (void)motor;
    if (speed < 0) speed = 0;
    if (speed > 100) speed = 100;
    _motor_speed = speed;
    pwm_set(18, (unsigned int)speed);   /* GP18 = slice 1 A */
}

static int bw_motor_get_speed(int motor) { (void)motor; return _motor_speed; }

/* Direction: 0=forward 1=reverse 2=brake 3=coast */
static void bw_motor_dir(int motor, int dir)
{
    (void)motor;
    _motor_dir = dir;
    BW_IOBANK0_CTRL(19) = 5u;
    BW_IOBANK0_CTRL(20) = 5u;
    BW_SIO_GPIO_OE_SET = (1UL << 19) | (1UL << 20);
    switch (dir) {
    case 0: BW_SIO_GPIO_OUT_SET = (1UL << 19); BW_SIO_GPIO_OUT_CLR = (1UL << 20); break;
    case 1: BW_SIO_GPIO_OUT_CLR = (1UL << 19); BW_SIO_GPIO_OUT_SET = (1UL << 20); break;
    case 2: BW_SIO_GPIO_OUT_SET = (1UL << 19) | (1UL << 20); break;
    default: BW_SIO_GPIO_OUT_CLR = (1UL << 19) | (1UL << 20); break;
    }
}

static int bw_motor_get_dir(int motor) { (void)motor; return _motor_dir; }`,
    'avr-mega': `/* DC motor driver, Mega routing: OC2B (D9/PH6) carries speed PWM
 * at 977 Hz; direction is D7 (PH4, IN1) and D8 (PH5, IN2) into
 * an L293D-style H-bridge. */
static int _motor_speed;
static int _motor_dir;

static void bw_motor_speed(int motor, int speed)
{
    (void)motor;
    if (speed < 0) speed = 0;
    if (speed > 100) speed = 100;
    _motor_speed = speed;
    pwm_set(9, (unsigned int)speed);   /* OC2B = D9 on the Mega */
}

static int bw_motor_get_speed(int motor) { (void)motor; return _motor_speed; }

/* Direction: 0=forward 1=reverse 2=brake 3=coast. D7=PH4, D8=PH5. */
static void bw_motor_dir(int motor, int dir)
{
    (void)motor;
    _motor_dir = dir;
    DDRH |= (1 << 4) | (1 << 5);
    switch (dir) {
    case 0: PORTH |= (1 << 4);  PORTH &= (uint8_t)~(1 << 5); break;
    case 1: PORTH &= (uint8_t)~(1 << 4); PORTH |= (1 << 5); break;
    case 2: PORTH |= (1 << 4) | (1 << 5); break;
    default: PORTH &= (uint8_t)~((1 << 4) | (1 << 5)); break;
    }
}

static int bw_motor_get_dir(int motor) { (void)motor; return _motor_dir; }`,
    avr: `/* DC motor driver: OC2B (D3) carries speed PWM at 977 Hz;
 * direction is D7 (IN1) and D8 (IN2) into an L293D-style
 * H-bridge — the 8051 build's P3.4/P3.5 convention in Arduino
 * spelling. Timer 2 is shared with dimmers; the servo's
 * Timer 1 is untouched. */
static int _motor_speed;
static int _motor_dir;

static void bw_motor_speed(int motor, int speed)
{
    (void)motor;
    if (speed < 0) speed = 0;
    if (speed > 100) speed = 100;
    _motor_speed = speed;
    pwm_set(3, (unsigned int)speed);   /* OC2B = D3 */
}

static int bw_motor_get_speed(int motor) { (void)motor; return _motor_speed; }

/* Direction: 0=forward 1=reverse 2=brake 3=coast.
 * D7 = PD7 (IN1), D8 = PB0 (IN2). */
static void bw_motor_dir(int motor, int dir)
{
    (void)motor;
    _motor_dir = dir;
    DDRD |= (1 << 7);
    DDRB |= (1 << 0);
    switch (dir) {
    case 0: PORTD |= (1 << 7);  PORTB &= (uint8_t)~(1 << 0); break;
    case 1: PORTD &= (uint8_t)~(1 << 7); PORTB |= (1 << 0); break;
    case 2: PORTD |= (1 << 7);  PORTB |= (1 << 0); break;
    default: PORTD &= (uint8_t)~(1 << 7); PORTB &= (uint8_t)~(1 << 0); break;
    }
}

static int bw_motor_get_dir(int motor) { (void)motor; return _motor_dir; }`,
    '8051': `/* DC motor driver: PCA module 1 (CCP1, P1.4) in 8-bit PWM mode. */
/* No ISR needed — the hardware toggles the pin autonomously. */
/* Direction: P3.4 (IN1) and P3.5 (IN2) for L293D H-bridge. */
#define MOTOR_IN1  P3_4
#define MOTOR_IN2  P3_5
static int _motor_speed;
static int _motor_dir;

static void bw_motor_speed(int motor, int speed)
{
    (void)motor;
    if (speed < 0) speed = 0;
    if (speed > 100) speed = 100;
    _motor_speed = speed;
    pwm_set(1, (unsigned int)speed);   /* PCA module 1 (CCP1/P1.4) */
}

static int bw_motor_get_speed(int motor) { (void)motor; return _motor_speed; }

/* Direction: 0=forward 1=reverse 2=brake 3=coast */
static void bw_motor_dir(int motor, int dir)
{
    (void)motor;
    _motor_dir = dir;
    switch (dir) {
        case 0: MOTOR_IN1 = 1; MOTOR_IN2 = 0; break;  /* forward */
        case 1: MOTOR_IN1 = 0; MOTOR_IN2 = 1; break;  /* reverse */
        case 2: MOTOR_IN1 = 1; MOTOR_IN2 = 1; break;  /* brake */
        default: MOTOR_IN1 = 0; MOTOR_IN2 = 0; break; /* coast */
    }
}

static int bw_motor_get_dir(int motor) { (void)motor; return _motor_dir; }`,
};

// Pull the motor driver block (its header comment down to _get_dir) out of a
// full generateC dump.
function extractDriver(code) {
    const lines = code.split('\n');
    const start = lines.findIndex((l) => /DC motor driver/.test(l));
    assert.ok(start >= 0, 'no motor driver found in emitted C');
    const end = lines.findIndex((l, i) => i >= start && l.includes('bw_motor_get_dir(int motor)'));
    assert.ok(end > start, 'motor driver has no _get_dir');
    return lines.slice(start, end + 1).join('\n');
}

for (const [fam, src] of Object.entries(PROGRAMS)) {
    test(`motor driver emitted C is byte-identical to golden (${fam})`, () => {
        const driver = extractDriver(cOf(src));
        assert.equal(driver, GOLDEN[fam],
            `${fam} motor driver drifted from the golden — the protocol/bus split must not change a byte`);
    });
}

test('the motor getters are one shared protocol body (identical across families)', () => {
    // bw_motor_get_speed and bw_motor_get_dir are byte-identical everywhere —
    // the clearest slice of the duplication P2 removes.
    const getters = (g) => g.match(/static int bw_motor_get_\w+\(int motor\) \{ \(void\)motor; return _motor_\w+; \}/g);
    const arm = getters(GOLDEN.arm);
    assert.equal(arm.length, 2, 'expected both getters in the golden');
    for (const fam of Object.keys(GOLDEN)) {
        assert.deepEqual(getters(GOLDEN[fam]), arm, `${fam} getters differ — they must be the shared protocol`);
    }
});
