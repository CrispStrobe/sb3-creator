---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [parallel-circuit, branch-current, current-limiting-resistor]
---

## Was du siehst

Zwei LEDs, eine rote und eine grüne, beide gleich hell. Jede hat ihren eigenen
Widerstand über sich. In dieser Schaltung steckt kein Chip und kein Programm —
Strom rein, Licht an.

## Probier das aus

1. Klick auf **Sim**, um die Schaltung einzuschalten. Beide LEDs leuchten.
2. Fahr mit dem Finger die Leitungen ab, vom 5-V-Zeichen ganz oben. Der Weg
   teilt sich in zwei: Der eine führt über R1 zur roten LED, der andere über R2
   zur grünen. Beide enden unten bei Masse.
3. Miss die Spannung zwischen R1 und der roten LED. Da sollten ungefähr
   **2 V** stehen.
4. Öffne `circuit.json` und ändere `r2` von `1000` auf `4700` Ohm. Lass es noch
   einmal laufen. Die **grüne** LED wird dunkler. Die rote bleibt genau gleich.
5. Stell `r2` wieder auf `1000` zurück.

## Was dahintersteckt

Jede LED hat ihren eigenen Weg, und die beiden Wege kommen sich nicht in die
Quere. Genau das heißt **parallel**.

Nimm dir einen Weg vor. Die Stromversorgung drückt mit 5 V. Die LED verbraucht
allein schon etwa 2 V, einfach weil sie eine LED ist — sie nimmt sich immer
ungefähr gleich viel. Für den Widerstand bleiben also 3 V übrig. Ein Widerstand
mit 1000 Ohm, an dem 3 V anliegen, lässt 3 Volt ÷ 1000 Ohm = **0,003 Ampere**
durch. Dazu sagt man meistens **3 Milliampere**. Dieser Strom bringt die rote
LED zum Leuchten.

Und der andere Weg? Dieselben 5 V, dieselbe Sorte LED, derselbe Widerstand.
Also auch dieselben 3 Milliampere. Gleich hell. Die beiden Wege mussten nie
etwas teilen.

Und die Stromquelle? Die muss beide Wege gleichzeitig versorgen und schickt
deshalb insgesamt 3 + 3 = **6 Milliampere** los. Bei einer Parallelschaltung
zählt man die einzelnen Zweige zusammen, dann hat man den Gesamtstrom.

Deshalb wurde in Schritt 4 auch nur eine LED dunkler: Ein größerer R2 macht den
grünen Weg enger — der rote Weg hat davon gar nichts mitbekommen.

## Warum das wichtig ist

Alle Lampen bei dir zu Hause sind parallel geschaltet. Nur deshalb wird dein
Zimmer nicht dunkel, wenn jemand in der Küche das Licht ausmacht. Aus derselben
Regel folgt: Jede LED braucht ihren **eigenen** Widerstand, nicht einen
gemeinsamen für alle zusammen.

## Wie es weitergeht

- **Als Nächstes:** [35-series-resistors](../35-series-resistors) — was
  passiert, wenn sich Bauteile einen Weg teilen, statt jedes seinen eigenen zu
  haben.
- **Danach:** [22-series-parallel](../22-series-parallel) — die beiden
  Schaltungsarten direkt nebeneinander.
- **Auch schön:** [40-led-color-mix](../40-led-color-mix) — drei parallele
  Zweige mischen jede Farbe, die du willst.
- **Zum Ausprobieren:** Bau einen *dritten* Zweig ein — noch ein Widerstand mit
  1000 Ohm und noch eine LED, genau wie die anderen beiden verdrahtet. Rate den
  Gesamtstrom, bevor du es laufen lässt. (Tipp: 3 + 3 + 3.)
