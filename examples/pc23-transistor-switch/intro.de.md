---
level: intermediate
age: 12+
prereqs: [pc15-mini-npn, pc01-led-resistor]
teaches: [npn-switch, base-current, current-gain, low-side-switching]
---

## Was du siehst

Oben links ein Taster, dazu ein 10-kΩ-Widerstand, ein NPN-Transistor und eine
LED mit eigenem 470-Ω-Widerstand. Der Taster liegt gar nicht im Stromkreis der
LED — verfolg die Leitungen, und du wirst sehen, dass der LED-Strom nie auch
nur in seine Nähe kommt. Der Taster redet ausschließlich mit der **Basis** des
Transistors.

## Probier das aus

1. Bei **offenem** Taster miss die Basisspannung: etwa **0,005 V**. Praktisch
   null. Der Transistor ist aus.
2. **Schließ** den Taster und miss noch einmal: **0,704 V**. Dabei bleibt es,
   und höher geht es nicht, egal was du mit dem Rest der Schaltung machst.
3. Rechne den Basisstrom aus: Am 10-kΩ-Widerstand liegen 5 − 0,704 = 4,3 V,
   also 4,3 ÷ 10 000 = **0,43 mA**.
4. Vergleich das mit dem, was der LED-Zweig braucht — rund **6 mA** — und merk
   dir: Der Taster hat es mit **vierzehnmal weniger Strom** zu tun als das, was
   er steuert.
5. Ändere den Basiswiderstand auf 100 kΩ. Die Basisspannung liegt weiterhin bei
   etwa 0,7 V; verändert hat sich nur der Strom, hinunter auf 43 µA.

## Was dahintersteckt

Ein Transistor ist ein Ventil, bei dem ein kleiner Fluss einen großen steuert.

Die Basis-Emitter-Strecke eines NPN ist einfach eine Diode, und wie jede Diode
hält sie ihre Spannung fast konstant, sobald sie leitet — das ist Schritt 2,
und daher kommen die 0,7 V. Was sich ändert, ist der **Strom** hindurch, und den
legt der Widerstand darüber fest, genau wie in jeder Dioden-plus-Widerstand-
Schaltung, die du schon kennst.

Der Transistor versucht dann, das β-Fache dieses Basisstroms durch den Kollektor
zu ziehen. β ist hier 100, 0,43 mA hinein heißt also: Er verlangt 43 mA hinaus.
Der Kollektorzweig kann nur rund 6 mA liefern, und wenn von einem Transistor
mehr verlangt wird, als die Schaltung hergibt, hört er auf, proportional sein zu
wollen, und schaltet einfach voll durch. Kollektor fast auf Emitterpotential,
Strom allein von LED und Widerstand bestimmt. Dieser Zustand heißt **Sättigung**,
und genau den will man von einem Schalter: ganz an oder ganz aus, nichts
dazwischen.

Die Entwurfsregel folgt daraus. Man bemisst einen schaltenden Basiswiderstand
nicht so, dass genau der gewünschte Kollektorstrom herauskommt — man bemisst ihn
so, dass ein Mehrfaches davon verlangt wird, damit der Transistor auch dann
sicher durchsteuert, wenn β von Exemplar zu Exemplar stark schwankt. Hier
beträgt die Reserve etwa 7:1.

Über Schritt 5 lohnt es sich weiterzudenken: Bei 100 kΩ verlangt der Transistor
4,3 mA, also *weniger* als die verfügbaren 6 mA. Er verließe die Sättigung und
benähme sich wie ein Verstärker; die LED wäre dunkler, und ihre Helligkeit
hinge am β genau dieses Transistors. Dieselbe Schaltung, andere Aufgabe, ein
Widerstand Unterschied.

## Warum das wichtig ist

Ein Mikrocontroller-Pin liefert typischerweise etwa 20 mA, und vieles, was man
steuern möchte — Motoren, Relais, Glühlampen, LED-Streifen — will weit mehr.
Diese Schaltung ist die Standardantwort darauf, und sie steckt überall drin. Der
Pin ersetzt den Taster, liefert ein halbes Milliampere, und der Transistor macht
die Arbeit.

## Wie es weitergeht

- **Als Nächstes:** [pc24-light-gate](../pc24-light-gate) — derselbe Schalter,
  aber mit einem Lichtsensor statt des Tasters.
- **Danach:** [pc39-nmos-switch](../pc39-nmos-switch) — die MOSFET-Fassung, die
  am Gate eine *Spannung* braucht statt eines Stroms.
- **Außerdem:** [44-darlington-motor](../44-darlington-motor) — zwei Transistoren
  gestapelt für viel mehr Verstärkung, mit echter Last.
- **Zum Ausprobieren:** Welchen Basiswiderstand bräuchtest du, wenn der
  LED-Zweig 60 mA statt 6 mA wollte? (Verlangt sein soll ein Mehrfaches von 60,
  ziel also auf I_b ≈ 3 mA: 4,3 V ÷ 0,003 A ≈ 1,4 kΩ.) Und beachte: Der
  *Taster* führt weiterhin nur diese 3 mA.
