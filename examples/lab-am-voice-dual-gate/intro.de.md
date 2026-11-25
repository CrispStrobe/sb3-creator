# Sprache auf Sendung: Modulator mit Dual-Gate-MOSFET

Ein Oszillator erzeugt einen Mittelwellenträger und speist ihn in Gate 1 eines Dual-Gate-MOSFET, der einen zweiten Ferritstab treibt — die Sendeantenne. Gate 2 entscheidet, wie stark der MOSFET verstärkt: Ein Poti stellt es ein, und der Verstärkerchip fügt den Schall eines Lautsprechers hinzu, der als Mikrofon dient. Ein Detektorempfänger einen halben Meter entfernt hört zu.

**Vermittelt:** Amplitudenmodulation, ein Dual-Gate-MOSFET als Multiplizierer

## Was zu tun ist

Wähle das Lautsprecher-Mikrofon und stell seinen **Schall** auf still, klick auf **Sim** und hör in den Kristallohrhörer. Erhöhe dann den Schall wieder (100 dB: direkt hineingepfiffen). Probier das **Vorspannungspoti** an Gate 2.

## Was du sehen solltest

- Still: Der Empfänger bekommt einen gleichmäßigen Träger; nichts zu hören.
- Mit Schall: Der Demodulator des Empfängers trägt den 500-Hz-Ton — etwa fünfzehnmal mehr als ohne.
- Das Poti bestimmt, wie viel Träger durchkommt: Heruntergedreht nähert sich der Kanal der Abschnürung, und der Träger wird schwächer.

## Warum es funktioniert

Die beiden Gates dieses MOSFET steuern einen Kanal in Reihe. Gate 1 trägt den Träger; Gate 2, nahe dem Punkt gehalten, an dem es den Kanal abschnüren würde, entscheidet, wie viel von diesem Strom fließen darf. Der verstärkte Schall bewegt Gate 2, also folgt die Größe des Trägers dem Schall — genau das ist Amplitudenmodulation.
