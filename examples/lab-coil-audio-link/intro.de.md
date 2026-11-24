# Ton durch zwei Wicklungen, und das Windungsverhältnis

Musik kann von einer Wicklung eines Transformators in die andere gelangen, ohne Draht dazwischen. Es kommt darauf an, wie herum man die Wicklungen anschließt: hinein in die Wicklung mit weniger Windungen und heraus aus der mit mehr, wird das Signal hochtransformiert; andersherum heruntertransformiert.

**Vermittelt:** Übertragung von Tonsignalen mit einem Transformator, Windungsverhältnis, galvanische Trennung

## Was zu tun ist

Klick auf **Sim** und hör zu. Der Generator steht für den Lautsprecherausgang eines Radios. Zwei gleiche Transformatoren werden auf die beiden Arten herum gespeist; der Schiebeschalter wählt, welcher den Verstärker speist. Schieb ihn von links nach rechts und zurück und leg das Oszilloskop an die Basis des Transistors.

## Was du sehen solltest

- Links (in die kleine Wicklung gespeist): laut; etwa 25 mV Spitze-Spitze am Eingang des Vorverstärkers, 3 V am Verstärkerausgang.
- Rechts (in die große Wicklung gespeist): etwa ein Viertel davon.

## Warum es funktioniert

Beide Wicklungen teilen sich ein Magnetfeld, deshalb bekommt jede Windung dieselbe Spannung. Die Wicklung mit doppelt so vielen Windungen hat also die doppelte Spannung. Klein hinein und groß heraus verdoppelt das Signal; groß hinein und klein heraus halbiert es: ein Faktor vier zwischen den beiden Stellungen. Transistor und Verstärkerchip verstärken dann beide gleich.
