# Radio mit HF-Stufe und Transistor-Demodulator

**Vermittelt:** HF-Verstärker, Demodulator, Emitterfolger

## Was zu tun ist

Klick auf **Sim** und hör in den Ohrhörer (earphone_20): der Sender auf 612 kHz. Schieb DEMODULATOR (slide_switch_15) nach rechts, um von der Diode auf den Transistor-Demodulator umzuschalten. Dreh die Abstimmung (tuning_cap_7), um den anderen Sender zu finden.

## Was du sehen solltest

- Dioden-Demodulator: der 400-Hz-Sender, leise.
- Transistor-Demodulator: derselbe Sender, viel lauter.
- Abstimmung bei etwa 0,27: ein Sender mit 600 Hz.

## Warum es funktioniert

Der erste Transistor verstärkt die Radiowelle selbst, bevor irgendetwas anderes passiert. Ein Demodulator schneidet dann eine Hälfte der Welle ab, sodass das Programm übrig bleibt. Eine Diode tut genau das; ein Transistor als Emitterfolger tut es mit seinem Basis-Emitter-Übergang und verstärkt dabei noch den Strom, also bekommt der Ohrhörer viel mehr ab.
