# Dampflok: Rauschen an und aus

Das Rauschen eines durchgebrochenen Übergangs, aber der Übergang wird von einer Seite einer langsamen Blinkschaltung gespeist. Ein paar Mal pro Sekunde wird die Rauschquelle ein- und ausgeschaltet, und der Ohrhörer pufft wie eine Dampflokomotive.

**Vermittelt:** ein Signal tasten, astabile Kippstufe mit zwei Transistoren, Rauschquelle

## Was zu tun ist

Klick auf **Sim** und hör hin. Beobachte den Kollektor des rechten Kippstufen-Transistors.

## Was du sehen solltest

- Die Kippstufe kippt etwa dreimal pro Sekunde.
- Solange ihr Transistor sperrt, liegt sein Kollektor bei fast 9 V, der Rauschübergang bricht durch und der Ohrhörer rauscht. Leitet er, liegt der Kollektor bei fast 0 V und der Ohrhörer schweigt: tsch … tsch … tsch.

## Warum es funktioniert

Der Kollektor der Kippstufe ist die Versorgung der Rauschquelle. Nur wenn er hoch genug ist, um den Übergang über seine Durchbruchspannung zu treiben, fließt der Lawinenstrom und mit ihm das Rauschen. Die beiden Kondensatoren und die 100-kΩ-Widerstände bestimmen den Takt: Größere Kondensatoren machen den Zug langsamer.
