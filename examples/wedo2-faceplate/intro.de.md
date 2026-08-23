# WeDo 2.0-Faceplate

Der WeDo 2.0-Hub hat kein Display — nur eine farbige Status-LED. Dieses
Faceplate zeigt die RGB-LED, zwei Neigungsregler (fuer den eingebauten
Neigungssensor) und Umschalttasten fuer die Motoren A und B.

## Probiere das
1. Klicke **Im Simulator ausfuehren** — die LED startet gruen (Leerlauf).
2. Ziehe den Neigungs-X-Regler ueber 15 — die LED wird blau.
3. Ziehe den Neigungs-Y-Regler ueber 15 — die LED wird rot.
4. Schalte Motor A ein — die LED wird gelb.
5. Zentriere beide Regler und schalte Motoren aus — wieder gruen.

## Was passiert hier
Das **rgb_light**-Widget liest die Variable `hub_led` (eine 24-Bit-
0xRRGGBB-Zahl) und zeigt einen farbigen Kreis. Das Programm bildet
Neigungswinkel und Motorstatus auf Farben ab — die gleiche
Rueckmeldeschleife wie der `setLED`-Block der WeDo 2.0-Erweiterung.
Die Neigungsregler sind INPUT-Widgets, die den Beschleunigungsmesser
des Hubs simulieren.
