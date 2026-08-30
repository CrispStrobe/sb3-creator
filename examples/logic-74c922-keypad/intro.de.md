---
level: intermediate
age: 12+
prereqs: [languages-keypad-events, pc28-logic-interlock]
teaches: [matrix-keypad, keypad-encoder, binary-code, tri-state-output, data-available]
---

## Was du siehst

Eine 4×4-Matrixtastatur ist über acht echte Leitungen mit einem
74C922-Tastaturencoder verbunden. Die grüne **DA**-LED bedeutet „Daten
verfügbar“. Vier weitere LEDs zeigen **D C B A**, wobei A das niederwertigste
Bit ist. Es gibt keinen Mikrocontroller und keine versteckte Tastennummer:
Der Encoder erkennt den Tastendruck über die gezeichneten Zeilen- und
Spaltennetze.

## Probiere es aus

1. Klicke **Sim** und drücke Tasten in verschiedenen Zeilen.
2. DA leuchtet während des Tastendrucks und erlischt nach dem Loslassen.
3. Lies die LEDs als A/B/C/D. Position 0 ergibt `0000`, Position 5 `0101` und
   Position 15 `1111`.
4. Lösche die Leitung `kp1.r1`–`enc1.y2`. Die vier Tasten dieser Zeile werden
   nicht mehr erkannt; die übrigen Zeilen funktionieren weiter.
5. Verbinde die Leitung wieder, trenne `enc1.oeb` von Masse und lege sie an
   +5 V. DA meldet die Taste weiterhin, A–D treiben die LEDs aber nicht mehr:
   **/OE ist aktiv-low**.

## Was geschieht

Sechzehn Schalter benötigen in einer Matrix nur acht Leitungen. Der Encoder
zieht nacheinander jeweils eine X-Spalte auf Low. Eine gedrückte Taste verbindet
diese X-Leitung mit einer intern hochgezogenen Y-Zeile. Aus beiden Koordinaten
entsteht `Zeile × 4 + Spalte`, ausgegeben als D C B A; gleichzeitig wird DA High.

`enc1.oeb` liegt hier auf Masse und aktiviert A–D. Ein High-Pegel setzt die
Ausgänge nicht auf Low, sondern trennt sie elektrisch (Tri-State). DA bleibt
davon unberührt.

OSC und KBM bleiben in diesem Simulationsaufbau absichtlich offen. Die Engine
verwendet einen festen synchronen 8-kHz-Scan und behandelt einen Tastendruck als
bereits entprellt; sie erfindet keine RC-Verzögerung für die noch nicht
modellierten Kondensatoranschlüsse.

## Warum das wichtig ist

So wird aus einer Taste eine kompakte Zahl für einen Prozessor. Der Aufbau zeigt
außerdem, dass das Ergebnis wirklich von der Verdrahtung abhängt: Eine getrennte
Zeile oder Spalte lässt genau die zugehörigen Tasten verschwinden.

## Weiterforschen

- Vertausche A und B und sage voraus, welche Codes falsch werden.
- Ergänze Pull-down-Widerstände an A–D, deaktiviere /OE und miss die Leitungen.
- Verbinde DA und A–D mit einem Eingangsport und nutze DA als Lesesignal.
