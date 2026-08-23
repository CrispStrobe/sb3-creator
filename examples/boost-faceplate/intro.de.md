# Boost-Faceplate

Der Boost Move Hub hat kein Display — nur eine RGB-Status-LED und zwei
eingebaute Motoren. Dieses Faceplate bietet einen Leistungsregler,
einen Start/Stopp-Umschalter und einen Vorwaerts/Rueckwaerts-Umschalter;
die LED-Farbe spiegelt den Motorstatus wider.

## Probiere das
1. Klicke **Im Simulator ausfuehren** — die LED startet gruen (Leerlauf).
2. Stelle den Leistungsregler auf 75 und schalte **GO** ein — die LED
   wird blau (vorwaerts).
3. Schalte **FWD/REV** um — die LED wird rot (rueckwaerts).
4. Schalte **GO** aus — die LED wird wieder gruen.

## Was passiert hier
Das **rgb_light**-Widget liest `hub_led` (24-Bit 0xRRGGBB). Das
Programm bildet den Motorstatus auf Farben ab: gruen=Leerlauf,
blau=vorwaerts, rot=rueckwaerts, mit Helligkeitsskalierung nach
Leistung. Dies entspricht den `motorOn`-, `motorPower`- und
`motorDirection`-Bloecken der Boost-Erweiterung.
