# Der A2-Sampler

Das komplette neue Block-Vokabular des Prechin A2 in einem Programm: die
4×4-Matrixtastatur (mit der vermessenen P1-Zeilen-/Spaltenbelegung), die
8-stellige 7-Segment-Anzeige hinter ihrem 74HC245/74HC138-Paar und die
8 LEDs — alles gleichzeitig.

- Drücke eine Taste: ihre Nummer (0–15) erscheint auf der Anzeige, über
  den `a key is pressed`-Reporter und den gescannten Tastenindex.
- Die LEDs laufen als Lauflicht — `light only led N`, ein Schritt alle
  120 ms.
- `*` (Taste 12) setzt die Anzeige auf 0 zurück — ein
  `WHEN key 12 pressed:`-Flankenereignis, das der entprellte gemeinsame
  Scan genau einmal pro Druck auslöst.
- `#` (Taste 14) pausiert das Lauflicht und setzt es fort — ein zweites
  Flankenereignis.

Eine absichtliche Compiler-Warnung gehört zur Lektion: Auf dem echten A2
teilen sich die LEDs und die 74HC138-Auswahlpins der Anzeige **Port
P2**. Der Compiler sagt das — und das Programm funktioniert trotzdem,
weil jeder LED-Schreibzugriff durch ein Schattenbyte geht, das allein
der Interrupt auf den Port schreibt.
