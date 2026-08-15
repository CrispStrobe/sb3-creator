---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor, pc36-series-interlock]
teaches: [relay, coil, isolation, switching-delay, normally-open-contact]
---

## Was du siehst

Links ein kleiner Schalter, in der Mitte ein Relais, rechts eine
Anzeige-LED. Schau dir die beiden Stromversorgungen genau an: Die Schalterseite
läuft mit 5 V, die LED-Seite hat ihre eigene 9-V-Quelle. Zwischen beiden Hälften
verläuft kein einziger Draht. Das Relais ist das Einzige, was sie verbindet —
und zwar mechanisch, nicht elektrisch.

## Probier das aus

1. Klick auf **Sim**. Nichts leuchtet: Der Relaiskontakt ist offen.
2. Schließe `sw1`. Die LED geht an — aber nicht sofort.
3. Beobachte `relay1.no` (den Kontakt), während du `sw1` umschaltest. Er springt
   zwischen etwa **2 V** (offen, kein Strom) und **9 V** (geschlossen).
4. Rechne die Spule nach: 5 V an 200 Ω sind **25 mA**. Mehr kostet es nicht,
   den 9-V-Zweig zu steuern.
5. Miss den LED-Zweig: **6,93 mA**, und die kommen aus der 9-V-Quelle — einer
   Quelle, mit der der Schalter überhaupt nicht verbunden ist.

## Was dahintersteckt

Ein Relais ist ein Schalter, den eine andere Schaltung für dich drückt. Strom
durch die Spule macht daraus einen Elektromagneten, der Magnet zieht einen
Metallhebel an, und der Hebel schließt einen Kontakt. Das ist alles.

Das entscheidende Wort heißt **galvanisch getrennt**. Spule und Kontakt teilen
sich nichts außer Luft und einem Stück Eisen. Deshalb kann die 5-V-Steuerseite
eine 9-V-Last schalten — und es funktionierte genauso, wenn auf der Lastseite
230 V Netzspannung lägen oder eine ganz andere Art von Strom. Dein Finger am
Schalter berührt die Last nie.

Die Verzögerung aus Schritt 2 ist echt und kein Simulationsfehler. Der Hebel hat
Masse, also braucht er etwa **5 ms** für seinen Weg. Miss bei 4 ms, und der
Kontakt ist noch offen; miss bei 6 ms, und er ist zu. Deshalb können Relais
nicht schnell schalten: 5 ms pro Vorgang heißt bestenfalls ein paar hundert
Schaltungen pro Sekunde, und jede davon ist ein echter Aufprall — Relais nutzen
sich ab. Transistoren erledigen dieselbe Aufgabe in Nanosekunden, können aber
nicht trennen.

Benutzt wird hier der **Schließer** (`no`, normally open): offen, solange die
Spule kalt ist, geschlossen, sobald sie Strom bekommt. Das Relais hat außerdem
einen Öffner, der es genau andersherum macht.

## Warum das wichtig ist

Genau so schaltet ein 3,3-V-Mikrocontroller eine Heizung, eine Pumpe oder das
Zimmerlicht. Am Stromnetz würde der Chip keine Sekunde überleben — also muss er
da auch gar nicht hin. Er gibt 25 mA für eine Spule aus, und die Spule
übernimmt den gefährlichen Teil.

## Wie es weitergeht

- **Als Nächstes:** [pc38-relay-changeover](../pc38-relay-changeover) — der
  andere Kontakt und wofür ein Umschalter gut ist.
- **Zum Vergleich:** [pc32-pnp-high-side](../pc32-pnp-high-side) — dieselbe Last
  mit einem Transistor geschaltet: schneller, lautlos und *nicht* getrennt.
- **Zum Ausprobieren:** Stell `switchTimeMs` von 5 auf 50 und miss den Kontakt
  bei 10 ms. Da hat sich noch nichts bewegt. In Relais-Datenblättern heißt diese
  Zahl "Ansprechzeit" und steht auf der ersten Seite.
