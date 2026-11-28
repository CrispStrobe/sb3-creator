# Geräusch startet den Motor: Verstärkerchip, Operationsverstärker und PNP-Schalter

Sprich (oder pfeif) den Lautsprecher an, und ein Motor läuft an; eine Sekunde nachdem du aufhörst, schaltet er ab. Der Lautsprecher ist das Mikrofon, ein LM386-Verstärkerchip und ein Operationsverstärker teilen sich die Verstärkung, und ein PNP-Transistor schaltet den Motor.

**Vermittelt:** Mikrofonverstärker, Verstärkung auf zwei Stufen verteilt, Hüllkurvengleichrichtung, Komparator mit Hysterese, PNP-Schalter an der Plusseite

## Was zu tun ist

Klick auf **Sim** und warte eine halbe Sekunde. Stell den Schall-Schieber des Lautsprechers (speaker_3) auf 70 dB, dann auf 85 dB, dann wieder auf Stille. Beobachte die RUN-LED (led_24) und den Motor (dc_motor_27). Probier danach THRESHOLD (potentiometer_21) aus.

## Was du sehen solltest

- Bei 70 dB passiert nichts: der Motor steht.
- Bei 85 dB leuchtet RUN nach wenigen Millisekunden, und der Motor läuft an.
- Wenn das Geräusch aufhört, läuft der Motor noch etwa eine Sekunde weiter, schaltet dann ab und läuft aus.
- THRESHOLD höher: es braucht ein lauteres Geräusch.

## Warum es funktioniert

Ein Lautsprecher als Mikrofon liefert nur einen Bruchteil eines Millivolts. Der LM386 verstärkt das 200-fach, der erste Operationsverstärker noch einmal 45-fach. Zwei Dioden pumpen den Ton in den ENVELOPE-Kondensator, den ein 1-MΩ-Widerstand in etwa einer Sekunde entlädt. Der zweite Operationsverstärker vergleicht die Hüllkurve mit THRESHOLD: ist sie höher, fällt sein Ausgang auf Masse und zieht Strom aus der Basis des PNP, durch die RUN-LED, und der PNP schaltet den Motor ein. Ist der Ausgang hoch, sperrt die LED den Basisstrom, und der PNP bleibt aus.
