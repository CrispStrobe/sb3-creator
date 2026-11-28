---
level: intermediate
age: 12+
prereqs: [lab-virtual-ground]
teaches: [voltage-follower, meter-loading, input-resistance, amplifier]
---
## Was du siehst
Zwei gleiche 220-kΩ-Widerstände in Reihe an der Batterie, ihre Mitte sollte also auf halber Betriebsspannung liegen. Ein Messinstrument, ein Schiebeschalter, der es entweder direkt an diese Mitte oder hinter einen Spannungsfolger mit Operationsverstärker legt, und eine zweite Verstärkerstufe mit zehnfacher Verstärkung und eigenem Instrument.

## Probier das
1. Klick auf **Sim**. Das Instrument hängt direkt am Teiler und zeigt nur etwa 2,3 V statt 4,5 V.
2. Leg den Schalter um: Jetzt sitzt das Instrument hinter dem Folger und zeigt etwa 4,2 V.
3. Sieh dir das zweite Instrument an: Ohne Eingangssignal zeigt die ×10-Stufe trotzdem etwa ein halbes Volt.
4. Halte **Tastspitze** gedrückt: Ein halbes Volt geht hinein, etwa 4,9 V kommen heraus.

## Was passiert hier
Ein Drehspulinstrument braucht Strom, um seinen Zeiger zu bewegen, also ist es selbst ein Widerstand, hier hundertzwanzig Kiloohm. Parallel zu den unteren 220 kΩ macht es diese Hälfte des Teilers kleiner und zieht die Spannung herunter: Das Messgerät verändert, was es misst. Der Spannungsfolger nimmt dem Teiler praktisch keinen Strom ab und kopiert seine Spannung an den Ausgang, der das Instrument mühelos versorgt. Eine kleine Diode im Eingang schützt ihn, falls die Messspitze falsch herum angeschlossen wird; sie kostet ein wenig Anzeige. Die zweite Stufe verstärkt zehnfach, so lassen sich kleine Spannungen auf derselben Skala ablesen. Die Eingänge des Operationsverstärkers brauchen einen winzigen Strom, etwa 47 nA; ohne angeschlossenes Signal fließt er durch den 1-MΩ-Eingangswiderstand, und die Stufe zeigt diese 48 mV zehnfach. Ein echter Messverstärker gleicht das mit einem Nullpoti ab.

## Weiter geht's
- [lab-virtual-ground](../lab-virtual-ground) — ein Folger hält eine Spannung unter Last fest.
- [lab-opamp-ammeter](../lab-opamp-ammeter) — der Operationsverstärker hilft dem Instrument, Strom zu messen.
