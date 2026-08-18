# Assert-Physics Coverage Report

Generated: 2026-08-18

## Summary

| Metric | Count |
|--------|-------|
| Total examples | 243 |
| With assert blocks | 235 |
| Without assert blocks | 8 |
| Individual assertions passing | 237 |
| Individual assertions skipped | 80 |
| Individual assertions failing | 0 |

## Per-Example Coverage

| Example | Kind | Asserts? | Status | Skip reason |
|---------|------|----------|--------|-------------|
| 01-blink | program | yes | pass (1/1) |  |
| 02-dimmer | program | yes | pass (1/1) |  |
| 03-night-light | program | yes | pass (1/1) |  |
| 04-thermostat | program | yes | pass (1/1) |  |
| 05-counter | program | yes | pass (2/2) |  |
| 06-active-low-high | program | yes | pass (1/1) |  |
| 07-buzzer-siren | program | yes | skip (0/4) | unknown assertion: buzzer_tone_hz_phase1: 440 ± 5% # SKIP unknown assertion kind: "buzzer_tone_hz_phase1: 440 ± 5%" |
| 08-led-chaser-595 | program | yes | pass (1/1) |  |
| 09-relay-clicker | program | yes | pass (1/1) |  |
| 10-motor-speed | program | yes | pass (1/1) |  |
| 11-toggle-button | program | yes | pass (1/1) |  |
| 12-dual-blink | program | yes | pass (1/1) |  |
| 13-sos-morse | program | yes | pass (1/1) |  |
| 14-traffic-light | program | yes | pass (1/1) |  |
| 15-voltage-divider | program | yes | pass (1/1) |  |
| 16-ldr-bargraph | program | yes | pass (2/2) |  |
| 168p01-blink | program | no | - | no assert block |
| 17-comparator | program | yes | pass (2/2) |  |
| 18-logic-and-gate | program | yes | pass (2/2) |  |
| 19-logic-or-gate | program | yes | pass (1/1) |  |
| 20-shift-register-binary | program | yes | pass (1/1) |  |
| 21-resistor-led | circuit | yes | pass (1/1) |  |
| 22-series-parallel | circuit | yes | pass (2/2) |  |
| 23-voltage-regulator | circuit | yes | pass (1/1) |  |
| 24-pwm-fade | program | yes | pass (1/1) |  |
| 25-reaction-timer | program | yes | pass (1/1) |  |
| 26-debounce | program | yes | pass (1/1) |  |
| 27-led-dice | program | yes | pass (2/2) |  |
| 28-diode-polarity | circuit | yes | pass (2/2) |  |
| 29-capacitor-charge | circuit | yes | pass (1/1) |  |
| 30-multi-led-pattern | program | yes | pass (1/1) |  |
| 31-no-resistor-led | circuit | yes | pass (1/1) |  |
| 32-source-vs-sink | program | yes | pass (1/1) |  |
| 33-inductive-no-flyback | circuit | yes | pass (1/1) |  |
| 34-ohms-law | circuit | yes | pass (1/1) |  |
| 35-series-resistors | circuit | yes | pass (1/1) |  |
| 36-parallel-leds | circuit | yes | pass (1/1) |  |
| 37-voltage-divider-basic | circuit | yes | pass (1/1) |  |
| 38-npn-switch | circuit | yes | pass (2/2) |  |
| 39-zener-clamp | circuit | yes | pass (1/1) |  |
| 40-led-color-mix | circuit | yes | pass (2/2) |  |
| 41-pot-as-dimmer | circuit | yes | pass (2/2) |  |
| 42-diode-rectifier | circuit | yes | pass (1/1) |  |
| 43-rc-timing | circuit | yes | pass (1/1) |  |
| 44-darlington-motor | circuit | yes | pass (1/1) |  |
| 45-led-current-comparison | circuit | yes | pass (2/2) |  |
| 46-port-overcurrent | program | yes | pass (1/1) |  |
| 47-battery-led | circuit | yes | pass (1/1) |  |
| 48-breadboard-basics | circuit | yes | pass (1/1) |  |
| 49-function-generator-sine | circuit | yes | pass (1/1) |  |
| 49-lcd-hello | program | yes | skip (0/1) | circuit 49-lcd-hello not solvable: no circuit file |
| 50-7seg-chase | program | yes | pass (1/1) |  |
| 50-rc-scope | circuit | yes | pass (1/1) |  |
| 51-555-astable | circuit | yes | skip (0/1) | circuit 51-555-astable not solvable: no circuit file |
| 51-tft-pixels | full | yes | skip (0/1) | circuit 51-tft-pixels not solvable: no circuit file |
| 52-battery-voltage-divider | circuit | yes | pass (2/2) |  |
| 53-servo-sweep | program | yes | pass (1/1) |  |
| 54-motor-driver | program | yes | pass (1/1) |  |
| 55-oled-hello | program | yes | skip (0/1) | circuit 55-oled-hello not solvable: no circuit file |
| 60-retro-console | full | yes | skip (0/1) | circuit 60-retro-console not solvable: no circuit file |
| 61-console-pong | full | yes | skip (0/1) | circuit 61-console-pong not solvable: no circuit file |
| 70-calculator | full | yes | skip (0/1) | circuit 70-calculator not solvable: no circuit file |
| 72-pico-oled-hello | full | yes | skip (0/1) | circuit 72-pico-oled-hello not solvable: no circuit file |
| 73-voltmeter | full | yes | skip (0/2) | circuit 73-voltmeter not solvable: no circuit file |
| 74-ammeter | full | yes | skip (0/1) | circuit 74-ammeter not solvable: no circuit file |
| 75-battery-tester | full | yes | skip (0/1) | circuit 75-battery-tester not solvable: no circuit file |
| 76-multimeter | full | yes | skip (0/2) | circuit 76-multimeter not solvable: no circuit file |
| arduino-01-analog-read-serial | full | yes | pass (2/2) |  |
| arduino-01-blink | full | yes | pass (1/1) |  |
| arduino-01-digital-read-serial | full | yes | pass (1/1) |  |
| arduino-01-fade | full | yes | pass (1/1) |  |
| arduino-01-read-analog-voltage | full | yes | pass (2/2) |  |
| arduino-02-blink-without-delay | full | yes | pass (1/1) |  |
| arduino-02-button | full | yes | pass (1/1) |  |
| arduino-02-debounce | full | yes | pass (1/1) |  |
| arduino-02-digital-input-pullup | full | yes | pass (1/1) |  |
| arduino-02-state-change | full | yes | pass (1/1) |  |
| arduino-02-tone-keyboard | full | yes | pass (3/3) |  |
| arduino-02-tone-melody | full | yes | pass (1/1) |  |
| arduino-02-tone-multiple | full | yes | pass (1/1) |  |
| arduino-02-tone-pitch-follower | full | yes | pass (1/1) |  |
| arduino-03-analog-in-out-serial | full | yes | pass (2/2) |  |
| arduino-03-analog-input | full | yes | pass (2/2) |  |
| arduino-03-analog-write-mega | full | yes | pass (1/1) |  |
| arduino-03-calibration | full | yes | pass (2/2) |  |
| arduino-03-fading | full | yes | pass (1/1) |  |
| arduino-03-smoothing | full | yes | pass (2/2) |  |
| arduino-04-ascii-table | full | yes | pass (1/1) |  |
| arduino-04-dimmer | full | yes | pass (2/2) |  |
| arduino-04-read-ascii-string | full | yes | pass (4/4) |  |
| arduino-04-serial-call-response | full | yes | pass (3/3) |  |
| arduino-04-serial-passthrough | full | yes | pass (2/2) |  |
| arduino-05-arrays | full | yes | pass (1/1) |  |
| arduino-05-for-loop | full | yes | pass (1/1) |  |
| arduino-05-if-statement | full | yes | pass (2/2) |  |
| arduino-05-switch-case | full | yes | pass (1/1) |  |
| arduino-05-switch-case-2 | full | yes | pass (1/1) |  |
| arduino-05-while-statement | full | yes | pass (1/1) |  |
| arduino-06-knock | full | yes | skip (0/1) | circuit arduino-06-knock not solvable: no circuit file |
| arduino-06-ping | full | yes | skip (0/1) | circuit arduino-06-ping not solvable: no circuit file |
| arduino-07-bar-graph | full | yes | pass (2/2) |  |
| arduino-07-row-column-scanning | full | yes | pass (3/3) |  |
| arduino-08-char-analysis | full | yes | pass (1/1) |  |
| arduino-08-string-addition | full | yes | pass (2/2) |  |
| arduino-08-string-append | full | yes | pass (1/1) |  |
| arduino-08-string-case | full | yes | pass (1/1) |  |
| arduino-08-string-chars | full | yes | pass (1/1) |  |
| arduino-08-string-compare | full | yes | pass (1/1) |  |
| arduino-08-string-constructors | full | yes | pass (1/1) |  |
| arduino-08-string-indexof | full | yes | pass (1/1) |  |
| arduino-08-string-length | full | yes | pass (1/1) |  |
| arduino-08-string-length-trim | full | yes | pass (1/1) |  |
| arduino-08-string-replace | full | yes | pass (1/1) |  |
| arduino-08-string-startswith | full | yes | pass (1/1) |  |
| arduino-08-string-substring | full | yes | pass (1/1) |  |
| arduino-08-string-toint | full | yes | pass (1/1) |  |
| arduino-sk-p02-spaceship | full | yes | pass (1/1) |  |
| arduino-sk-p03-love-o-meter | full | yes | pass (2/2) |  |
| arduino-sk-p04-color-mixing | full | yes | pass (2/2) |  |
| arduino-sk-p05-servo-mood | full | yes | pass (2/2) |  |
| arduino-sk-p06-light-theremin | full | yes | pass (2/2) |  |
| arduino-sk-p07-keyboard | full | yes | pass (1/1) |  |
| arduino-sk-p08-hourglass | full | yes | pass (1/1) |  |
| arduino-sk-p09-motorized-pinwheel | full | yes | pass (1/1) |  |
| arduino-sk-p10-zoetrope | full | yes | pass (1/1) |  |
| arduino-sk-p11-crystal-ball | full | yes | pass (1/1) |  |
| arduino-sk-p12-knock-lock | full | yes | pass (1/1) |  |
| arduino-sk-p13-touch-lamp | full | yes | pass (1/1) |  |
| arduino-sk-p14-serial-pot | full | yes | pass (1/1) |  |
| arduino-sk-p15-hacking-buttons | full | no | - | no assert block |
| avr01-blink | program | no | - | no assert block |
| avr02-dimmer | program | yes | pass (2/2) |  |
| avr03-dual-blink | program | no | - | no assert block |
| avr04-serial-pot | program | yes | pass (2/2) |  |
| avr05-button-led | program | yes | pass (1/1) |  |
| avr06-blink-and-print | program | yes | pass (2/2) |  |
| blinkenrocket-pendant | full | yes | skip (0/1) | circuit blinkenrocket-pendant not solvable: no circuit file |
| eater6502-bench | full | yes | skip (0/1) | circuit eater6502-bench not solvable: no circuit file |
| eater6502-blink | full | yes | skip (0/1) | circuit eater6502-blink not solvable: no circuit file |
| eater6502-contention-bug | circuit | yes | skip (0/1) | circuit eater6502-contention-bug not solvable: no circuit file |
| eater6502-full-build | full | yes | skip (0/2) | circuit eater6502-full-build not solvable: no circuit file |
| eater6502-vdp-hello | full | yes | skip (0/1) | circuit eater6502-vdp-hello not solvable: no circuit file |
| mega01-blink | program | no | - | no assert block |
| mega02-adc-print | program | yes | pass (2/2) |  |
| mega03-port-current | program | no | - | no assert block |
| nano01-blink | program | no | - | no assert block |
| nano02-pot-print | program | yes | pass (2/2) |  |
| nano03-two-tasks | program | yes | pass (2/2) |  |
| pc01-led-resistor | circuit | yes | pass (1/1) |  |
| pc02-voltage-divider | circuit | yes | pass (1/1) |  |
| pc03-series-resistors | circuit | yes | pass (2/2) |  |
| pc04-parallel-leds | circuit | yes | pass (1/1) |  |
| pc05-npn-switch | circuit | yes | skip (0/3) | circuit pc05-npn-switch not solvable: no circuit file |
| pc06-rc-charge | circuit | yes | skip (0/1) | circuit pc06-rc-charge not solvable: no circuit file |
| pc07-pot-dimmer | circuit | yes | pass (1/1) |  |
| pc08-diode-polarity | circuit | yes | skip (0/1) | circuit pc08-diode-polarity not solvable: no circuit file |
| pc09-direct-led | circuit | yes | pass (1/1) |  |
| pc10-direct-series | circuit | yes | pass (1/1) |  |
| pc11-direct-parallel | circuit | yes | pass (1/1) |  |
| pc12-direct-divider | circuit | yes | pass (1/1) |  |
| pc13-direct-diode | circuit | yes | pass (2/2) |  |
| pc14-mini-led | circuit | yes | pass (1/1) |  |
| pc15-mini-npn | circuit | yes | pass (2/2) |  |
| pc16-mini-rc | circuit | yes | pass (1/1) |  |
| pc17-current-compare | circuit | yes | pass (1/1) |  |
| pc18-zener-clamp | circuit | yes | pass (1/1) |  |
| pc19-buzzer-direct | circuit | yes | pass (2/2) |  |
| pc20-rgb-mix | circuit | yes | pass (1/1) |  |
| pc21-rc-smoothing | circuit | yes | pass (1/1) |  |
| pc22-diode-selector | circuit | yes | pass (2/2) |  |
| pc23-transistor-switch | circuit | yes | pass (1/1) |  |
| pc24-light-gate | circuit | yes | pass (2/2) |  |
| pc25-relay-isolator | circuit | yes | pass (1/1) |  |
| pc26-motor-clamp | circuit | yes | pass (1/1) |  |
| pc27-timer-pulse | circuit | yes | skip (0/1) | circuit pc27-timer-pulse not solvable: no circuit file |
| pc28-logic-interlock | circuit | yes | skip (0/1) | circuit pc28-logic-interlock not solvable: no circuit file |
| pc29-capacitor-discharge | circuit | yes | pass (1/1) |  |
| pc30-resistor-ladder | circuit | yes | pass (2/2) |  |
| pc31-bridge-rectifier | circuit | yes | pass (1/1) |  |
| pc32-pnp-high-side | circuit | yes | pass (2/2) |  |
| pc33-thermistor-divider | circuit | yes | pass (2/2) |  |
| pc34-polarity-protector | circuit | yes | pass (1/1) |  |
| pc35-capacitor-bypass | circuit | yes | pass (1/1) |  |
| pc36-series-interlock | circuit | yes | pass (1/1) |  |
| pc37-selectable-reference | circuit | yes | pass (2/2) |  |
| pc38-relay-changeover | circuit | yes | pass (1/1) |  |
| pc39-nmos-switch | circuit | yes | pass (1/1) |  |
| pc40-opamp-threshold | circuit | yes | pass (1/1) |  |
| pc41-zener-reference | circuit | yes | pass (1/1) |  |
| pc42-parallel-paths | circuit | yes | pass (1/1) |  |
| pc43-bleeder-discharge | circuit | yes | pass (1/1) |  |
| pc44-push-pull-led | circuit | yes | pass (1/1) |  |
| pc45-nand-test | circuit | yes | skip (0/1) | circuit pc45-nand-test not solvable: no circuit file |
| pc46-xor-selector | circuit | yes | skip (0/1) | circuit pc46-xor-selector not solvable: no circuit file |
| pc47-555-monostable | circuit | yes | skip (0/4) | unknown assertion: pulse_duration_ms: 1100 ± 15% # SKIP unknown assertion kind: "pulse_duration_ms: 1100 ± 15%" |
| pc48-ldr-comparator | circuit | yes | pass (1/1) |  |
| pc49-diode-clamp | circuit | yes | pass (1/1) |  |
| pc50-two-stage-rc | circuit | yes | pass (1/1) |  |
| pc51-series-capacitors | circuit | yes | pass (1/1) |  |
| pc52-inductor-filter | circuit | yes | pass (1/1) |  |
| pc53-buzzer-switch | circuit | yes | pass (1/1) |  |
| pc54-opamp-follower | circuit | yes | pass (2/2) |  |
| pc55-ntc-indicator | circuit | yes | pass (1/1) |  |
| pc56-inductor-freewheel | circuit | yes | pass (1/1) |  |
| pc57-inverter-lamp | circuit | yes | skip (0/1) | circuit pc57-inverter-lamp not solvable: no circuit file |
| pc58-555-audio-pulse | circuit | yes | skip (0/2) | unknown assertion: buzzer_tone_hz: 4.8 ± 15% # SKIP unknown assertion kind: "buzzer_tone_hz: 4.8 ± 15%" |
| pc59-nor-memory | circuit | yes | skip (0/1) | circuit pc59-nor-memory not solvable: no circuit file |
| pc60-night-lamp-hardware | circuit | yes | pass (2/2) |  |
| pc61-diode-or | circuit | yes | pass (1/1) |  |
| pc62-motor-indicator | circuit | yes | pass (1/1) |  |
| pc63-555-bistabil | circuit | yes | skip (0/1) | circuit pc63-555-bistabil not solvable: no circuit file |
| pc64-555-retrigger | circuit | yes | skip (0/3) | unknown assertion: pulse_duration_ms: 1100 ± 15% # SKIP unknown assertion kind: "pulse_duration_ms: 1100 ± 15%" |
| pc65-555-metronom | circuit | yes | skip (0/1) | circuit pc65-555-metronom not solvable: no circuit file |
| pc66-555-langzeit | circuit | yes | skip (0/3) | unknown assertion: pulse_duration_ms: 110000 ± 15% # SKIP unknown assertion kind: "pulse_duration_ms: 110000 ± 15%" |
| pc67-555-tongenerator | circuit | yes | skip (0/3) | unknown assertion: buzzer_tone_hz: 685.7 ± 15% # SKIP unknown assertion kind: "buzzer_tone_hz: 685.7 ± 15%" |
| pc68-555-sirene | circuit | yes | skip (0/4) | unknown assertion: buzzer_tone_hz_min: 151.6 # SKIP unknown assertion kind: "buzzer_tone_hz_min: 151.6" |
| pc69-nand-inverter | circuit | yes | skip (0/1) | circuit pc69-nand-inverter not solvable: no circuit file |
| pc70-schmitt-trigger | circuit | yes | skip (0/1) | circuit pc70-schmitt-trigger not solvable: no circuit file |
| pc71-nand-entpreller | circuit | yes | skip (0/1) | circuit pc71-nand-entpreller not solvable: no circuit file |
| pc72-tagschaltung | circuit | yes | pass (1/1) |  |
| pc73-nachtschaltung | circuit | yes | pass (1/1) |  |
| pc74-ldr-555-blinker | circuit | yes | skip (0/1) | circuit pc74-ldr-555-blinker not solvable: no circuit file |
| pc75-alarmgeber | circuit | yes | skip (0/4) | unknown assertion: buzzer_tone_hz: 685.7 ± 15% # SKIP unknown assertion kind: "buzzer_tone_hz: 685.7 ± 15%" |
| pc76-alarmschaltung | circuit | yes | skip (0/1) | circuit pc76-alarmschaltung not solvable: no circuit file |
| pc77-klemmenspannung | circuit | yes | pass (1/1) |  |
| pc78-belastete-quelle | circuit | yes | pass (1/1) |  |
| pc79-indirekte-strommessung | circuit | yes | pass (1/1) |  |
| pc80-quellen-vergleich | circuit | yes | pass (2/2) |  |
| pc81-led-lauflicht | circuit | yes | skip (0/1) | circuit pc81-led-lauflicht not solvable: no circuit file |
| pc82-mini-roulette | circuit | yes | skip (0/1) | circuit pc82-mini-roulette not solvable: no circuit file |
| pc83-gluecksrad | circuit | yes | skip (0/1) | circuit pc83-gluecksrad not solvable: no circuit file |
| pc84-led-herz | circuit | yes | skip (0/1) | circuit pc84-led-herz not solvable: no circuit file |
| pc85-led-lampe-puls | circuit | yes | skip (0/1) | circuit pc85-led-lampe-puls not solvable: no circuit file |
| pc86-led-sanduhr | circuit | yes | skip (0/1) | circuit pc86-led-sanduhr not solvable: no circuit file |
| pc87-stroboskop | circuit | yes | skip (0/2) | unknown assertion: buzzer_tone_hz: 7.16 ± 15% # SKIP unknown assertion kind: "buzzer_tone_hz: 7.16 ± 15%" |
| pc88-lichtorgel | circuit | yes | skip (0/1) | circuit pc88-lichtorgel not solvable: no circuit file |
| pico01-blink | program | no | - | no assert block |
| pico02-pot-print | program | yes | pass (2/2) |  |
| pico03-two-tasks | program | yes | pass (2/2) |  |
| pico04-button | program | yes | pass (1/1) |  |
| ttl-clock-module | circuit | yes | skip (0/1) | circuit ttl-clock-module not solvable: no circuit file |
| z80-bench | circuit | yes | skip (0/1) | circuit z80-bench not solvable: no circuit file |
| z80-pd-bench | circuit | yes | skip (0/1) | circuit z80-pd-bench not solvable: no circuit file |

