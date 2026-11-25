# Schwebung zwischen zwei verschiedenen Oszillatoren

Zwei ganz verschiedene Tongeneratoren – ein 555-Timer und ein zum Schwingen gebrachter Audioverstärker – spielen fast denselben Ton. Zusammen schwellen sie an und ab: eine Schwebung. Stimm sie näher zusammen, und die Schwebung wird langsamer.

**Vermittelt:** Schwebung, Differenzfrequenz, Überlagerung

## Was zu tun ist

Klick auf **Sim** und hör auf den Ohrhörer (earphone_19): ein flatternder Ton. Dreh STIMMEN (potentiometer_13) langsam von 0,35 Richtung 0,25 und hör, wie das Flattern langsamer wird.

## Was du sehen solltest

- Bei 0,35: der 555 bei etwa 460 Hz, der Verstärker-Oszillator bei etwa 513 Hz, ein Flattern von etwa 52 pro Sekunde.
- Beim Zurückdrehen wird das Flattern langsamer; bei etwa 0,26 sind beide Töne fast gleich, und das Anschwellen kommt nur noch ein paarmal pro Sekunde.

## Warum es funktioniert

Beide Rechteckschwingungen werden in einem Mischpunkt addiert. Sind sie gleichzeitig high und low, schwingt die Summe von ganz unten nach ganz oben: laut. Weil eine etwas schneller ist, läuft sie davon, bis beide entgegengesetzt sind – eine high, während die andere low ist – und die Summe bleibt in der Mitte: leise. Ein ganzes Davonlaufen dauert eins durch den Unterschied der beiden Frequenzen.
