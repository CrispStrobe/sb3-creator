---
level: beginner
age: 8+
prereqs: []
teaches: [ohms-law, led-basics, current-limiting]
---
## Was du siehst
Die einfachste mögliche Schaltung: eine Batterie (VCC), ein Widerstand und eine LED in Reihe gegen Masse geschaltet. Die LED leuchtet gleichmäßig. Kein Mikrocontroller, kein Code — nur Bauteile und Strom.

## Probier das
1. Starte die Simulation und beobachte, wie die LED leuchtet.
2. Erhöhe den Widerstandswert und sieh, wie die LED schwächer wird, weil weniger Strom fließt.
3. Entferne den Widerstand ganz und beobachte, was passiert — in einer echten Schaltung würde die LED durchbrennen.

## Was passiert hier
Strom fließt von VCC durch den Widerstand und die LED nach Masse. Der Widerstand begrenzt, wie viel Strom die LED erreicht — ohne ihn würde die volle Versorgungsspannung zu viel Strom treiben und die LED zerstören. Die Strommenge ergibt sich aus dem Ohmschen Gesetz: I = U / R. Eine typische LED braucht etwa 10-20 mA und hat einen Spannungsabfall von circa 2 V, also muss der Widerstand die restliche Spannung aufnehmen. Bei 5 V Versorgung und 2 V LED-Abfall ergibt ein 150-Ohm-Widerstand etwa 20 mA — genau im optimalen Bereich der LED.

## Warum das wichtig ist
Jede LED-Schaltung, die du jemals bauen wirst, enthält dieses Muster. Der Vorwiderstand ist nicht optional — er hält die LED am Leben. Das Ohmsche Gesetz und Spannungsabfälle zu verstehen, ist die Grundlage jeder Schaltungsentwicklung, von einer einzelnen LED bis zum Netzteil.

## Weiter geht's
- [22-series-parallel](../22-series-parallel) — sieh, was passiert, wenn man Widerstände auf verschiedene Arten kombiniert.
- [01-blink](../01-blink) — füge einen Mikrocontroller hinzu, um diese Schaltung ein- und auszuschalten.
- Experiment: Berechne den nötigen Widerstand für eine 3,3-V-Versorgung mit einer roten LED (2 V Abfall, 15 mA Zielstrom) und überprüfe es in der Simulation.
