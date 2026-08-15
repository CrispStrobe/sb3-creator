---
level: intermediate
age: 12+
prereqs: [pc14-mini-led, pc05-npn-switch]
teaches: [npn-switch, base-current, current-gain, saturation]
---

## Was du siehst

Ein Mini-Steckbrett mit vier Bauteilen: Ein 10-kΩ-Widerstand führt zur Basis
eines NPN-Transistors, und ein 470-Ω-Widerstand mit einer roten LED bildet die
Last über dem Kollektor. Der Transistor überspannt gleich drei Spalten —
Emitter in Spalte 7, Basis in Spalte 8, Kollektor in Spalte 9 — genau so, wie
ein TO-92-Transistor auf einem echten Brett sitzt.

## Probier das aus

1. Verfolge die zwei Wege ab Spalte 2, wo die Plusleitung ankommt. Der eine
   führt über den 10-kΩ-Widerstand nach Spalte 8 — das ist die **Basis**. Der
   andere geht über den 470-Ω-Widerstand und die LED hinunter nach Spalte 9 —
   das ist der **Kollektor**.
2. Miss die Basisspannung (Spalte 8). Etwa **0,70 V**, und sie bleibt bei rund
   0,70 V, egal was du mit dem Rest der Schaltung anstellst.
3. Rechne den Basisstrom selbst aus: Am Widerstand liegen 5 − 0,70 = 4,3 V, also
   4,3 ÷ 10 000 = **0,43 mA**.
4. Ändere den Basiswiderstand in `circuit.json` von 10 kΩ auf 100 kΩ. Die
   Basisspannung bewegt sich kaum — immer noch etwa 0,7 V — aber der
   Basis*strom* fällt auf rund 43 µA, ein Zehntel des vorherigen Werts.

## Was dahintersteckt

Ein Bipolartransistor verstärkt Strom. Was immer du in die Basis hineinschickst,
er versucht das **β-Fache davon** durch den Kollektor zu ziehen. β ist hier 100,
0,43 mA in die Basis heißt also: Der Transistor verlangt 43 mA am Kollektor.

Die bekommt er nicht. Schau, was der Kollektorzweig überhaupt liefern kann:
5 V hinein, rund 2 V frisst die LED, und etwa 0,2 V bleiben am durchgesteuerten
Transistor selbst hängen. Für den 470-Ω-Widerstand bleiben also ungefähr 2,8 V,
das sind **rund 6 mA** — und mehr wird daraus nicht, so laut er auch verlangt.

Dieser Widerspruch ist kein Fehler, sondern der ganze Sinn der Sache. Wird von
einem Transistor mehr Strom verlangt, als die Schaltung hergibt, hört er auf,
sich wie ein Verstärker zu benehmen, und wird zum **geschlossenen Schalter**:
Der Kollektor klebt etwa 0,2 V über dem Emitter, und der Strom wird allein vom
Lastwiderstand bestimmt. Fachleute nennen das **Sättigung**, und genau darauf
legt man es an, wenn ein Transistor sauber schalten und nicht verstärken soll.

Daraus folgt die Faustregel: Zum Schalten gibt man der Basis viel mehr Strom,
als β allein verlangen würde. 43 mA zu verlangen, um 6 mA zu bekommen, ist ein
Faktor sieben Reserve — und diese Reserve hält den Schalter auch dann sicher
durchgesteuert, wenn β von Exemplar zu Exemplar schwankt. Und das tut es
kräftig, manchmal um das Dreifache zwischen zwei Transistoren aus derselben
Tüte.

## Warum das wichtig ist

Jeder Relaistreiber, jeder Motortreiber, jede LED, für die ein
Mikrocontroller-Pin allein zu schwach ist, ist diese Schaltung. Der Pin liefert
einen Bruchteil eines Milliampere in den Basiswiderstand, und der Transistor
liefert die Ampere.

## Wie es weitergeht

- **Als Nächstes:** [pc23-transistor-switch](../pc23-transistor-switch) —
  derselbe Schalter mit einem Taster im Basiszweig, damit du ihn ein- und
  ausschalten kannst.
- **Danach:** [pc24-light-gate](../pc24-light-gate) — die Basis wird von einem
  Lichtsensor angesteuert statt von einem Widerstand.
- **Zum Ausprobieren:** Rate, was bei 1 MΩ Basiswiderstand passiert. Der
  Basisstrom wird 4,3 µA, der Transistor verlangt also 0,43 mA — *weniger*, als
  die Last mit 6 mA hergeben könnte. Er verlässt die Sättigung, und die LED
  wird dunkler. Das ist die Grenze zwischen "Schalter" und "Verstärker", und du
  kannst sie von Hand ausrechnen.
