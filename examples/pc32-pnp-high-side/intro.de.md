---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc01-led-resistor]
teaches: [pnp-transistor, high-side-switching, base-current, complementary-pair]
---

## Was du siehst

Einen Transistor, der zwischen der 5-V-Schiene und der Last sitzt — nicht
zwischen Last und Masse. Der kleine Pfeil am Emitter zeigt *hinein* in den
Transistor, und genau das macht ihn zu einem PNP statt zu dem NPN, den du schon
kennst. Der Schalter berührt den LED-Strom überhaupt nicht; er zieht nur an der
Basis.

## Probier das aus

1. Klick auf **Sim**, `sw` offen. Nichts leuchtet. Miss die Basis: **4,99 V**,
   ganz knapp unter den 5,00 V des Emitters.
2. Überleg dir, was Schließen von `sw` bewirken soll: Es zieht die Basis über
   `rb` Richtung Masse.
3. Vergleich das mit [pc05-npn-switch](../pc05-npn-switch), wo der Transistor
   *unter* der Last sitzt und die Basis zum Einschalten *hochgezogen* wird.
   Diese Schaltung ist jene Schaltung auf dem Kopf.

## Was dahintersteckt

Ein Transistor ist ein Ventil, das ein kleiner Strom öffnet. Beim NPN fließt
dieser kleine Strom *in* die Basis hinein, und das Ventil verbindet die Last nach
unten mit Masse — ein **Low-Side-Schalter**. Beim PNP ist alles gespiegelt: Der
kleine Strom fließt *aus* der Basis heraus, und das Ventil verbindet die Last
nach oben mit der Plusschiene. Das ist ein **High-Side-Schalter**.

Warum der Aufwand, wenn die NPN-Variante einfacher ist? Weil ein
Low-Side-Schalter die Versorgung an der Last hängen lässt, auch wenn die Last aus
ist. Bei einer LED stört das niemanden. Bei einem Motor, einem Sensor oder einer
ganzen Platine, die stromlos werden soll, ist "aus, aber immer noch mit 5 V
verbunden" die falsche Art von aus — alles, was den Pluspol der Last berührt,
steht weiter unter Spannung. High-Side-Schalten trennt stattdessen die
Versorgung.

Die Einschaltregel für den PNP ist die Spiegelung der NPN-Regel: Die Basis muss
etwa 0,7 V *unter* dem Emitter liegen, nicht darüber. `rb` begrenzt, wie viel
Basisstrom dann fließt — ohne ihn wäre Basis nach Masse ein Kurzschluss über eine
leitende Sperrschicht. Was auch immer an Basisstrom fließt: Der Transistor lässt
etwa das β-fache davon (hier das Hundertfache) durch die Last, so weit die Last
das zulässt.

Wegen dieser Spiegelung heißen PNP und NPN ein **komplementäres Paar**. Setzt man
je einen von beiden auf dieselbe Last — einer zieht hoch, einer zieht herunter —,
hat man eine Gegentaktstufe, und die steckt in so gut wie jedem Logikbaustein.

## Warum das wichtig ist

Jedes batteriebetriebene Gerät, das Teile von sich abschaltet, um Strom zu
sparen, macht das high-side. Und alles, was im ausgeschalteten Zustand
berührsicher sein muss, ebenso. Den NPN-Low-Side-Schalter lernt man zuerst, weil
er leichter anzusteuern ist; brauchen tut man oft den anderen.

## Wie es weitergeht

- **Zuerst:** [pc05-npn-switch](../pc05-npn-switch) — das Low-Side-Original, mit
  jedem Bauteil an der gespiegelten Stelle.
- **Zum Vergleich:** [pc25-relay-isolator](../pc25-relay-isolator) — dieselbe
  Aufgabe mit vollständiger galvanischer Trennung statt mit einem Transistor.
- **Danach:** [pc44-push-pull-led](../pc44-push-pull-led) — beide
  Transistorarten an einer Last.
