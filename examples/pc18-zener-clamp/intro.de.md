---
level: intermediate
age: 12+
prereqs: [pc13-direct-diode, pc02-voltage-divider]
teaches: [zener-diode, voltage-regulation, reverse-breakdown, load-line]
---

## Was du siehst

Eine 9-V-Versorgung — höher als alles andere in dieser Sammlung — speist einen
330-Ω-Widerstand. Darunter sitzt eine Z-Diode, und die ist **verkehrt herum**
eingebaut, verglichen mit jeder anderen Diode, die du bisher gesehen hast: Ihr
Ring zeigt zur Plusseite. Von diesem Knotenpunkt führen ein 1-kΩ-Widerstand und
eine grüne LED nach Masse. Die LED leuchtet, und am Knoten stehen etwa 5,1 V —
nicht 9 V.

## Probier das aus

1. Klick auf **Sim** und miss zwischen dem 330-Ω-Widerstand und der Z-Diode.
   Etwa **5,14 V**.
2. Öffne `circuit.json` und ändere die Quelle von 9 V auf **12 V**. Lass es
   noch einmal laufen und miss an derselben Stelle: **5,19 V**. Der Eingang
   stieg um 3 V, der Knoten um 0,05 V.
3. Probier jetzt **6 V**. Der Knoten liest **5,01 V** — immer noch rund 5,1.
4. Stell wieder 9 V ein.
5. Zum Vergleich: Lösch die Z-Diode ganz und lass es laufen. Jetzt folgt der
   Knoten dem Eingang bis nach oben, und bei 12 V wird die LED weit härter
   getrieben, als sie es verträgt.

## Was dahintersteckt

Eine gewöhnliche Diode sperrt, wenn man sie verkehrt herum anschließt. Eine
Z-Diode sperrt auch — aber nur bis zu einer bestimmten Spannung, dann gibt sie
nach. Diese hier gibt bei etwa 5,1 V nach, und genau wegen dieser Zahl kauft man
sie.

Hat sie einmal nachgegeben, benimmt sie sich wie eine sehr störrische Wand.
Drückt der Eingang stärker, nimmt die Z-Diode einfach mehr Strom auf und hält
ihre Spannung fast still. Der zusätzliche Druck muss irgendwo bleiben, und
dieses Irgendwo ist der **330-Ω-Widerstand** darüber. Bei 9 V Eingang liegen an
ihm 3,86 V, er lässt 11,7 mA durch: 3,1 mA gehen in den LED-Zweig, die
restlichen 8,6 mA schluckt die Z-Diode und macht Wärme daraus.

Das ist der Handel. Ein Z-Dioden-Regler verschwendet absichtlich Strom, damit
die Spannung stehen bleibt. Ändere den Eingang von 6 V auf 12 V — ein Hub von
6 V — und der Ausgang bewegt sich um 0,17 V. Das ist ein Verhältnis von rund
35 zu 1.

Vergleich das mit einem einfachen Spannungsteiler, dem anderen üblichen Versuch,
eine kleinere Spannung zu bekommen. Ein Teiler ist ein *Verhältnis*, sein
Ausgang folgt dem Eingang also proportional: Derselbe Hub von 6 auf 12 V hätte
den Ausgang von 4 V auf 8 V gebracht und den LED-Strom verdoppelt. Ein Teiler
macht einen Bruchteil. Eine Z-Diode macht einen **Wert**.

Auch die Unvollkommenheit ist sichtbar. Der Knoten steht nicht exakt auf
5,1 V — er kriecht über den Bereich von 5,01 auf 5,19 V, weil der Durchbruch
zwar steil, aber nicht senkrecht ist. Echte Regler sind immer ein kleines
bisschen Teiler.

## Warum das wichtig ist

Die 5 V, die Mikrocontroller, Sensoren und Logikbausteine alle erwarten, müssen
irgendwoher kommen, und Batterien liefern sie nicht: Ein 9-V-Block startet eher
bei 9,5 V und sackt beim Leerwerden Richtung 7 V ab. Irgendetwas muss aus einem
driftenden Eingang eine feste Schiene machen. Eine Z-Diode ist das Einfachste,
was das kann, und wer sie verstanden hat, für den sehen dreibeinige Regler wie
der 7805 nicht mehr nach Zauberei aus.

## Wie es weitergeht

- **Als Nächstes:** [pc41-zener-reference](../pc41-zener-reference) — die
  Z-Diode als Messreferenz statt als Versorgung.
- **Danach:** [23-voltage-regulator](../23-voltage-regulator) — dieselbe
  Aufgabe, erledigt von einem richtigen Regler-IC, und was er dir einbringt.
- **Außerdem:** [pc49-diode-clamp](../pc49-diode-clamp) — ein Signal begrenzen
  statt einer Versorgung.
- **Zum Ausprobieren:** Überleg dir, was passiert, wenn der LED-Zweig plötzlich
  20 mA statt 3 mA braucht. Der 330-Ω-Widerstand liefert insgesamt nur etwa
  11,7 mA, der Z-Diode bliebe also nichts mehr, sie würde aufhören zu leiten,
  und die Regelung bräche zusammen. Probier es, indem du die 1 kΩ auf 100 Ω
  änderst, und schau, wo der Knoten landet.
