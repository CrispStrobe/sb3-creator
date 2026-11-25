---
level: intermediate
age: 10+
prereqs: [lab-heat-alarm]
teaches: [transistor, temperature, bias]
---
## Was du siehst
Zwei Transistoren und eine grüne LED. Der linke Transistor ist selbst der Wärmefühler: Er steht auf seinen Beinchen, und sein Regler **Temperatur** stellt ein, was ihn umgibt (Eis, Zimmer, Finger, heiße Luft). Ein kleiner Trimmer stellt den Schaltpunkt ein.

## Probier das
1. Klick auf **Sim**. Bei Zimmertemperatur leuchtet die grüne LED.
2. Stell die Temperatur auf Finger (etwa 33 °C): Die LED wird dunkler.
3. Stell sie auf heiß (ein Föhn): Nach ein, zwei Sekunden geht die LED aus: Alarm.
4. Stell sie auf Eis: Die LED leuchtet wieder hell.
5. Dreh den Trimmer zum anderen Ende und wärme wieder: Jetzt braucht es mehr Wärme, bis die LED dunkler wird.

## Was passiert hier
Die Basis des linken Transistors wird knapp unter der Spannung gehalten, bei der er zu leiten beginnt. Ein Silizium-Übergang braucht pro Grad Erwärmung etwa 2 mV weniger; wird der Transistor warm, treibt dieselbe Basisspannung viel mehr Strom durch ihn, etwa zehnmal so viel pro 30 °C. Diesen Strom nimmt er der Basis des rechten Transistors weg, der die LED betreibt. Warm: Der rechte bekommt weniger, die LED wird dunkler; kühl: Er bekommt ihn zurück. Der Trimmer verschiebt die Basisspannung des linken Transistors und damit die Temperatur, bei der das passiert.

## Weiter geht's
- [lab-heat-alarm](../lab-heat-alarm) — derselbe Alarm mit einem wärmeabhängigen Widerstand.
