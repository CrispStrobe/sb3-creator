---
level: advanced
age: 13+
prereqs: [lab-opamp-gain, pc02-voltage-divider]
teaches: [attenuator, voltage-divider, gain, clipping, headroom, audio]
---
## Was du siehst
Ein Tongenerator, der viel zu laut für seinen Verstärker ist, ein Teiler, der ihn tausendfach leiser macht, und ein Verstärker, dessen Verstärkung du wählst. Der Lautsprecher spielt entweder einen sauberen Ton oder ein raues, abgeschnittenes Brummen, je nachdem, wie du alles einstellst.

## Probier das
1. Starte die Simulation und sieh dir den Ausgang auf dem Oszilloskop an: ein kleiner, sauberer Sinus, etwa 0,4 V Spitze.
2. Schieb GAIN auf die 100-Ω-Seite. Zehnmal mehr Verstärkung: etwa 4 V Spitze, immer noch sauber, viel lauter.
3. Schieb GAIN zurück und schließ BYPASS. Jetzt trifft das volle 4-V-Signal auf einen Verstärker mit Verstärkung 101. Der Ausgang knallt an seine Grenzen, und aus dem Sinus wird ein Block mit flachen Kanten.
4. Berechne Teilerverhältnis und beide Verstärkungen aus den Widerstandswerten, bevor du hinschaust.

## Was dahintersteckt
Der Teiler lässt 220 Ω / 220,2 kΩ durch, etwa ein Tausendstel des Signals. Der Verstärker multipliziert dann mit 1 + R_f / R_g. Bleibt das Produkt innerhalb dessen, was die Versorgung liefern kann, ist der Ausgang eine treue, größere Kopie. Wenn nicht, bleibt der Operationsverstärker einfach an seiner Grenze stehen, und die fehlenden Spitzen hört man als Verzerrung. Jede Audiokette, vom Mikrofonvorverstärker bis zum Gitarrenverstärker, ist ein Spiel aus Abschwächen und Verstärken, damit dem Signal nie der Spielraum ausgeht.

## Weiter geht's
- [lab-opamp-gain](../lab-opamp-gain): der nichtinvertierende Verstärker mit ruhigem Eingang.
- [pc02-voltage-divider](../pc02-voltage-divider): der Teiler für sich.
