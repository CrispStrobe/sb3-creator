# MicroPython driver coverage vs C (the P3 measurement)

P3 adds MicroPython protocol drivers for the peripheral part set, proven by a
differential: emit C and MicroPython for one program, run both against the
simulated part on the Pico, compare state. This measures the starting point —
which parts `generateMicroPython` drives today, which only `generateC` drives,
and the display-text assertions a `text_line_0` assert kind would unblock — so
the first part is picked from facts.

## MicroPython vs C, by part

Coverage is read from `generateMicroPython`'s own opcode `case`s (the authority;
an empirical sweep is easy to contaminate — see the note at the end). A verb
that has no case falls to one of TWO silent stubs, so "it ran" is not "it drove
the part":

- `pass  # <opcode>` — a device verb with no MicroPython branch (motor, servo,
  the 74HC595, …); the block is dropped to a no-op that names the opcode.
- `degrade("… not emitted yet")` returning `0` — the analog-read path on the
  Pico: `read <pin>` for an ANALOG pin needs `machine.ADC`, "not emitted yet".

The device-part cases that exist (Pico/rp2040): `stc12_setpin`,
`stc12_writepin`, `stc12_toggle`, `stc12_setpwm`, `stc12_settone`,
`stc12_print`, `devices_oledclear|cursor|hline|pixel|print|show`, and the
`stc12_keypad` reporter. Nothing else.

| part / verb | C (generateC) | MicroPython (Pico) |
|---|---|---|
| pin (LED, relay-as-GPIO, button) | ✓ | ✓ |
| pwm (dimmer) | ✓ | ✓ |
| tone (buzzer / piezo) | ✓ | ✓ |
| oled (SSD1306) | ✓ | ✓ |
| print (text out) | ✓ | ✓ |
| keypad (4×4) | ✓ | ✓ (reporter) |
| **adc / analog read** | ✓ | ✗ `degrade` → 0 (needs `machine.ADC`) |
| **servo** | ✓ | ✗ `pass # devices_setservo` |
| **motor (L293D)** | ✓ | ✗ `pass # devices_setmotor` |
| **shiftOut (74HC595)** | ✓ | ✗ `pass # stc12_setpart` |
| **relay** (as a named part) | ✓ | ✗ (no case) |
| **neopixel (WS2812)** | ✓ | ✗ (no case) |
| **lcd (HD44780 / char_lcd)** | ✓ | ✗ (no case; only OLED has a display driver) |
| **tft (ILI9341)** | ✓ | ✗ (no case) |
| **seven-segment / MAX7219** | ✓ | ✗ (no case) |
| **led matrix (8×8) / ledbank / bargraph / cube** | ✓ | ✗ (no case) |
| **sensor / ultrasonic** | ✓ | ✗ (no case) |

So MicroPython drives the GPIO-shaped parts (pin, pwm, tone, keypad) plus the
one framebuffer display (oled); the **protocol** parts — the ones P2 just split
in C (shiftOut, motor, servo) and the bused displays (lcd, tft, sevenseg,
neopixel, matrix) — are **C-only**. Those are P3's targets, and the same
protocol/bus shape applies: the 74HC595 sequence, the L293D H-bridge, the
HD44780 nibble dance are the same over MicroPython's `machine.Pin`/`SPI`/`I2C`
as over C's port writes.

(micro:bit, a separate MicroPython target, has more via `microbitplus_*` —
servo, analog write, matrix — but that is the nRF, not the Pico device-part
path P3 differentials against.)

## The `text_line_0` assert kind

The example-corpus assert harness (`test/assert-physics.test.mjs`) parses
`display: <kind>` and `interface: i2c|spi|parallel`, but has **no handler for
display TEXT content** — a `text_line_0:`/`text_row_0:` line falls through to the
`unknown` kind and is SKIPPED. Measured across `examples/*/EXPECTED.md`:

**4 text assertions, in 3 programs, currently skipped:**

| example | assertions |
|---|---|
| `disp-oled` (SSD1306) | `text_line_0: OLED DEMO`, `text_line_2: Brickwright` |
| `disp-mono-lcd` (SSD1306) | `text_line_0: MONO LCD` |
| `disp-lcd` (HD44780) | `text_row_0: LCD DEMO` |

A `text_line_0` assert kind (read the rendered glyph rows off the simulated
display, match the expected string) unblocks all four and, more to the point,
gives the P3 differential its display oracle: the same program's C and
MicroPython drivers must render the same text on the same simulated screen.

## Recommended first part

The **pin path** — it is the only P3 candidate whose C AND MicroPython drivers
both already exist, so the differential harness (run C, run MicroPython, compare
GPIO state) can be built and proven on it BEFORE any new driver is written, then
reused unchanged as each C-only part gains its MicroPython driver. Order after
that by the P2 finding: the protocol parts first (shiftOut, motor, servo — their
C protocol/bus split is the template), then the bused displays (lcd, sevenseg,
neopixel), whose `text_line_0` oracle is the one measured above.

## Note — measure this from the source, not a quick harness

Deriving MicroPython coverage by generating a program per part and grepping the
output is contamination-prone: a wrong PART declaration is silently "Ignoring
line not associated with a script", so the part never declares and its verb
degrades to a bare `pass` or a variable assignment that a naive grep reads as
"driver present". And the two stub mechanisms (`pass # <opcode>` and
`degrade`/return-0) need BOTH be checked. The `case` list in
`generateMicroPython` is the authority; the table above is read from it and
spot-checked with valid programs (pin/pwm/tone/oled emit real drivers;
servo/motor/shiftOut emit `pass # <opcode>`; analog read degrades to 0).
