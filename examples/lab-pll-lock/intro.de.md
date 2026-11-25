# Eine Phasenregelschleife rastet auf einen Transistoroszillator ein

Eine Phasenregelschleife (PLL) lässt ihren eigenen Oszillator im Gleichtakt mit einem anderen laufen. Hier ist der andere ein Zwei-Transistor-Oszillator, den du mit einem Potentiometer stimmst; die PLL folgt ihm, und zwei LEDs zeigen, ob sie ihn eingefangen hat.

**Vermittelt:** Phasenregelschleifen, Steuern gegen Regeln, Fangbereich

## Was zu tun ist

Klick auf **Sim**. Fahr mit der Maus über den PLL-Baustein, um seine Frequenz zu sehen. Dreh das Stimm-Potentiometer langsam und beobachte die LEDs. Stell dann den Schiebeschalter auf Hand und dreh am Hand-Potentiometer.

## Was du sehen solltest

- Schleife geschlossen: Die Frequenz der PLL gleicht der des Oszillators (etwa 740 Hz im Aufbau), die grüne LED leuchtet.
- Oszillator zu tief gestimmt (unter 532 Hz): Die PLL kann nicht folgen, und die rote LED leuchtet.
- Hand: Die Frequenz der PLL hängt nur vom Hand-Potentiometer ab.

## Warum es funktioniert

Der Phasenvergleicher beobachtet die steigenden Flanken beider Signale. Kommt die Flanke des Eingangs zuerst, schiebt er die Steuerspannung hoch, kommt die eigene zuerst, zieht er sie herunter, und kommen beide gleichzeitig, tut er nichts. So endet die Schleife immer mit beiden Oszillatoren im Gleichtakt: Sie regelt, statt nur einzustellen. Liegt der Eingang außerhalb des Bereichs, den der Oszillator der PLL erreicht, schiebt der Vergleicher vergeblich, sein „im Takt“-Ausgang bleibt tief, und die rote LED leuchtet. Radios und Telefone rasten ihre Abstimmoszillatoren genauso ein.
