# Deine Stimme verbiegt den Ton

Sprich in einen Lautsprecher, und ein Ton wackelt im Takt deiner Stimme: je lauter du sprichst, desto mehr.

**Vermittelt:** Frequenzmodulation, Mikrofonvorverstärker, Steuerspannung

## Was zu tun ist

Klick auf **Sim** und hör dir den gleichmäßigen Ton an. Zieh den Schall-Regler des Lautsprechers (speaker_3) auf etwa 94 dB (laut und nah sprechen), dann wieder auf 0.

## Was du sehen solltest

- Stille: ein gleichmäßiger Ton von etwa 1,4 kHz.
- Sprechen: Der Ton schwankt um etwa 5 % auf und ab.

## Warum es funktioniert

Der Lautsprecher arbeitet rückwärts als Mikrofon. Zwei Transistoren verstärken seine winzige Spannung auf etwa ein Volt, und ein Kondensator gibt sie an den Steuereingang des 555 weiter. Der Steuereingang legt fest, bei welchen Spannungen der 555 umschaltet; drückt deine Stimme ihn hoch, wird der Ton tiefer, zieht sie ihn runter, wird er höher.
