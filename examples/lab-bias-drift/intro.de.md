# Wärme verschiebt den Arbeitspunkt

Eine Transistor-Verstärkerstufe wird über einen Spannungsteiler mit Poti vorgespannt. Erwärme den Transistor (wie mit einem Föhn) und beobachte die Kollektorspannung: Mit einem einfachen Teiler läuft sie davon, mit einem Emitterwiderstand oder einer Rückkopplung vom Kollektor bewegt sie sich kaum.

**Vermittelt:** Temperaturdrift eines Transistors, Stabilisieren des Arbeitspunkts durch Gegenkopplung

## Was zu tun ist

Klick auf **Sim**. Der Kollektor liegt bei etwa 6,6 V. Wähle den Transistor und schiebe seinen **Temperatur**-Regler auf heiß (70 °C), dann zurück auf Raumtemperatur.

- Leg den **zweiten Schiebeschalter** um, damit der Emitterwiderstand drin ist, stell das **Vorspannungspoti** auf 0,90 (Kollektor bei etwa 5,8 V) und erwärme erneut.
- Stell ihn zurück und leg stattdessen den **ersten Schiebeschalter** um (der Teiler hängt jetzt am Kollektor), stell das Poti auf 0,70 und erwärme erneut.

## Was du sehen solltest

- Einfacher Teiler: Der Kollektor fällt heiß von etwa 6,6 V auf etwa 2,3 V — fast gesättigt.
- Mit Emitterwiderstand: von etwa 5,8 V auf 5,7 V.
- Mit Kollektor-Rückkopplung: von etwa 6,1 V auf 5,5 V.

## Warum es funktioniert

Ein warmer Übergang leitet schon bei kleinerer Spannung (etwa 2 mV weniger pro Grad). Bleibt die Basisspannung fest, wirkt das wie mehr Ansteuerung, und der Strom wächst exponentiell. Ein Emitterwiderstand macht aus mehr Strom eine höhere Emitterspannung und nimmt die Ansteuerung zurück; ein Widerstand vom Kollektor zur Basis tut dasselbe von der anderen Seite: mehr Strom, niedrigerer Kollektor, weniger Basisstrom. Der Kondensator über dem Emitterwiderstand erhält die Signalverstärkung.
