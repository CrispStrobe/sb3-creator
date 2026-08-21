---
level: intermediate
age: 12+
prereqs: [pc08-diode-polarity, pc34-polarity-protector]
teaches: [rectifier, bridge, diode-conduction-path, forward-voltage-drop, polarity]
---

## Was du siehst

Vier Dioden in einer Raute, einen Widerstand und eine LED. Fahr die Raute mit dem
Finger ab: Die beiden links zeigen *weg* vom linken Anschluss der Quelle, die
beiden rechts zeigen *zu ihm hin*. Nichts daran ist zufällig symmetrisch.

## Probier das aus

1. Klick auf **Sim**. Die LED leuchtet, mit **5,44 mA**.
2. Dreh die Quelle um — stell `volts` bei `src` von `9` auf `-9`.
3. Die LED leuchtet, mit **5,44 mA**. Genau gleich. Das ist der ganze Trick.
4. Miss jetzt in beiden Fällen die Anschlüsse der Quelle. Sie tauschen komplett:
   einmal +8,25 V und −0,75 V, einmal −0,75 V und +8,25 V.
5. Miss in beiden Fällen den Brückenausgang (`r1.a`): **7,49 V**, unverändert.

## Was dahintersteckt

Eine einzelne Diode bringt dich halb ans Ziel: Sie sperrt die falsche Polarität,
also liefert eine verkehrt angeschlossene Quelle gar nichts. Eine Brücke kann
mehr — sie *sortiert* die falsche Polarität in die richtige um, sodass nichts
verloren geht.

Verfolge den Strom, wenn der linke Anschluss positiv ist. Er kann nur durch die
Diode heraus, die von ihm wegzeigt, hinauf zur Spitze der Raute — das ist die
Plusseite des Ausgangs. Er läuft durch Widerstand und LED, kommt bei Masse an und
muss nun zurück zum anderen Anschluss der Quelle. Genau eine Diode zeigt in diese
Richtung. Zwei der vier Dioden führen den Strom, die anderen beiden liegen für
ihn verkehrt herum und bleiben zu.

Jetzt dreh die Quelle um. Der Strom startet auf der anderen Seite und nimmt aus
demselben Grund das *andere* Diodenpaar — aber sieh hin, wo er in die Last
eintritt: wieder an der Spitze der Raute, wieder hinunter durch die LED nach
Masse. Die Last kann nicht erkennen, welches Paar geliefert hat. Deshalb zeichnet
man die Brücke als Raute: Beide Diagonalen speisen dieselbe Ecke.

Der Preis steht in Schritt 5. Jeder Weg durch die Brücke führt über zwei Dioden,
und jede behält etwa 0,75 V für sich. Die Last bekommt also 9 − 1,5 = 7,5 V. Bei
9 V ist das ärgerlich, bei 5 V tut es weh, bei 230 V merkt es niemand.

Gib der Quelle statt einer umschaltbaren eine wechselnde Polarität, und die
Schaltung ist ein **Gleichrichter**: Der Eingang schwingt hin und her, der
Ausgang geht immer nur in eine Richtung. Ein Kondensator parallel zur Last
glättet die Wellen zu einer Gleichspannung — und genau das steckt in fast jedem
Netzteil, das du besitzt.

## Warum das wichtig ist

Netzstrom wechselt ständig die Richtung; fast jede Schaltung braucht genau das
nicht. Der Brückengleichrichter ist das Bauteil, das umsortiert, und er tut das
seit den 1920er-Jahren praktisch unverändert. Dieselben vier Dioden sitzen auch
an Gleichspannungseingängen, einfach damit es egal ist, wie herum du den Stecker
einsteckst.

## Wie es weitergeht

- **Vorher, falls noch nicht:** [pc08-diode-polarity](../pc08-diode-polarity) —
  eine Diode, eine Richtung.
- **Zum Vergleich:** [pc34-polarity-protector](../pc34-polarity-protector) — die
  Antwort mit einer Diode: falsch herum wird gesperrt statt genutzt.
- **Zum Vergleich:** [42-diode-rectifier](../42-diode-rectifier) — eine einfachere
  Gegenüberstellung von Dioden in Durchlass- und Sperrrichtung.
- **Zum Ausprobieren:** Lösche `d3` samt seinen zwei Drähten und dreh die Quelle
  noch einmal um. Die eine Polarität geht weiter, die andere hat ihren Weg
  verloren — und jetzt weißt du, welches Paar gearbeitet hat.
