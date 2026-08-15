---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc16-mini-rc]
teaches: [rc-time-constant, smoothing, low-pass-filter, step-response]
---

## Was du siehst

Zwei Bauteile und ein Draht: ein 1-kΩ-Widerstand von der Versorgung und ein
100-µF-Kondensator vom Knoten darunter nach Masse. Nichts leuchtet. Das
Interessante an dieser Schaltung ist nicht, wie sie aussieht, sondern **wie
schnell sie ihre Meinung ändern kann** — und die Antwort lautet 100
Millisekunden.

## Probier das aus

1. Klick auf **Sim** und beobachte den Knoten zwischen Widerstand und
   Kondensator. Lies ihn bei **100 ms** ab: etwa **3,16 V**, also 63 % von 5 V.
   Bei **300 ms** sind es **4,75 V** (95 %), und bei **500 ms** ist er
   praktisch angekommen.
2. Jetzt ändere die Versorgung im laufenden Betrieb. Lass sie sich auf 5 V
   einpendeln und senk die Quelle bei 500 ms auf **2 V**.
3. Beobachte, wie der Knoten folgt. 100 ms nach dem Sprung steht er bei
   **3,09 V** — nicht bei 2 V. Nach weiteren 100 ms: **2,40 V**. Nach dem
   dritten Mal: **2,15 V**. Er braucht rund 300 ms für 95 % des Weges nach
   unten.
4. Zähl wieder die Abstände. Jede 100 ms schafft rund 63 % der noch übrigen
   Strecke — abwärts genauso wie vorher aufwärts.
5. Ändere den Widerstand auf 10 kΩ. Alle diese Zeiten werden zehnmal so lang.

## Was dahintersteckt

Die Quelle sprang schlagartig um 3 V. Der Knoten brauchte eine Drittelsekunde
zum Nachkommen. Diese Verzögerung ist kein Fehler — sie ist das ganze Produkt.

Ein Kondensator wehrt sich gegen *Änderungen* seiner Spannung. Damit der Knoten
sich bewegt, muss Ladung hinein- oder herausfließen, und der Widerstand ist der
einzige Weg rein und raus. Der Knoten kann also nie springen, sondern nur
rampen, und die Steilheit dieser Rampe bestimmt
**τ = R × C = 1000 Ω × 0,0001 F = 100 ms**.

Und jetzt überleg, was das mit einem zappelnden Signal macht. Eine langsame
Änderung — eine, die Sekunden dauert — lässt dem Knoten reichlich Zeit
mitzukommen, und sie geht praktisch unverändert durch. Eine schnelle Änderung —
eine Spitze von einer Millisekunde — ist vorbei, bevor der Knoten auch nur 1 %
des Weges zurückgelegt hat, und taucht deshalb kaum auf. Die Schaltung lässt
Langsames durch und hält Schnelles zurück; deshalb heißt sie auch **Tiefpass**.

Das ist mit "Glätten" gemeint. Es ist kein Mitteln im Sinne der Rechenkunst,
sondern eine Verzögerung — und die Verzögerung frisst bevorzugt das Schnelle.

Der Preis steht auf derselben Münze. Ein größeres τ unterdrückt mehr Störungen —
macht den Ausgang aber auch träger für Änderungen, die du *wolltest*. Jeder
Filter, den je jemand entworfen hat, ist genau dieser Handel, bewusst
eingegangen.

## Warum das wichtig ist

Das ist die Zwei-Bauteil-Schaltung, die neben fast jedem Chip sitzt, den du je
benutzen wirst: der Stützkondensator, der eine Versorgungsschiene ruhig hält,
wenn ein Motor anläuft; der Filter an einem analogen Sensor, bevor er zum ADC
geht; die Weichzeichnung zwischen einem PWM-Ausgang und etwas, das eigentlich
eine echte Spannung wollte. Wenn jemand sagt "häng da mal einen Kondensator
dran", meint er diese Schaltung, und τ ist die Zahl, die er wählt.

## Wie es weitergeht

- **Als Nächstes:** [pc50-two-stage-rc](../pc50-two-stage-rc) — zwei davon
  hintereinander, was härter filtert.
- **Danach:** [50-rc-scope](../50-rc-scope) — dieselbe Kurve auf einem
  Messgerät statt in einer Tabelle.
- **Außerdem:** [pc43-bleeder-discharge](../pc43-bleeder-discharge) — das
  umgekehrte Problem: die Ladung wieder herausbekommen.
- **Zum Ausprobieren:** Du willst einen Filter, der binnen einer Sekunde
  eingeschwungen ist, und hast einen 10-µF-Kondensator. Welcher Widerstand?
  (99 % brauchen 5 τ, also muss τ = 0,2 s sein; 0,2 ÷ 0,00001 = 20 000 Ω.)
  Probier es und prüf den Wert bei 1 Sekunde.
