# Ein blanker Draht empfängt einen Sender

Derselbe Verstärker mit hoher Verstärkung wie beim Brummsucher — ein LM386 mit 200-facher Verstärkung und ein Lautsprecher — mit 30 cm blankem Draht am Eingang. In der Nähe eines starken Mittelwellensenders spielt der Lautsprecher den Sender. Es gibt keinen Schwingkreis und keine Diode: Der Eingangstransistor des Verstärkers selbst richtet gleich.

**Vermittelt:** HF-Einstrahlung, jede Sperrschicht ist ein Gleichrichter, warum Audioverstärker HF-Filter brauchen

## Was zu tun ist

Klick auf **Sim** und hör zu. Wähle dann den Draht (das Antennen-Bauteil) und senke die Feldstärke des Senders in seinem Parameter `stations` von 0,1 auf 0,01 V/m.

## Was du sehen solltest

- Bei 0,1 V/m: der 400-Hz-Ton des Senders, laut.
- Bei 0,01 V/m: fast nichts. Ein Zehntel der Feldstärke gibt weit weniger als ein Zehntel des Tons.

## Warum es funktioniert

Der Draht fängt einige zehn Millivolt des 1-MHz-Signals des Senders auf. Das liegt weit über dem, wofür der Verstärker gedacht ist — aber sein Eingang ist die Basis eines Transistors, eine Sperrschicht, und eine Sperrschicht richtet gleich: Der mittlere Strom durch sie folgt der Größe der HF-Schwingung, und bei einem AM-Sender ist diese Größe das Programm. Der Verstärker verstärkt dann das Programm wie jeden anderen Ton. Bei kleinen Signalen richtet eine Sperrschicht quadratisch gleich, deshalb verschwindet ein schwacher Sender. Echte Verstärker in Sendernähe bekommen einen kleinen Kondensator am Eingang, um genau das zu verhindern.
