---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [breadboard-strips, mini-breadboard, no-power-rails]
---

## Was du siehst

Ein winziges Steckbrett — der kleine weiße Block mit 170 Löchern und, anders
als seine großen Geschwister, **ohne rote und blaue Streifen an den Rändern**.
Ein Widerstand und eine rote LED stecken darin, die LED leuchtet, und auf der
ganzen Fläche sind nur zwei Leitungen gezeichnet: die beiden Zuleitungen der
Stromversorgung.

## Probier das aus

1. Klick auf **Sim**. Die rote LED leuchtet.
2. Zähl die Spalten. Die Beine des Widerstands stecken in **a3** und **a7**,
   die Beine der LED in **b7** und **b8**. Achte darauf: a7 und b7 liegen in
   derselben Spalte — nur deshalb kommt der Widerstand überhaupt bei der LED
   an.
3. Miss die Spannung dort, wo Widerstand und LED sich treffen. Etwa **2,06 V**.
4. Jetzt mach es absichtlich kaputt: Öffne `circuit.json` und setz den
   `anode`-Anschluss der LED von `b7` auf `b6`. Lass es noch einmal laufen —
   die LED bleibt dunkel. Es sieht genauso aus wie vorher, aber Spalte 6 und
   Spalte 7 sind getrennte Streifen.
5. Setz es wieder auf `b7`.

## Was dahintersteckt

Im Steckbrett stecken kleine Metallklammern. Auf diesem Mini-Brett ist jede
**Spalte** aus fünf Löchern (a, b, c, d, e oberhalb der Rille) eine Klammer.
Zwei Beine in derselben Spalte sind verbunden, als hättest du sie
zusammengelötet. Beine in verschiedenen Spalten sind gar nicht verbunden.

Der Stromkreis liest sich also so: Die Plusleitung kommt in Loch e3 an, das ist
Spalte 3. Das erste Bein des Widerstands steckt in a3 — dieselbe Spalte, also
verbunden. Das andere Bein sitzt in a7, Spalte 7, und die Anode der LED in b7 —
wieder dieselbe Spalte, wieder verbunden. Das zweite LED-Bein führt in Spalte 8,
und dort kommt die Rückleitung an. Der Kreis ist geschlossen, und nur zwei
dieser Verbindungen hat eine sichtbare Leitung gemacht.

Der Strom ergibt sich zu (5 V − 2,06 V) ÷ 470 Ohm = **6,25 Milliampere**.

Große Steckbretter haben außerdem zwei lange Streifen an den Rändern, die
**Stromschienen**, um Plus und Minus überallhin zu verteilen. Dieses hier hat
keine. Das ist kein Mangel — 170-Punkte-Bretter werden wirklich so gebaut, und
darauf zu bauen zeigt dir, dass die Schienen bequem sind, aber nie das waren,
was die Schaltung zum Laufen bringt.

## Warum das wichtig ist

Kaum ein Steckbrett-Fehler kommt in der ersten Stunde häufiger vor als ein Bein
in der falschen Spalte. Das Brett warnt dich nicht: Es sieht ordentlich aus und
tut nichts. Die Streifen lesen zu können heißt, mit bloßem Auge Fehler zu
finden.

## Wie es weitergeht

- **Als Nächstes:** [pc16-mini-rc](../pc16-mini-rc) — ein Widerstand und ein
  Kondensator treffen sich in einer Spalte, auf demselben kleinen Brett.
- **Danach:** [pc15-mini-npn](../pc15-mini-npn) — ein Transistor, der gleich
  über drei Spalten reicht.
- **Zum Ausprobieren:** Verschieb die *ganze* Schaltung um vier Spalten nach
  rechts (aus a3→a7 wird a7→a11 und so weiter, auch die Zuleitungen). Sie muss
  sich danach genau gleich verhalten. Wenn nicht, ist ein Loch nicht
  mitgewandert.
