# Rauschen aus einem durchgebrochenen Übergang

Ein Transistor, rückwärts benutzt: Sein Basis-Emitter-Übergang wird über einen Widerstand falsch herum gespeist, bis er durchbricht. Der Strom, der dann fließt, ist nicht glatt, und zwei Verstärkerstufen machen aus seinem winzigen Zittern ein Rauschen im Ohrhörer.

**Vermittelt:** Sperrdurchbruch, Lawinenrauschen, kleine Signale verstärken

## Was zu tun ist

Klick auf **Sim** und hör in den Ohrhörer. Schau dir die Spannung am Emitter des Rauschtransistors an.

## Was du sehen solltest

- Der Emitter liegt bei etwa 7,5 V: der Durchbruchspannung des Übergangs. Durch den 47-kΩ-Widerstand fließen etwa 30 µA.
- Der Ohrhörer rauscht: kein Ton, nur Rauschen (die Anzeige des Ohrhörers sagt *noise*).

## Warum es funktioniert

Oberhalb seiner Durchbruchspannung leitet ein Übergang durch Lawinen: Ein Ladungsträger schlägt andere frei, die wieder andere freischlagen. Jede Lawine startet zu einem zufälligen Zeitpunkt und ist ein kleiner Ladungsstoß, darum ist der Strom ein schneller, zufälliger Strom aus Stößen. Am Übergang ist das ein Zittern von etwa einem Millivolt. Die erste Stufe verstärkt es etwa hundertfach, die zweite noch einmal, und der Ohrhörer macht aus der zufälligen Spannung ein Rauschen.
