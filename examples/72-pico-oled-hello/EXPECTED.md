# Expected behaviour

Verified headless (2026-08-17): dialect → generateC (ARM) →
arm-none-eabi-gcc (raw SRAM bin, ~1.6 KB) → rp2040js on the example
board — the SSD1306 framebuffer carries the text after boot.

The I²C pins resolve to lvalue views of SIO GPIO_OUT (RMW is
architecturally fine on the RP2040; SET/CLR are atomic conveniences),
and the general pin init emits funcsel=SIO + OE for the declared
OUTPUT pins.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
