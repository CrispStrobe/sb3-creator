---
level: advanced
age: 14+
prereqs: [pc40-opamp-threshold, pc02-voltage-divider]
teaches: [ldr, light-sensing, automatic-control]
---
## Was du siehst
Ein lichtabhängiger Widerstand (LDR), der einen Eingang eines Operationsverstärker-Komparators speist, mit einer festen Spannungsreferenz am anderen Eingang. Die LED schaltet sich ein oder aus, wenn die Lichtstärke die Schwelle überschreitet.

## Probier das
1. Klick auf **Sim** — im Dunkeln (hoher LDR-Widerstand) liegt die Messspannung unter der Referenz und die LED ist dunkel.
2. Erhöhe die Lichtstärke (verringere den LDR-Widerstand). Wenn die Messspannung die 2,5-V-Referenz überschreitet, geht der Ausgang des Operationsverstärkers auf High und die LED leuchtet.
3. Passe den Referenzteiler an, um die Schaltschwelle zu ändern.

## Was passiert hier
Der LDR und ein fester Widerstand bilden einen Spannungsteiler, dessen Ausgabe von der Lichtstärke abhängt. Im Dunkeln ist der Widerstand des LDR sehr hoch (hunderte kΩ), was die Messspannung nahe an Masse zieht. Bei hellem Licht fällt er auf wenige kΩ, und die Messspannung steigt Richtung Versorgung. Der Operationsverstärker vergleicht diese sich ändernde Spannung mit der festen 2,5-V-Referenz und schaltet seinen Ausgang scharf auf High oder Low — eine saubere digitale Entscheidung aus einem analogen Sensor.

## Warum das wichtig ist
Lichtgesteuerte Schaltungen werden in Straßenlaternen, Sicherheitssystemen, Kamera-Belichtungsmessern und der Industrieautomation eingesetzt. Das Muster LDR-plus-Komparator ist der einfachste Weg, eine physikalische Größe in ein Ja/Nein-Signal umzuwandeln, und dasselbe Muster funktioniert für Temperatur (Thermistor), Feuchtigkeit und viele andere Sensoren.

## Weiter geht's
- [pc40-opamp-threshold](../pc40-opamp-threshold) — der Komparator mit einem manuellen Poti statt eines Sensors.
- [pc33-thermistor-divider](../pc33-thermistor-divider) — ein Temperatursensor im Teiler.
- Experiment: Füge eine Hysterese mit einem Rückkopplungswiderstand vom Ausgang zum nichtinvertierenden Eingang hinzu und beobachte, wie sich die Schaltschwelle je nach aktuellem Zustand ändert.
