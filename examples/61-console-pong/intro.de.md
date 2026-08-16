---
level: advanced
age: 12+
teaches: [game-loop, cooperative-scheduling, multiplexing, state-machines]
prereqs: [60-retro-console]
---
## Gleiche Konsole, andere Cartridge

Das ist exakt die Hardware der Retro-Konsolen-Werkbank — kein Draht
verändert — mit einem anderen Programm: Ball und Schläger. Genau das
ist der Witz einer Konsole mit gesockeltem Chip: **das Spiel ist nur
Firmware.**

Zwei Skripte teilen sich die Maschine. Eines besitzt den Scanbus und
tut nichts als malen: sechzehn Matrixzeilen und die Punkteziffer, über
dieselben acht Drähte. Das andere besitzt das Spiel: Ballposition,
Richtung, Schläger, Punkte — fünf Zahlen. Sie streiten nie um einen
Pin, denn geteilt wird nur der Zustand. Die Tasten S2/S3 bewegen den
Schläger; ein verpasster Ball kostet die Punkte und einen langen Piep.

Wer den echten Bausatz hat: `make PART=stc15f2k60s2 flash` spielt
genau dieses Spiel darauf.
