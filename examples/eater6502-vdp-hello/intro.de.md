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
2. Aendere die Nachricht mit den vier geladenen Buchstaben oder lade Muster fuer weitere Zeichen.
3. Versuche, an verschiedene Bildschirmpositionen zu schreiben, indem du die Namentabellenadresse des VDP aenderst.

## Was passiert hier
Der TMS9918A hat eigene 16 KB Video-RAM und erzeugt ein Videosignal unabhaengig von der CPU. Der 6502 kommuniziert mit ihm ueber zwei I/O-Ports: einen fuer Daten, einen fuer Befehle. Um Text anzuzeigen, richtet die CPU die Register des VDP ein (Bildschirmmodus, Farben, Speicheraufteilung) laedt die Pixelmuster der Buchstaben und schreibt dann die Zeichencodes in die Namentabelle. Der VDP rendert die Muster mit 60 Hz. Die CPU muss die Daten nur einmal schreiben — der VDP aktualisiert den Bildschirm selbststaendig.

## Warum das wichtig ist
So haben Heimcomputer der 1980er Jahre Grafik dargestellt. Der VDP lagert die gesamte Videoerzeugung von der CPU aus, was essenziell ist, wenn die CPU langsam ist. Diese Arbeitsteilung zu verstehen — CPU fuer Logik, dedizierter Chip fuer die Anzeige — ist dasselbe Prinzip hinter modernen GPUs. Retro-Computing macht es in menschlich lesbarem Massstab sichtbar.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — der 6502-Basiscomputer ohne Video.
- [z80-bench](../z80-bench) — eine andere Retro-CPU, die historisch ebenfalls mit dem TMS9918 gepaart wurde.
- Experiment: Schalte den VDP in den Graphics-II-Modus und versuche, farbige Kacheln statt Text zu zeichnen — so haben Spiele auf MSX und ColecoVision ihre Sprites und Hintergruende gerendert.
