// ESP8266 (LX106) through generateC: the emission targets the blob-free
// esp8266js runtime's Arduino-style API (firmware/arduino/Arduino.h), whose
// arduino.c owns main() and calls setup() once and loop() forever. These
// tests pin the emitted calls, the refusals (no analogRead, no Servo, flash
// and unsupported GPIOs) and — where a host gcc exists — that the emitted C
// type-checks against a stub of that header. Pin spelling is the Pico's:
// GPn is GPIO n.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';

function gen(src, opts = {}) {
    const c = new SB3Creator();
    c.parse(src);
    const code = c.generateC(c.project, opts);
    return { code, warnings: c._cWarnings || [] };
}

const BLINK = 'DEVICE ESP8266\nPIN led1 = GP2 OUTPUT\n\n'
    + 'WHEN flag clicked:\n  forever:\n    turn on led1\n    wait 0.5 seconds\n'
    + '    turn off led1\n    wait 0.5 seconds\n';

const BUTTON = 'DEVICE ESP8266\nPIN led1 = GP4 OUTPUT\nPIN btn1 = GP5 INPUT ACTIVE LOW\n\n'
    + 'WHEN flag clicked:\n  forever:\n    IF read btn1 THEN:\n      turn on led1\n'
    + '    ELSE:\n      turn off led1\n';

const PRINT = 'DEVICE ESP8266\nPIN led1 = GP4 OUTPUT\n\n'
    + 'WHEN flag clicked:\n  print "hello"\n  print 42\n';

const PWM_TONE = 'DEVICE ESP8266\nPIN dim = GP13 PWM\nPIN buzz = GP14 TONE\n\n'
    + 'WHEN flag clicked:\n  set dim to 50 percent\n  set buzz to 440 hz\n  wait 1 seconds\n'
    + '  set buzz to 0 hz\n';

const TASKS = 'DEVICE ESP8266\nPIN led1 = GP4 OUTPUT\nPIN led2 = GP12 OUTPUT\n'
    + 'PIN btn1 = GP5 INPUT ACTIVE LOW\n\n'
    + 'WHEN flag clicked:\n  forever:\n    toggle led1\n    wait 0.25 seconds\n\n'
    + 'WHEN btn1 pressed:\n  toggle led2\n';

const ALL = { BLINK, BUTTON, PRINT, PWM_TONE, TASKS };

