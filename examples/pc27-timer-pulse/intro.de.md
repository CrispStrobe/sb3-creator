---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc01-led-resistor]
teaches: [555-timer, astable, rc-time-constant, threshold, hysteresis]
---

## Was du siehst

Ein 555-Timer-Baustein, zwei Widerstände, ein Kondensator und eine LED. Die LED
blinkt etwa fünfmal pro Sekunde — und in dieser Schaltung steckt weder ein
Mikrocontroller noch ein Programm. Das Blinken entsteht dadurch, dass ein
Kondensator sich immer wieder füllt und wieder leert.

## Probier das aus

1. Klick auf **Sim**. Die LED blinkt gleichmäßig.
2. Sieh dir die Spannung an `c1` an. Sie bildet einen langsamen Sägezahn:
   hinauf bis **3,33 V**, hinunter bis **1,67 V**, wieder hinauf. Aus diesem
   Band kommt sie nie heraus.
3. Beobachte gleichzeitig `u1.output`. Er ist hoch, während der Kondensator
   steigt, und niedrig, während er fällt.
4. Ändere `c1` von `0.00001` (10 µF) auf `0.000001` (1 µF). Alles wird zehnmal
   schneller.
5. Ändere `r2` von 10000 auf 47000 Ohm. Jetzt wird die Einschaltzeit viel länger
   als die Ausschaltzeit — das Blinken wird schief.

## Was dahintersteckt

Der 555 beobachtet eine einzige Leitung — den Kondensator — und hat dafür zwei
Schaltschwellen, bei einem Drittel und bei zwei Dritteln der Versorgungsspannung.
Dazwischen tut er gar nichts, und genau darin liegt der Trick.

Fang beim leeren Kondensator an. Unterhalb von 1/3 setzt der 555 seinen Ausgang
auf **hoch** und lässt den Kondensator laden, über `r1` und `r2` zusammen. Die
Spannung steigt, erst zügig, dann immer gemächlicher, so wie Kondensatoren sich
eben füllen.

Sobald sie 2/3 überschreitet, kippt der 555: Ausgang **niedrig**, und ein
interner Schalter legt den Punkt zwischen `r1` und `r2` auf Masse. Jetzt entlädt
sich der Kondensator nur noch über `r2`. Er fällt, bis er unter 1/3 rutscht, und
das Spiel beginnt von vorn.

Zwei Schwellen statt einer verhindern das Zittern. Würde der 555 bei einer
einzigen Spannung umschalten, würde er dort hektisch hin- und herschalten,
sobald der Kondensator in der Nähe herumschwebt. Ein Abstand dazwischen —
**Hysterese** — sorgt dafür, dass jede Entscheidung ein vollständiges Laden oder
Entladen nach sich zieht.

Die Zeiten kannst du genau ausrechnen: Die Einschaltzeit ist
0,693 × (R1 + R2) × C, die Ausschaltzeit 0,693 × R2 × C. Setz die Werte dieser
Schaltung ein, und es kommen 139 ms und 69 ms heraus — genau das misst die
Simulation. Die krumme 0,693 ist der natürliche Logarithmus von 2, und er taucht
auf, weil der Weg von 1/3 auf 2/3 beim Laden genau "die halbe Strecke" ist.

Damit erklärt sich auch Schritt 5: Geladen wird immer über beide Widerstände,
entladen aber nur über `r2`. In dieser Schaltung kann die Einschaltzeit deshalb
nie kürzer sein als die Ausschaltzeit.

## Warum das wichtig ist

Den 555 gibt es seit 1972, und er wird bis heute milliardenfach gebaut. Bevor in
jedem Projekt ein Mikrocontroller steckte, hat dieser Baustein blinken, piepen,
brummen und warten lassen. Außerdem sieht man an ihm besonders sauber, dass Zeit
im Grunde aus einem Kondensator und einem Widerstand besteht — ein
Mikrocontroller, der Millisekunden zählt, macht eine Ebene tiefer genau dasselbe.

## Wie es weitergeht

- **Vorher, falls noch nicht:** [pc06-rc-charge](../pc06-rc-charge) — ein
  Widerstand, ein Kondensator und die Kurve, auf der diese Schaltung reitet.
- **Als Nächstes:** [pc47-555-monostable](../pc47-555-monostable) — derselbe
  Baustein, aber so beschaltet, dass er einmal auslöst statt immerzu.
- **Danach:** [pc58-555-audio-pulse](../pc58-555-audio-pulse) — über 20 Hz
  hinaus blinkt er nicht mehr, sondern klingt.
- **Zum Ausprobieren:** Überleg dir, welches `c1` du für ein Blinken im
  Sekundentakt bräuchtest, und probier es aus. (Die Periode soll bei ungefähr
  1000 ms landen; die Formeln oben reichen dafür aus.)
