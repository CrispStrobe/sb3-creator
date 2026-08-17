# 73-voltmeter — expected behaviour

## Circuit

- Potentiometer across VCC/GND; its wiper is the voltage under test.
- Wiper → MCU analog pin (A0 on the Nano authoring; the retargeted
  benches use each board's convention analog pin).
- SSD1306 OLED on the I2C pins (SDA/SCL).

## Program

Every 200 ms: read the ADC, convert to millivolts
(`mv = raw * 5000 / 1023`), print "VOLTMETER" and the mV value.

## Observable behaviour

- Pot at 0%: reading near 0 mV.
- Pot at 50%: reading near 2500 mV.
- Pot at 100%: reading near 5000 mV.
- Dragging the pot changes the displayed number within one refresh
  (≤ 200 ms). Verified headless on the Nano: framebuffer at pot 20%
  differs from pot 90% and tracks the wiper.

The arithmetic depends on the C target's `long` variables — with 16-bit
int, `raw * 5000` wraps and the reading is garbage (the 2026-08-17
multimeter session found and fixed exactly this).
