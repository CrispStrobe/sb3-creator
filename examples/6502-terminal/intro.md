# 6502 Serial Terminal

A serial terminal faceplate — type on the keyboard widget, see the
output on the scrolling terminal display. Inspired by the 6502 + ACIA
6551 serial interface: the classic "type a character, see it echoed"
loop that every 6502 system starts with.

## Try this
1. Click **Run on Simulator** — the terminal shows "6502 Terminal Ready".
2. Type characters in the keyboard input — they echo on the terminal.
3. Type `hello` and press Enter — the terminal responds "Hello, world!".
4. Type `help` for a list of commands.
5. Type `clear` to reset the screen.

## What is going on
The **keyboard** widget is an INPUT: each typed character writes to the
`serial_in` Scratch variable. The program reads `serial_in`, echoes it
to `serial_out`, and accumulates a line buffer. On Enter, it processes
the line as a command. The **terminal** widget is a DISPLAY: it reads
`serial_out` and renders the last 8 lines as green-on-black monospace
text — a scrolling serial console.
