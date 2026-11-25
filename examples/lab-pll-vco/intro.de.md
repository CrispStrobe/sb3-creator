# Der PLL-Baustein als spannungsgesteuerter Oszillator

Ein PLL-Baustein enthält einen Oszillator, dessen Tonhöhe du mit einer Spannung einstellst. Hier wird er allein benutzt: Ein Potentiometer liefert die Spannung, ein Transistor treibt den Lautsprecher.

**Vermittelt:** der spannungsgesteuerte Oszillator, der PLL-Baustein 4046

## Was zu tun ist

Klick auf **Sim** und hör zu. Dreh das Potentiometer langsam von einem Ende zum anderen. Fahr mit der Maus über den PLL-Baustein, um seine Frequenz zu sehen.

## Was du sehen solltest

- Am unteren Ende ein tiefes Brummen von etwa 110 Hz.
- Am oberen Ende etwa 1,2 kHz.
- Dazwischen steigt die Tonhöhe gleichmäßig mit der Spannung, etwa 118 Hz pro Volt.

## Warum es funktioniert

Im Baustein lädt ein Strom den Kondensator C1, bis er die halbe Betriebsspannung erreicht, dann wird der Kondensator umgedreht und in die andere Richtung geladen, und der Ausgang kippt jedes Mal. Die Steuerspannung an VCO_IN legt diesen Strom über R1 fest: mehr Spannung, mehr Strom, schnelleres Laden, höherer Ton. Der Widerstand R2 liefert einen festen Zusatzstrom, so dass der Oszillator auch bei 0 V noch auf seinem tiefsten Ton läuft.
