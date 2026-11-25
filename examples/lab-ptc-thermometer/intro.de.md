# Ein Thermometer für 15 bis 25 °C über die ganze Skala

Eine normale Thermometerskala reicht vom Gefrieren bis zum Sieden. Diese umfasst nur zehn Grad, 15 bis 25 °C, über die ganze Skala, so dass du Zehntelgrade ablesen kannst. Der Trick: Erst den 15-Grad-Wert abziehen und dann den Rest verstärken.

**Vermittelt:** Offset und Verstärkung, gespreizte Skalen, Eigenerwärmung von Fühlern

## Was zu tun ist

Klick auf **Sim**. Nimm den Regler **Temperatur** des Fühlers in der Instrumentenspalte und stell 15, 20 und 25 °C ein. Warte bei jeder Einstellung ein paar Sekunden und lies das Messgerät ab. Das Offset-Potentiometer verschiebt den Nullpunkt der Skala.

## Was du sehen solltest

- 15 °C: Der Zeiger nahe 0.
- 20 °C: etwa 2,3 V, die Hälfte.
- 25 °C: etwa 4,5 V, fast Vollausschlag.
- Direkt nach einer Änderung bewegt sich der Zeiger noch ein paar Sekunden, bevor er stillsteht.

## Warum es funktioniert

Die Spannung des Fühlers ändert sich nur um etwa 12 mV pro Grad und sitzt auf fast 2 V. Das gepufferte Potentiometer liefert eine Spannung gleich dem 15-Grad-Wert, der Verstärker zieht sie ab und multipliziert den Rest mit 36. Der Fühler erwärmt sich durch den Strom, der durch ihn fließt, auch selbst ein wenig. Deshalb wandert die Anzeige nach dem Einschalten noch etwas nach oben.
