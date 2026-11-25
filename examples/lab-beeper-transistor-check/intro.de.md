# Transistorprüfer mit Piepser

Der Piepser aus dem Diodenprüfer, diesmal an einem Transistor. Sechs Schalter sind die Prüfklemmen: die rote kann an Basis, Kollektor oder Emitter, die schwarze ebenso. Welche Paare piepen, zeigt, dass ein Transistor aus zwei gegeneinander geschalteten Dioden besteht.

**Vermittelt:** Sperrschichten im Transistor, Basis finden, Durchgangsprüfung

## Was zu tun ist

Klick auf **Sim**. Schließ eine rote Klemme (switch_19 Basis, switch_20 Kollektor, switch_21 Emitter) und eine schwarze (switch_22 Basis, switch_23 Kollektor, switch_24 Emitter), hör hin und öffne beide wieder. Probier alle sechs Paare.

## Was du sehen solltest

- Rot an Basis, Schwarz an Emitter: Piep. Rot an Basis, Schwarz an Kollektor: Piep.
- Dieselben beiden Paare umgekehrt: Stille.
- Kollektor und Emitter, in beiden Richtungen: Stille.

## Warum es funktioniert

In einem NPN-Transistor bildet die Basis mit dem Emitter eine Diode und mit dem Kollektor eine zweite; beide zeigen von der Basis weg. Strom kann also an der Basis hinein und an einem Ende hinaus, aber nie an einem Ende hinein und an der Basis hinaus — und auch nicht direkt vom Kollektor zum Emitter, solange die Basis nichts bekommt.
