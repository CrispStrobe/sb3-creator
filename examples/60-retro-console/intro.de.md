---
level: advanced
age: 14+
teaches: [multiplexing, matrix-scan, seven-segment, transistor-driver, buttons]
---
## Die Konsole vom Schreibtisch, auf deiner Werkbank

Das ist die Retro-Konsole aus dem RBS15667-Lötbausatz, nachgebaut als
Schaltung zum Anfassen: ein STC15F2K60S2 treibt zwei 8×8-LED-Matrizen
als ein 16×8-Spielfeld, drei 7-Segment-Ziffern, fünf Tasten und einen
Summer — und der lehrreiche Kniff ist, dass **alle drei Anzeigen sich
einen 8-Leitungs-Scanbus teilen**. Die Matrizen nutzen ihn als
Zeilen, die Ziffern dieselben Drähte als Segmente. Eine
Multiplex-Schleife, drei Anzeigen.

Die Firmware hier ist ein Selbsttest: ein Balken wandert über das
Spielfeld, eine 8 läuft über die Ziffern, und jede gehaltene Taste
lässt den Summer ertönen (der PNP schaltet high-side — der Pin geht
auf LOW zum Piepen). Wer den echten Bausatz besitzt: genau dieses
Programm passt auf den gesockelten Chip, `make PART=stc15f2k60s2
flash` ist die ganze Zeremonie.
