# Ein Verstärker-IC wobbelt einen Transistor-Multivibrator

Zwei Oszillatoren. Der Verstärkerchip kippt mit Rückkopplung auf seinen eigenen Eingang langsam hin und her — etwa zwanzigmal pro Sekunde. Ein Zwei-Transistor-Multivibrator singt über eine Piezoscheibe, aber seine Basiswiderstände hängen nicht an der Batterie, sondern an einem Kondensator, den die Impulse des Chips über eine Diode aufladen.

**Vermittelt:** ein Verstärker-IC als Kippschaltung, Frequenz über die Vorspannung, Sägezahn aus Diode und Kondensator

## Was zu tun ist

Klick auf **Sim** und hör auf die Piezoscheibe. Beobachte die Spannung am 2,2-µF-Kondensator (dem Steuerpunkt).

## Was du sehen solltest

- Der Steuerpunkt springt bei jedem Impuls des Chips auf etwa 7,6 V und sinkt bis zum nächsten langsam auf etwa 4,9 V — ein Sägezahn.
- Der Ton gleitet von etwa 265 Hz auf etwa 210 Hz herunter und springt wieder hoch, immer wieder.

## Warum es funktioniert

Jede Hälfte des Multivibrator-Takts dauert so lange, wie ein Kondensator braucht, um sich über einen Basiswiderstand umzuladen, und das geht umso schneller, je höher die Spannung ist, an der der Widerstand hängt. Die Diode lässt den Impuls des Chips den Steuerkondensator sofort füllen, verhindert aber, dass der Chip ihn wieder leert: Nur die Basiswiderstände entladen ihn, langsam. So steigt die Spannung — und die Tonhöhe — mit einem Sprung und fällt in einer Rampe.
