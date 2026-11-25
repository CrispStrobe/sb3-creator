# Kabelsucher: Eine Spule hört Magnetfelder

Eine Drahtspule vor einem Verstärker hört jedes magnetische Wechselfeld in der Nähe: die 50 Hz eines Kabels, durch das Strom fließt, und das Streufeld der Spule in einem Telefon. So arbeiten Leitungssucher und Telefon-Abhörspulen.

**Vermittelt:** Induktion durch Wechselströme, der Strom (nicht die Spannung) erzeugt das Magnetfeld, wie schnell ein Feld mit dem Abstand abnimmt

## Was zu tun ist

Klick auf **Sim**. Jede Feldquelle hat einen kleinen Drehknopf (ihr Abstand zur Aufnahmespule, in cm). Dreh den Knopf des Kabels zur Spule hin und schalte dann mit dem Schiebeschalter die Lampe aus und wieder ein. Bring danach die Telefonspule in die Nähe. Das Potentiometer vor dem Verstärker ist die Lautstärke.

## Was du sehen solltest

- Beide Quellen weit weg: fast Stille.
- Das Kabel ganz nah, Lampe an: ein tiefes 50-Hz-Brummen. Lampe aus: Das Brummen ist weg, obwohl das Kabel noch angeschlossen ist.
- Die Telefonspule in der Nähe: ihr 800-Hz-Ton. Weiter weg wird er schnell leiser.

## Warum es funktioniert

Ein Strom erzeugt ein Magnetfeld um seinen Draht, ein Wechselstrom ein wechselndes. Eine Spule in einem sich ändernden Feld bekommt selbst eine Spannung (Induktion). Hier sind es einige hundert Mikrovolt, die der Transistor und der Verstärker-IC hörbar machen. Nur ein Strom erzeugt dieses Feld, deshalb bleibt ein Kabel ohne Verbraucher stumm. In einem zweiadrigen Kabel fließen Hin- und Rückstrom dicht nebeneinander, und ihre Felder heben sich fast auf. Darum hörst du das Kabel nur aus der Nähe.
