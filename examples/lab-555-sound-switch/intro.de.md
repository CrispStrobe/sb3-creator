# Geschaltet durch Klatschen oder Taschenlampe

Klatsch in die Hände, und ein Relais schaltet eine Lampe für ein paar Sekunden ein. Sprechen reicht nicht – es braucht ein lautes Geräusch. Mit einem Schalter umgestellt, erledigt eine Taschenlampe dasselbe.

**Vermittelt:** Lautsprecher als Mikrofon, Transistorverstärker, Schwelle, Monoflop

## Was zu tun ist

Klick auf **Sim** und warte einen Moment. Zieh den Schall-Regler des Lautsprechers (speaker_3) auf 70 dB (Sprechen), dann auf 100 dB (Klatschen), dann zurück auf 0. Schieb dann den Schiebeschalter (slide_switch_15) nach rechts und zieh den Licht-Regler des Fototransistors (phototransistor_16) hoch.

## Was du sehen solltest

- 70 dB oder 90 dB: nichts.
- 100 dB: Das Relais (relay_27) klickt, die Lampe leuchtet etwa 2,4 s.
- Lichtbetrieb: Die Lampe leuchtet, wenn die Taschenlampe scheint.

## Warum es funktioniert

Schall bewegt die Membran des Lautsprechers, und seine Spule erzeugt eine winzige Spannung. Zwei Transistorstufen machen sie etwa tausendmal größer. Ein dritter Transistor schaltet erst durch, wenn die Spitzen etwa 0,6 V überschreiten – ein Klatschen schafft das, Sprechen nicht. Er zieht den Trigger des 555 nach unten, und der 555 hält das Relais eine feste Zeit lang an.
