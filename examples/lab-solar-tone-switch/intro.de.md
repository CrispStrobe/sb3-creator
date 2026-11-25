# Eine Solarzelle zu schwach zum Schalten: Vorspannung hilft, und man hört das Licht

Eine Solarzelle liefert etwa ein halbes Volt, ein Transistor braucht aber etwa 0,65 V an der Basis, bevor er schaltet. Legt man eine kleine Vorspannung in Reihe mit der Zelle, kann Licht den Transistor schalten: Dann startet ein Verstärkerchip einen Ton.

**Vermittelt:** die Basis-Emitter-Schwelle, Vorspannung, ein akustischer Lichtmelder

## Was zu tun ist

Klick auf **Sim** und stell den Lichtregler der Solarzelle auf 1: Stille. Stell den **Schiebeschalter** auf Vorspannung. Dreh den Lichtregler auf 0 und dann wieder auf 0,5.

## Was du sehen solltest

- Ohne Vorspannung: kein Ton, auch bei vollem Licht.
- Mit Vorspannung, dunkel: kein Ton.
- Mit Vorspannung und Licht: ein Ton von etwa 490 Hz.

## Warum es funktioniert

Die Zelle allein erreicht nur 0,5 V, weniger als die 0,65 V, die ein Siliziumtransistor braucht. Das Poti legt etwa 0,3 V unter die Zelle, und jetzt hebt schon wenig Licht die Basis über die Schwelle. Der erste Transistor schaltet dann den zweiten ab, der den LM386-Oszillator festgehalten hatte, und der Lautsprecher tönt. Mit solchen Licht-Ton-Meldern finden blinde Menschen beleuchtete Fenster und Lampen.
