# Wie AM Musik überträgt

Ein Sender strahlt einen Träger bei etwa 600 kHz aus, dessen Stärke im Takt des Tons steigt und fällt. Hier spielt der Sender immer wieder eine kleine Melodie. Ein Detektorempfänger sucht den Sender heraus, und eine Germaniumdiode gewinnt die Stärke des Trägers zurück, und das ist die Musik, direkt in einen Kristallohrhörer: keine Batterie, der Sender selbst liefert die Leistung.

**Vermittelt:** Amplitudenmodulation, Hüllkurvengleichrichtung, Abstimmung

## Was zu tun ist

Klick auf **Sim** und hör in den Ohrhörer. Miss am oberen Ende des Schwingkreises und am Ausgang der Diode. Dreh dann den Abstimmknopf von 0,5 weg.

## Was du sehen solltest

- Die Melodie, Ton für Ton, im Ohrhörer (392, 330, 330, 349, 294, 294, 262 Hz und eine Pause).
- Am Ausgang der Diode steht eine Gleichspannung, auf der die Töne reiten: die Hüllkurve des Trägers.
- Vom Wert 0,5 weggedreht wird die Musik leiser: Der Schwingkreis lässt diesen Sender nicht mehr durch.

## Warum es funktioniert

Amplitudenmodulation heißt: Die Größe des Trägers folgt dem Ton. Laute Stellen machen ihn größer, leise kleiner. Die Diode lässt den Träger nur in einer Richtung durch und lädt den kleinen Kondensator auf seine Spitzen auf; die 47 kΩ entladen ihn schnell genug, um dem höchsten Ton zu folgen, aber nicht dem Träger selbst. Übrig bleibt der Ton, und der Kristallohrhörer macht daraus die Melodie.
