# EV3-Faceplate

Der EV3-Mindstorms-Baustein hat ein monochromes 178×128-LCD. Dieses
Faceplate stellt das Display und drei Navigationstasten (Hoch, Runter,
OK) im Controller-Panel dar — kein echter Baustein noetig.

## Probiere das
1. Klicke **Im Simulator ausfuehren** — das Display zeigt "EV3 Ready".
2. Druecke **▼** zum Blaettern: Motor Status, Sensor Data.
3. Druecke **▲** zum Zurueckgehen.
4. Druecke **OK** zur Auswahl der aktuellen Seite.

## Was passiert hier
Das **mono_lcd**-Widget stellt einen 178×128-Pixelpuffer aus der
Variable `ev3_display` dar. Das Programm wechselt bei Tastendruck
zwischen Seiten und schreibt den Displayinhalt. Dies entspricht den
Display-Bloecken der EV3-Comprehensive-Erweiterung — die gleiche API,
die auf dem echten Baustein Text und Formen zeichnet.
