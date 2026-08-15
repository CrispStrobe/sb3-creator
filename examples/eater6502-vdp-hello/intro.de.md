---
level: advanced
age: 16+
prereqs: [eater6502-bench]
teaches: [vdp, video-output, retro-graphics]
---
## Was du siehst
Der 6502-Breadboard-Computer erweitert um einen TMS9918A-Videoprozessor. Der VDP erzeugt ein Videosignal, das Text oder Grafik auf einem Bildschirm zeigt — derselbe Chip, der MSX, ColecoVision und TI-99/4A Heimcomputer angetrieben hat.

## Probier das
1. Starte die Simulation und sieh "HELLO" auf dem Videodisplay erscheinen — der 6502 schreibt Zeichen in das Video-RAM des VDP.
2. Aendere den Textstring im ROM und beobachte die Aktualisierung der Anzeige.
3. Versuche, an verschiedene Bildschirmpositionen zu schreiben, indem du die Namentabellenadresse des VDP aenderst.

## Was passiert hier
Der TMS9918A hat eigene 16 KB Video-RAM und erzeugt ein Videosignal unabhaengig von der CPU. Der 6502 kommuniziert mit ihm ueber zwei I/O-Ports: einen fuer Daten, einen fuer Befehle. Um Text anzuzeigen, richtet die CPU die Register des VDP ein (Bildschirmmodus, Farben, Speicheraufteilung) und schreibt dann Zeichencodes ins Video-RAM. Der VDP rendert diese Zeichen mit 60 Hz in Pixel, unter Verwendung seines eingebauten Zeichensatzes. Die CPU muss die Daten nur einmal schreiben — der VDP aktualisiert den Bildschirm selbststaendig.

## Warum das wichtig ist
So haben Heimcomputer der 1980er Jahre Grafik dargestellt. Der VDP lagert die gesamte Videoerzeugung von der CPU aus, was essenziell ist, wenn die CPU langsam ist. Diese Arbeitsteilung zu verstehen — CPU fuer Logik, dedizierter Chip fuer die Anzeige — ist dasselbe Prinzip hinter modernen GPUs. Retro-Computing macht es in menschlich lesbarem Massstab sichtbar.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — der 6502-Basiscomputer ohne Video.
- [z80-bench](../z80-bench) — eine andere Retro-CPU, die historisch ebenfalls mit dem TMS9918 gepaart wurde.
- Experiment: Schalte den VDP in den Graphics-II-Modus und versuche, farbige Kacheln statt Text zu zeichnen — so haben Spiele auf MSX und ColecoVision ihre Sprites und Hintergruende gerendert.