## Uncovered Examples (no assert block) — 8 remaining, all structurally unsolvable

Each of these circuits has no explicit VCC/battery part wired into the
netlist. The MCU provides implicit power but does not expose its internal
VCC rail as a solvable terminal (`mcu1.VCC`, `mcu1.vcc`, `mcu1.5v` all
tested — none found by the solver). LED nodes are MCU-driven and require
firmware simulation to determine voltage, which the DC solver cannot do.

- **168p01-blink** (program): ATmega168P + 220Ω + LED. MCU drives D13; no VCC part, no passive divider.
- **avr01-blink** (program): ATmega328P + 220Ω + LED. Same topology as 168p01.
- **avr03-dual-blink** (program): ATmega328P + 2×(220Ω + LED). Two MCU-driven LEDs, no VCC part.
- **mega01-blink** (program): ATmega2560 + 220Ω + LED. Same topology, Mega variant.
- **mega03-port-current** (program): ATmega2560 + 8×(220Ω + LED). Eight MCU-driven LEDs, no VCC part.
- **nano01-blink** (program): ATmega328P Nano + 220Ω + LED. Same topology, Nano variant.
- **pico01-blink** (program): RP2040 Pico only, no external wires at all. Uses on-board GP25 LED.
- **arduino-sk-p15-hacking-buttons** (full): Arduino Uno + 220Ω + LED. Has VCC part but no wires from it; power delivered only via breadboard rail generation, which the solver cannot trace.
