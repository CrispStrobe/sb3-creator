---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [voltage-divider, series-circuit, kirchhoff-voltage-law, loading]
---

## Was du siehst

Drei gleiche Widerstände in einer Reihe von 9 V hinunter nach Masse. Sonst
nichts — keine LED, kein Chip, nichts, was leuchtet. Das Interessante an dieser
Schaltung sind die beiden Punkte *zwischen* den Widerständen.

## Probier das aus

1. Klick auf **Sim**.
2. Miss ganz oben: **9 V**. Ganz unten: **0 V**. Noch keine Überraschung.
3. Miss den Punkt zwischen `r1` und `r2`: genau **6 V**.
4. Miss den Punkt zwischen `r2` und `r3`: genau **3 V**.
5. Ändere `r2` von 10000 auf 20000 Ohm und miss beide Punkte noch einmal. Die
   Stufen sind nicht mehr gleich groß — der mittlere Widerstand nimmt sich jetzt
   die halbe Versorgungsspannung.

## Was dahintersteckt

Die drei Widerstände liegen in Reihe, also fließt durch alle genau derselbe
Strom — woanders hin kann er nicht. Zusammengezählt sind das 30 kΩ. Das
ohmsche Gesetz sagt 9 V ÷ 30 000 Ω = **0,3 mA**, und diese eine Zahl fließt durch
die ganze Kette.

Jetzt schau, was jeder Widerstand damit anfängt. Die Spannung an einem Widerstand
ist Strom mal Widerstand: 0,3 mA × 10 kΩ = 3 V. Alle drei sind gleich, jeder
nimmt sich also 3 V, und die drei Anteile ergeben zusammen wieder die 9 V vom
Anfang. Das ist immer so — die Spannungen in einer Masche müssen sich zu null
addieren. Das ist die Maschenregel von Kirchhoff, und sie ist so etwas wie der
Kassensturz der Elektronik.

Die Abgriffe liegen damit bei 9 − 3 = 6 V und 6 − 3 = 3 V. Mehr ist die Leiter
nicht: eine Quelle, mehrere Spannungen, kein einziges aktives Bauteil.

Schritt 5 zeigt die Regel dahinter. Was einen Abgriff festlegt, ist nicht der
einzelne Widerstandswert, sondern das **Verhältnis** von dem, was darunter liegt,
zum Ganzen. Verdoppelst du den mittleren, holt er sich einen größeren Anteil, und
die anderen beiden schrumpfen entsprechend.

Einen Haken gibt es, und deshalb benutzt man Leitern nicht für alles: Ein
Spannungsteiler hält diese Werte nur, solange niemand Strom aus den Abgriffen
zieht. Hängst du etwas dran, das wirklich Strom braucht, zieht es den Abgriff
herunter — deine Last ist dann nämlich ein vierter Widerstand, parallel zu allem
unterhalb des Abgriffs.

## Warum das wichtig ist

Das ist der billigste Weg, eine Spannung zu bekommen, die man nicht hat. Jeder
Lautstärkeregler ist eine Leiter mit verschiebbarem Abgriff, jeder
Mikrocontroller, der eine 9-V-Batterie misst, tut das zuerst über einen Teiler
(5 V würden einen 3,3-V-Eingang zerstören), und die R-2R-Leiter — dieselbe Idee
mit zwei Widerstandswerten — ist in vielen Chips der Weg von Zahlen zurück zu
Spannungen.

## Wie es weitergeht

- **Zum Vergleich:** [pc02-voltage-divider](../pc02-voltage-divider) — zwei
  Widerstände, dieselbe Regel, als Formel geschrieben.
- **Als Nächstes:** [pc37-selectable-reference](../pc37-selectable-reference) —
  zwischen Abgriffen umschalten und so eine Referenzspannung wählen.
- **Danach:** [pc07-pot-dimmer](../pc07-pot-dimmer) — ein Teiler, dessen Abgriff
  sich verschieben lässt.
- **Zum Ausprobieren:** Häng einen 10-kΩ-Widerstand vom 6-V-Abgriff nach Masse
  und miss noch einmal. Es sind keine 6 V mehr. Überleg vorher, warum: Wie groß
  ist der Widerstand von diesem Abgriff nach Masse jetzt, und wie groß war er
  vorher?
