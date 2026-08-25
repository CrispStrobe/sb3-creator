# Expected behaviour

Identical arithmetic to `70-calculator` — same program, same display, same
keys. The whole difference is electrical: the keys go to **GND** and the pins
are **ACTIVE LOW**, so the Pico's internal pull-ups hold them high and a press
pulls them down.

- Boot: the OLED shows `RECHNER`, a rule under it, and `0` right-aligned.
- Press `5`: display shows `5`.
- Press `+`: the upper line shows the pending `5 +`; display still `5`.
- Press `3`: display shows `3`.
- Press `EXE`: display shows `8`.
- Press `1` `2` `3` then `DEL`: display shows `12` — one digit removed.
- `AC`: everything resets — accumulator, operator, entry.
- The green LED is lit the whole time and is not under program control.

## What this example is FOR

It is the only Pico example in the gallery whose inputs are ACTIVE LOW.

Every other Pico example wires its buttons to +3V3 and leans on the internal
pull-downs; `pico04-button` even fits an external 10k pull-down. So the
MicroPython backend's `Pin(n, Pin.IN, Pin.PULL_UP)` path, and the inverted
read that goes with it, were exercised only by a unit test and never by a
program in the gallery. This example closes that.

The generated MicroPython differs from `70-calculator`'s in exactly 34 lines:

    _pin_bX = Pin(n, Pin.IN, Pin.PULL_DOWN)  ->  Pin(n, Pin.IN, Pin.PULL_UP)
    if (_pin_bX.value() > 0):                ->  if ((1 - _pin_bX.value()) > 0):

seventeen of each, and nothing else moves. That is the claim worth checking:
a wiring change of one word per pin, and the arithmetic is untouched.

## Hardware

The physical build is the **TaschenRechner3** PCB — a Raspberry Pi Pico, a
GME12864-70 OLED on GP0/GP1, seventeen 6x6 tact switches to GND, a 3xAA pack
through an SS-12D10L9 slide switch and a 1N5817 into VSYS, and a green 5 mm
LED across the Pico's 3V3 through 390R.

**NOT verified on hardware.** `70-calculator`'s arithmetic and display were
confirmed on a real Pico on 2026-08-19; this variant changes only the input
polarity and adds an indicator, and the board it is named after has not been
fabricated. The claim above about the 34-line diff IS checked, by transpiling
both programs and diffing them.

The LED is deliberately not on a GPIO: a power light that depends on firmware
goes dark when the firmware hangs, which is when you most want to know the
board still has power.
