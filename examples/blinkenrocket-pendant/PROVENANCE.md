# Blinkenrocket example provenance and licence boundary

This example does **not** contain or bundle the GPL-licensed Blinkenrocket
firmware, its source, or a compiled image. `program.bw` is a small original
BSD-3-Clause heartbeat program authored in this repository. It demonstrates
matrix scanning but is not a reimplementation of the complete badge firmware.

The circuit describes public hardware interfaces: the ATtiny88 package and
pinout follow Microchip's ATtiny48/88 datasheet, while the QFN/TQFP package,
matrix, buttons, AT24C64 EEPROM, and PA0/ADC6 modem connection follow the
permissively licensed Blinkenrocket hardware repository. The audio encoder used
by `bw-board` was adapted from the MIT-licensed `webedit-react` project and is
identified in that package's source and notices.

The upstream GPL firmware is useful as an external compatibility oracle and a
user may load a firmware HEX they are entitled to use through the existing
firmware picker. It is deliberately never copied into this repository, npm
packages, example assets, or application build. This work should therefore be
described as independently authored application code with a strict artefact
boundary, not as a formally supervised “clean-room” rewrite.

Sources:

- Microchip ATtiny48/88 datasheet: https://www.microchip.com/en-us/product/attiny88
- Blinkenrocket hardware (MIT): https://github.com/blinkenrocket/hardware
- Blinkenrocket editor/modem encoder (MIT): https://github.com/blinkenrocket/webedit-react
- Blinkenrocket firmware (GPL-3.0; external, not bundled): https://github.com/blinkenrocket/firmware
