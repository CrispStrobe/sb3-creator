# guess-the-number -- expected behaviour

## Circuit

- A lamp `win`: VCC -> resistor -> LED -> P1.0 (active-low); on other boards
  the pin the retarget assigns.
- The serial line at 9600 8N1 (the board's UART TX and RX).

## Program

1. The lamp goes off. `ask "What is your name?" and wait` sends the question
   and waits for a line (CR or LF ends it; backspace edits it).
2. It prints `Hello <name>, I am thinking of a number from 1 to 100.`
3. `secret` = `pick random 1 to 100`. The generator is stirred on every poll
   while a line is awaited, so the secret depends on how long the name took
   to type.
4. Until `guess = secret`: ask `Your guess?`, take the answer as a number
   (non-numbers are 0), count the try, print `Higher!` below the secret and
   `Lower!` above it.
5. It prints `Got it in <tries> tries!` and turns the lamp on.

## Observable behaviour

| typed | printed                                                     |
|-------|-------------------------------------------------------------|
| Ada   | Hello Ada, I am thinking of a number from 1 to 100.         |
| 50    | Higher! or Lower! (or the end, if 50 was the secret)        |
| ...   | ...                                                         |
| the secret | Got it in N tries!, and the lamp lights               |

The UART is needed for ask: the ATtinys have none and refuse the program.
On the 8051 the UART's baud clock is Timer 1, so a tone cannot join in.
