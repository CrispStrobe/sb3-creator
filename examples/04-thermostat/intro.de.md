---
level: intermediate
age: 12+
prereqs: [03-night-light]
teaches: [thermistor, hysteresis, control-loop]
---
## Was du siehst
Eine „Heizungs"-LED schaltet ein, wenn die Temperatur unter einen unteren Schwellwert fällt, und aus, wenn sie über einen oberen Schwellwert steigt. Ein NTC-Thermistor im Spannungsteiler speist den ADC, und der Abstand zwischen den beiden Schwellwerten verhindert, dass die Heizung an der Grenze flackert. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und verändere den Thermistor-Wert. Die Heizungs-LED geht bei Kälte an und bei Wärme aus.
2. Beachte: Die Heizung schaltet nicht bei derselben Temperatur aus, bei der sie eingeschaltet hat — es gibt eine Lücke. Das ist Hysterese.
3. Vergrößere oder verkleinere das Hysterese-Band im Code und beobachte, wie sich das Schaltverhalten ändert.

## Was passiert hier
Der Widerstand eines NTC-Thermistors sinkt bei steigender Temperatur. Im Spannungsteiler ergibt das einen höheren ADC-Wert bei Wärme und einen niedrigeren bei Kälte. Ein einfacher Schwellwert würde die Heizung nahe dem Sollwert schnell ein- und ausschalten. Hysterese löst das: Das Programm nutzt zwei Schwellwerte — einen niedrigeren zum Einschalten und einen höheren zum Ausschalten. Zwischen diesen Werten bleibt die Heizung in ihrem aktuellen Zustand. Dieses Totband eliminiert Flattern.

## Warum das wichtig ist
Jeder Thermostat, Kühlschrank und jede Klimaanlage nutzt Hysterese. Ohne sie würde ein Relais oder Kompressor hundertfach pro Minute nahe dem Sollwert schalten, Energie verschwenden und die Hardware zerstören. Dieses Muster gilt für jeden Ein/Aus-Regler, nicht nur für Temperatur.

## Weiter geht's
- [03-night-light](../03-night-light) — die einfachere Version ohne Hysterese zum Vergleich.
- [10-motor-speed](../10-motor-speed) — proportionale analoge Steuerung statt Ein/Aus.
- Experiment: Füge eine zweite LED hinzu, die blinkt, wenn die Temperatur innerhalb des Hysterese-Bandes liegt, um die „Totzone" zu zeigen.
