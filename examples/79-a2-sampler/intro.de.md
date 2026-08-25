# Der A2-Sampler

Die 4×4-Matrixtastatur und die 8-stellige 7-Segment-Anzeige des Prechin
A2 laufen gemeinsam, mit der vermessenen P1-Matrix und der
74HC245/74HC138-Ansteuerung.

- Drücke eine Taste: ihre Nummer (0–15) erscheint auf der Anzeige, über
  den `a key is pressed`-Reporter und den gescannten Tastenindex.
- `*` (Taste 12) setzt die Anzeige auf 0 zurück — ein
  `WHEN key 12 pressed:`-Flankenereignis, das der entprellte gemeinsame
  Scan genau einmal pro Druck auslöst.
- `#` (Taste 14) setzt intern `hash_seen` — ein zweites Flankenereignis.

Die LED-Reihe wird absichtlich nicht gleichzeitig angesteuert. Auf dem
echten A2 liegt sie an ganz P2, während P2.2–P2.4 zugleich den 74HC138
adressieren. Diese wechselnden Bits treiben sichtbar D3–D5; unabhängige,
stabile Muster sind daher nicht möglich. Dafür gibt es ein separates
LED-Reihen-Beispiel.