/** Shape every ESP8266 build shares: runtime header, setup/loop, no main. */
function assertRuntimeShape(code) {
    assert.match(code, /#include "Arduino\.h"/);
    assert.match(code, /^void setup\(void\)\n\{\n {4}bw_setup\(\);\n\}/m);
    assert.match(code, /^void loop\(void\)$/m);
    assert.doesNotMatch(code, /^\s*(?:int|void) main\s*\(/m, 'arduino.c owns main(); the program must not define it');
    assert.doesNotMatch(code, /BW_MMIO|BW_SIO|BW_TIMER|BW_UART0|GPIOA_|TIM3_|USART1_|NVIC|__asm/,
        'no RP2040/STM32 register vocabulary in an ESP8266 build');
}

test('ESP8266 blink: digitalWrite on the GPIO number, millis() timebase', () => {
    const { code, warnings } = gen(BLINK);
    assert.deepEqual(warnings, []);
    assertRuntimeShape(code);
    assert.match(code, /@bw device esp8266/);
    assert.match(code, /#define F_CPU 80000000UL/);
    assert.match(code, /static uint32_t bw_now\(void\) \{ return \(uint32_t\)millis\(\); \}/);
    assert.match(code, /digitalWrite\(2, HIGH\);/);
    assert.match(code, /digitalWrite\(2, LOW\);/);
    assert.match(code, /bw_task0_until = bw_now\(\) \+ \(500\);/);
    assert.match(code, /pinMode\(2, OUTPUT\);/);
    assert.match(code, /void loop\(void\)\n\{\n {4}uint32_t pass_ms = bw_now\(\);\n {4}bw_task0\(\);/);
});

test('ESP8266 button: ACTIVE LOW input gets INPUT_PULLUP and an inverted digitalRead', () => {
    const { code, warnings } = gen(BUTTON);
    assert.deepEqual(warnings, []);
    assertRuntimeShape(code);
    assert.match(code, /pinMode\(5, INPUT_PULLUP\);/);
    assert.match(code, /!\(digitalRead\(5\)\)/);
    assert.match(code, /digitalWrite\(4, HIGH\);/);
});

test('ESP8266 print: bw_serial_begin(9600) in setup, bw_serial_write for text', () => {
    const { code, warnings } = gen(PRINT);
    assert.deepEqual(warnings, []);
    assertRuntimeShape(code);
    assert.match(code, /bw_serial_begin\(9600\);/);
    assert.match(code, /bw_serial_write\(s\);/);
    assert.match(code, /bw_print\("hello"\);/);
    assert.match(code, /bw_print_num\(42\);/);
});

test('ESP8266 PWM and tone: analogWrite 0..255, three-argument tone until noTone', () => {
    const { code, warnings } = gen(PWM_TONE);
    assert.deepEqual(warnings, []);
    assertRuntimeShape(code);
    assert.match(code, /analogWrite\(gpio, \(int\)\(\(percent \* 255u \+ 50u\) \/ 100u\)\);/);
    assert.match(code, /pwm_set\(13, 50\);/);
    assert.match(code, /tone\(14, freq, 0\);/);
    assert.match(code, /noTone\(14\);/);
    assert.match(code, /tone_set\(440\);/);
    assert.match(code, /tone_set\(0\);/);
});

test('ESP8266 when-pressed hat + flag script: two tasks dispatched from loop()', () => {
    const { code, warnings } = gen(TASKS);
    assert.deepEqual(warnings, []);
    assertRuntimeShape(code);
    assert.match(code, /@bw script bw_task1 1 stage hat pin btn1 pressed/);
    assert.match(code, /void loop\(void\)\n\{\n {4}uint32_t pass_ms = bw_now\(\);\n {4}bw_task0\(\);\n {4}bw_task1\(\);/);
    assert.match(code, /digitalWrite\(4, !digitalRead\(4\)\);/);
    assert.match(code, /digitalWrite\(12, !digitalRead\(12\)\);/);
});

test('ESP8266 refuses an ANALOG pin: the runtime has no analogRead', () => {
    assert.throws(() => gen('DEVICE ESP8266\nPIN pot = GP12 ANALOG\n\nWHEN flag clicked:\n  print 1\n'),
        (e) => e.lines.some((l) => /ANALOG is not available on the ESP8266: its runtime has no analogRead/.test(l.reason)));
});

test('ESP8266 refuses a sensor reading (analog input) by name, emitting no C', () => {
    const { code, warnings } = gen('DEVICE ESP8266\nPIN led1 = GP4 OUTPUT\n\n'
        + 'WHEN flag clicked:\n  print light from 1\n');
    assert.match(code, /^\/\* No C emitted for DEVICE ESP8266\./);
    assert.ok(warnings.some((w) => /analog input \(the runtime has no analogRead\)/.test(w)), warnings.join('\n'));
});

test('ESP8266 refuses servo by name, emitting no C', () => {
    const { code, warnings } = gen('DEVICE ESP8266\nPIN led1 = GP4 OUTPUT\n\n'
        + 'WHEN flag clicked:\n  set 1 angle to 90\n');
    assert.match(code, /^\/\* No C emitted for DEVICE ESP8266\./);
    assert.doesNotMatch(code, /bw_servo_set/);
    assert.ok(warnings.some((w) => /servo \(the runtime has no Servo\)/.test(w)), warnings.join('\n'));
});

test('ESP8266 refuses flash-bus and unsupported GPIOs at the PIN line', () => {
    for (const where of ['GP6', 'GP9', 'GP11', 'GP16', 'GP25', 'D4']) {
        assert.throws(() => gen(`DEVICE ESP8266\nPIN p = ${where} OUTPUT\n\nWHEN flag clicked:\n  turn on p\n`),
            (e) => e.lines.some((l) => /GP0-GP5 or GP12-GP15/.test(l.reason)), where);
    }
});

test('ESP8266 warns when print shares the serial TX/RX pins', () => {
    const { warnings } = gen('DEVICE ESP8266\nPIN led1 = GP1 OUTPUT\n\nWHEN flag clicked:\n  print 1\n  turn on led1\n');
    assert.ok(warnings.some((w) => /serial TX pin/.test(w)), warnings.join('\n'));
});

let hasGcc = false;
try { execFileSync('gcc', ['--version'], { stdio: 'pipe' }); hasGcc = true; } catch { /* reported by the skip reason */ }

// A stub of the runtime's Arduino.h (signatures as the esp8266js header
// declares them; bw_serial_* come from bw8266.h, which Arduino.h includes).
const STUB_ARDUINO_H = `#ifndef ARDUINO_H
#define ARDUINO_H
#define LOW 0
#define HIGH 1
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
void pinMode(int pin, int mode);
void digitalWrite(int pin, int value);
int digitalRead(int pin);
void delay(unsigned long milliseconds);
void delayMicroseconds(unsigned int microseconds);
unsigned long millis(void);
unsigned long micros(void);
void analogWrite(int pin, int value);
void tone(int pin, unsigned int frequency, unsigned long durationMilliseconds);
void noTone(int pin);
void bw_serial_begin(unsigned int baud);
void bw_serial_write(const char *text);
void setup(void);
void loop(void);
#endif
`;

test('ESP8266 emitted C type-checks against the runtime API (gcc -fsyntax-only)',
    { skip: hasGcc ? false : 'needs a host gcc (absent on this machine)' },
    () => {
        const dir = mkdtempSync(join(tmpdir(), 'bw-esp8266-'));
        try {
            writeFileSync(join(dir, 'Arduino.h'), STUB_ARDUINO_H);
            for (const [name, src] of Object.entries(ALL)) {
                for (const debug of [false, true]) {
                    const { code } = gen(src, { debug });
                    const file = join(dir, `${name}${debug ? '-debug' : ''}.c`);
                    writeFileSync(file, code);
                    execFileSync('gcc', ['-fsyntax-only', '-std=c99', '-Werror=implicit-function-declaration',
                        '-Werror=return-type', '-I', dir, file], { stdio: 'pipe' });
                }
            }
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
