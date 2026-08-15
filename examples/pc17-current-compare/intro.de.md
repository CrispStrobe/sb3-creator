---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor, pc04-parallel-leds]
teaches: [ohms-law, current-limiting-resistor, parallel-circuit, brightness]
---

## Was du siehst

Drei LEDs nebeneinander — rot, grün, blau — alle an derselben 5-V-Versorgung,
jede über ihren eigenen Widerstand. Die Widerstände sind verschieden: 220, 470
und 1000 Ohm. Die LEDs sind deutlich unterschiedlich hell, und das Muster ist
nicht das, was man raten würde: **Der größte Widerstand macht das schwächste
Licht.**

## Probier das aus

1. Klick auf **Sim**. Alle drei leuchten, in drei klar verschiedenen Stufen.
2. Miss den Strom in jedem Zweig. Du solltest etwa **13 mA** (rot),
   **6,3 mA** (grün) und **3,0 mA** (blau) bekommen.
3. Schau daneben auf die Widerstandswerte: 220, 470, 1000. Ungefähr doppelt,
   dann noch einmal ungefähr doppelt. Und jetzt die Ströme: 13, 6,3, 3,0 —
   ungefähr halb, dann noch einmal halb.
4. Miss die Spannung an jeder LED-Anode. Alle drei liegen nahe bei **2 V**:
   2,13, 2,06, 2,03. Fast gleich, aber eben nicht ganz — und die hellste hat
   den höchsten Wert.
5. Ändere die 1000 Ω auf 2200 Ω. Die blaue LED wird dunkler. Prüf Rot und
   Grün: unverändert, bis auf die letzte Stelle.

## Was dahintersteckt

Die LED legt die Spannung fest, der Widerstand legt den Strom fest.

Jeder Zweig beginnt mit denselben 5 V. Jede LED nimmt sich davon rund 2 V, für
jeden Widerstand bleiben also etwa 3 V übrig — dieselben 3 V in allen drei
Zweigen. Verschieden ist nur, was diese 3 V hindurchdrücken können:

- 3 V ÷ 220 Ω = 13,6 mA
- 3 V ÷ 470 Ω = 6,4 mA
- 3 V ÷ 1000 Ω = 3,0 mA

Das ist das ohmsche Gesetz und sonst nichts, und es erklärt, warum ein größerer
Widerstand eine dunklere LED bedeutet: Der Widerstand ist die Engstelle im
Rohr, und durch eine engere Stelle passt weniger.

Der Punkt aus Schritt 4 lohnt sich zu merken. Die drei LEDs liegen *nicht*
genau bei 2 V — sie liegen bei 2,13, 2,06 und 2,03, und die mit dem größten
Strom liegt am höchsten. Die Durchlassspannung einer LED wächst langsam mit,
je mehr man durchschickt. Deshalb kommen die gemessenen Ströme (13,04, 6,25,
2,97 mA) ein paar Prozent unter der glatten Rechnung heraus: Im
geschäftigsten Zweig blieben dem Widerstand etwas weniger als 3 V. Zum Wählen
eines Widerstands reicht die Schätzung; genau ist sie nicht, und zu wissen, in
welche Richtung sie danebenliegt, gehört zum Lesen einer Schaltung dazu.

Schritt 5 ist wieder die Parallelregel: drei getrennte Wege, kein Teilen.

## Warum das wichtig ist

"Welchen Widerstand brauche ich?" ist die häufigste Anfängerfrage in der
Elektronik, und das hier ist die vollständige Antwort: Entscheide dich für den
gewünschten Strom, zieh die LED-Spannung von der Versorgung ab, und teile.
20 mA sind ein typisches LED-Maximum; 220 Ω an 5 V liegen also am hellen Ende
und sind völlig sicher. Deutlich darunter zu gehen ist der Weg, auf dem LEDs
sterben.

## Wie es weitergeht

- **Als Nächstes:** [pc20-rgb-mix](../pc20-rgb-mix) — dieselben drei Zweige,
  diesmal so gewählt, dass sie eine Farbe mischen statt zu vergleichen.
- **Danach:** [45-led-current-comparison](../45-led-current-comparison) — der
  Vergleich weitergeführt.
- **Zum Ausprobieren:** Nimm dir 10 mA für die blaue LED vor und rechne den
  Widerstand aus, bevor du ihn eintippst. (3 V ÷ 0,010 A = 300 Ω, also 330 Ω,
  der nächste Normwert — miss dann nach, ob du 9 mA statt 10 bekommst, und
  überleg dir, warum.)
