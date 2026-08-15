---
level: intermediate
age: 12+
prereqs: [pc14-mini-led, pc06-rc-charge]
teaches: [rc-time-constant, capacitor-charging, exponential-curve]
---

## Was du siehst

Ein Mini-Steckbrett mit nur zwei Bauteilen: ein 10-kΩ-Widerstand und ein
100-µF-Kondensator, die sich in Spalte 7 treffen. Nichts leuchtet. Wer diese
Schaltung eine Millisekunde laufen lässt und dann wegschaut, hält sie für
kaputt — zu Unrecht, denn hier geht es um **Sekunden**.

## Probier das aus

1. Klick auf **Sim** und beobachte die Spannung dort, wo Widerstand und
   Kondensator sich treffen (Spalte 7). Sie steigt, langsam.
2. Lies sie bei **1 Sekunde** ab: etwa **3,16 V**. Das sind 63 % von 5 V.
3. Lies sie bei **2 Sekunden** ab: **4,32 V** (86 %). Bei **3 Sekunden**:
   **4,75 V** (95 %). Bei **5 Sekunden**: **4,97 V** (99 %).
4. Achte auf die *Abstände*, nicht auf die Zahlen. Von 0 bis 1 s kamen 3,16 V
   dazu. Von 1 bis 2 s nur noch 1,16 V. Von 2 bis 3 s nur noch 0,43 V. Jede
   Sekunde schafft er wieder rund 63 % der übrig gebliebenen Strecke.
5. Ändere den Widerstand auf 1 kΩ. Alle diese Zeiten werden durch zehn geteilt:
   Die 63 % sind jetzt schon nach 0,1 s erreicht.

## Was dahintersteckt

Ein Kondensator ist ein Eimer für Ladung, ein Widerstand ein enges Rohr. Die
Stromquelle versucht, den Eimer durch das Rohr zu füllen.

Am Anfang ist der Eimer leer, die vollen 5 V drücken auf den Widerstand, und es
fließt viel. Doch je voller der Eimer wird, desto mehr drückt seine eigene
Spannung dagegen. Steht der Kondensator bei 3 V, bleiben nur noch 2 V am
Widerstand, um etwas anzutreiben — das Füllen wird langsamer. Bei 4,5 V sind es
nur noch 0,5 V, und es kriecht dahin. Je voller, desto langsamer: Deshalb wird
er nie ganz fertig.

Die Zahl, die das beschreibt, ist die **Zeitkonstante**, geschrieben τ (tau),
und sie ist einfach Widerstand × Kapazität:

**τ = 10 000 Ω × 0,0001 F = 1 Sekunde**

Ein τ bringt dich immer 63 % des Weges zum Ziel. Zwei τ ergeben 86 %, drei τ
95 %, fünf τ 99 %. Diese Prozentzahlen gelten für jedes RC-Glied, das es je
gegeben hat — nur die Länge eines τ ändert sich. Deshalb geben Fachleute τ an
und keine Tabelle mit Spannung und Zeit: Eine einzige Zahl beschreibt die ganze
Kurve.

Mal R zehn, oder C zehn, und τ wird zehnmal so groß. Mehr ist die Entwurfsregel
nicht.

## Warum das wichtig ist

Mit τ kauft man sich Zeit in einer Schaltung, ganz ohne Uhr und ohne Programm:
einen Taster entprellen, einen Reset-Pin unten halten, während ein Chip
hochfährt, eine zappelnde Versorgung glätten, festlegen, wie schnell eine Lampe
ausblendet. Hinter jedem dieser Fälle steckt jemand, der R und C so gewählt
hat, dass τ passt.

## Wie es weitergeht

- **Als Nächstes:** [pc21-rc-smoothing](../pc21-rc-smoothing) — dieselbe Physik
  mit τ = 100 ms, schnell genug, um sie am Stück zu beobachten.
- **Danach:** [pc50-two-stage-rc](../pc50-two-stage-rc) — zwei davon
  hintereinander.
- **Zum Ausprobieren:** Rate die Spannung bei 4 Sekunden, bevor du misst. Bei
  3 s stehen 4,75 V, es fehlen also noch 0,25 V; ein weiteres τ schafft 63 %
  davon, also 4,75 + 0,16 ≈ **4,91 V**. Prüf es nach.
