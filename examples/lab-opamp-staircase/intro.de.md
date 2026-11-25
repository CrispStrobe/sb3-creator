# Eine Treppe aus Ladungspaketen

Ein Takt kippt bei jedem Schlag eine Kondensatorladung in einen Integrator aus einem Operationsverstärker: sein Ausgang steigt in gleichen Stufen. Oben leert ihn ein dritter Operationsverstärker, und die Treppe beginnt von vorn. Eine LED wird Stufe für Stufe heller.

**Vermittelt:** Ladungspumpe, Integrator, Rücksetzen durch einen Komparator

## Was zu tun ist

Klick auf **Sim** und beobachte ein paar Sekunden lang die grüne Takt-LED (led_10), die rote LED (led_24) und das Messgerät (analog_meter_25).

## Was du sehen solltest

- Bei jedem Blinken der grünen LED steigt die Anzeige um eine Stufe von 0,7 V, und die rote LED wird etwas heller.
- Nach der fünften Stufe fällt die Anzeige unter 1 V zurück, die rote LED geht aus, und der Aufstieg beginnt neu.

## Warum es funktioniert

Der Stufenkondensator wird auf den vollen Takthub geladen und dann über eine Diode in den Integrator entleert; jeder Takt übergibt so dieselbe Ladung. Der Integrator sammelt sie in seinem eigenen Kondensator, sein Ausgang steigt jedes Mal um gleich viel. Erreicht der Ausgang etwa 4,2 V, drückt ihn der dritte Operationsverstärker schnell wieder herunter.
