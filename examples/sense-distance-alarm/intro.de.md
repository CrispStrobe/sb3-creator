---
level: intermediate
age: 11+
prereqs: [01-blink, 14-traffic-light]
teaches: [sensors, timing, nested-if]
---
## Was du siehst
Drei LEDs zeigen, wie weit das nächste Hindernis entfernt ist: grün, wenn es weit weg ist, gelb, wenn es näher kommt, rot, wenn es sehr nah ist. Die gemessene Entfernung in Zentimetern läuft außerdem im seriellen Monitor durch. Verschiebe den Entfernungsregler des Ultraschallmoduls und beobachte, wie die Zonen wechseln.

## Probier das
1. Stelle die Entfernung auf 60 cm, dann 35 cm, dann 10 cm. Welche LED leuchtet jeweils?
2. Ändere die 20 und die 50 im Programm. Lass die rote Zone bei 30 cm beginnen.
3. Stelle die Entfernung auf 600 cm. Was gibt das Programm aus, und warum?

## Was dahintersteckt
Das Ultraschallmodul ist ein winziger Lautsprecher mit einem Mikrofon daneben. Wenn das Programm `distance from sonar` abfragt, schickt der Chip einen kurzen Impuls an den TRIG-Pin des Moduls. Das Modul antwortet mit einem Schallstoß, der viel zu hoch zum Hören ist, und hält dann seinen ECHO-Pin auf HIGH, bis das Echo zurückkommt. Schall legt etwa 343 Meter pro Sekunde zurück; hin und zurück zu einem Hindernis in 1 cm Entfernung dauert das 58 Mikrosekunden. Der Chip misst die Dauer des ECHO-Impulses und teilt durch 58 — das ist die Entfernung.

Wenn innerhalb von 30 Millisekunden kein Echo kommt (mehr als etwa 5 Meter), bekommt das Programm 999: „nichts in Reichweite“.

## Warum das wichtig ist
Einparkhilfen, Saugroboter und automatische Türen messen Entfernungen genau so. Aus einer Zeit eine Entfernung zu machen, findet man überall — bei Radar, beim Echolot auf Schiffen, sogar bei der Messung der Entfernung zum Mond mit einem Laser.

## Weiter geht's
- [14-traffic-light](../14-traffic-light) — dieselben drei Farben, aber von der Zeit gesteuert statt von der Entfernung.
- [sense-thermometer-1wire](../sense-thermometer-1wire) — ein weiterer Sensor, der in genau getimten Impulsen antwortet.
- Experiment: Füge einen Summer hinzu, der umso schneller piept, je näher das Hindernis ist.
