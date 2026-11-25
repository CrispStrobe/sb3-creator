# Morsezeichen und Musik über einen Lichtleiter

Licht kann Töne tragen. Ein Transistor lässt die Helligkeit einer LED einem Signal folgen, ein Lichtleiter bringt das Licht weg, und am anderen Ende machen ein Fototransistor und ein Verstärkerchip daraus wieder Schall.

**Vermittelt:** Lichtmodulation, optische Signalübertragung, der Zwei-Transistor-Multivibrator als Tonquelle

## Was zu tun ist

Klick auf **Sim**. Drück den **Taster** kurz und lang: Das ist deine Morsetaste. Stell dann den **Schiebeschalter** auf den Musikspieler und hör zu. Öffne zum Schluss mit dem Regler des Lichtleiters den Luftspalt an seinem Ende.

## Was du sehen solltest

- Taste nicht gedrückt: Die LED leuchtet gleichmäßig, der Lautsprecher ist still.
- Taste gedrückt: ein Ton von etwa 680 Hz, so lange du drückst.
- Musik: Der Lautsprecher spielt die Melodie mit 440 Hz.
- Ein großer Luftspalt am Ende des Lichtleiters: Die Musik wird viel leiser.

## Warum es funktioniert

Der Transistor unter der LED lässt mehr Strom durch, wenn seine Basisspannung steigt, also wird die LED im Takt des Signals heller und dunkler. Der Ton aus dem Multivibrator schaltet sie ganz ein und aus, die Musik macht sie nur etwas heller und dunkler. Der Strom des Fototransistors folgt dem Licht, das ankommt, und der LM386 verstärkt diese kleinen Schwankungen für den Lautsprecher. Glasfaserkabel für Telefon und Internet übertragen Signale genauso, nur viel schneller.
