---
level: advanced
age: 12+
teaches: [game-loop, cooperative-scheduling, multiplexing, state-machines]
prereqs: [60-retro-console]
---
## Same console, different cartridge

This is the exact hardware of the retro-console bench — nothing
rewired — running a different program: ball and paddle. That is the
whole point of a console with a socketed chip: **the game is just
firmware.**

Two scripts share the machine. One owns the scan bus and does nothing
but paint: sixteen matrix lines and the score digit, over the same
eight wires. The other owns the game: ball position, direction,
paddle, score — five numbers. They never fight over a pin, because
state is the only thing they share. Buttons S2/S3 move the paddle;
missing the ball costs you the score and a long beep.

Own the real kit? `make PART=stc15f2k60s2 flash` puts this exact game
on it.
