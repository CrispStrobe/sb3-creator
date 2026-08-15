---
level: beginner
age: 12+
prereqs: [pc01-led-resistor, pc08-diode-polarity]
teaches: [diode, reverse-polarity-protection, forward-voltage-drop, one-way-valve]
---

## Was du siehst

Eine Batterie, eine Diode, einen Widerstand und eine LED, alles in einer Schleife.
Die Diode fällt aus der Reihe: Solange alles stimmt, tut sie nichts Nützliches.
Sie ist eine Versicherung.

## Probier das aus

1. Klick auf **Sim**. Die LED leuchtet mit **6,18 mA**.
2. Miss an der Diode: 9 V gehen hinein, **8,24 V** kommen heraus. Sie hat 0,76 V
   einbehalten.
3. Schließ die Quelle jetzt verkehrt herum an — stell `volts` bei `src` von `9`
   auf `-9`.
4. Nichts leuchtet, und nirgends fließt Strom. Die LED bleibt heil.
5. Achte auf die Warnung, die die Simulation zur verkehrt herum liegenden LED
   ausgibt. Das ist die Schaltung bei der Arbeit: Da *ist* etwas verkehrt herum,
   und die Diode hat es abgefangen.

## Was dahintersteckt

Eine Diode ist ein Einwegventil für Strom. In Pfeilrichtung darf er durch, in die
andere nicht. Mehr ist das Bauteil nicht.

Setz eine in Reihe zu deiner Schaltung, und du bekommst Schutz praktisch
geschenkt: Ist die Batterie richtig herum, leitet die Diode und alles
funktioniert. Ist sie verkehrt herum, sperrt die Diode, also funktioniert nichts
— und, viel wichtiger, es geht auch nichts kaputt. LEDs, Elektrolytkondensatoren
und die meisten Chips nehmen bei verpolter Versorgung Schaden, und ein
9-V-Block lässt sich genauso leicht falsch wie richtig aufklipsen.

Der Preis steht in Schritt 2. Eine leitende Siliziumdiode ist nicht umsonst: Sie
behält immer etwa 0,7 V für sich, egal wie viel Strom fließt. Deine 9-V-Schaltung
ist in Wahrheit eine 8,24-V-Schaltung. Bei 9 V sind das 8 % weg; bei einer
3-V-Knopfzelle wäre es ein Viertel von allem, was du hast — deshalb greift man
bei kleinen Spannungen lieber zu einem MOSFET: gleicher Schutz, ein paar
Millivolt Verlust, dafür mehr Bauteile.

Über Schritt 4 lohnt es sich nachzudenken. "Es passiert nichts" ist hier der
*Erfolgsfall*. Ein Schutzbauteil sieht man nie arbeiten, und der einzige Weg
herauszufinden, ob es da ist, besteht darin, absichtlich etwas falsch zu machen.

## Warum das wichtig ist

Verpolung ist die häufigste Art, ein Bastelprojekt zu töten — eine Diode ist die
billigste Versicherung der Elektronik. Sieh dir irgendeine Platine mit
Hohlstecker oder Batterieclip an: Meistens sitzt genau diese Diode direkt hinter
dem Anschluss.

## Wie es weitergeht

- **Vorher, falls noch nicht:** [pc08-diode-polarity](../pc08-diode-polarity) —
  die Diode allein, in beiden Richtungen.
- **Zum Vergleich:** [pc31-bridge-rectifier](../pc31-bridge-rectifier) — vier
  Dioden, die die falsche Polarität *benutzen*, statt sie zu sperren.
- **Als Nächstes:** [pc49-diode-clamp](../pc49-diode-clamp) — eine Diode, die
  gegen zu hohe Spannung schützt statt gegen die falsche Richtung.
- **Zum Ausprobieren:** Setz eine zweite Diode in Reihe zur ersten und miss noch
  einmal. Die LED wird dunkler, weil du jetzt 1,5 V statt 0,76 V bezahlst. Schutz
  ist nicht umsonst — und doppelter Schutz erst recht nicht.
