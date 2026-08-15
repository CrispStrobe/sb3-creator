---
level: intermediate
age: 12+
prereqs: [pc13-direct-diode, pc08-diode-polarity]
teaches: [diode-or, back-feeding, redundant-supply, forward-drop]
---

## Was du siehst

Zwei 5-V-Versorgungen links, jede mit ihrer eigenen Diode, beide Dioden zeigen
in dieselbe Richtung auf eine gemeinsame Leitung. Von dort führen ein
1-kΩ-Widerstand und eine grüne LED nach Masse. Zwei Wege hinein, eine Last, und
die beiden Versorgungen berühren einander nie direkt.

## Probier das aus

1. Klick auf **Sim**. Die LED leuchtet, und am gemeinsamen Knoten stehen etwa
   **4,29 V** — 5 V minus die 0,71 V einer Diode.
2. Schalt **Quelle A** ab (auf 0 V) und lass es noch einmal laufen. Der
   LED-Strom geht von 2,266 mA auf **2,255 mA**. Ein halbes Prozent. Das würdest
   du nie bemerken.
3. Stell A zurück und schalt stattdessen **Quelle B** ab. Dasselbe: 2,255 mA.
4. Schalt **beide** ab. Jetzt steht der Knoten auf 0 V und der Strom auf 0 mA.
5. Und jetzt der spannende Fall: Stell Quelle A auf **9 V** und lass B bei 5 V.
   Der gemeinsame Knoten springt auf **8,24 V**. Schau nun die Diode von Quelle
   B an — 5 V an der Anode, 8,24 V an der Kathode. Sie zeigt bergauf, also
   sperrt sie.

## Was dahintersteckt

Eine Diode ist ein Einwegventil, und diese Schaltung sind zwei Ventile, die in
denselben Tank laufen.

Wer die höchste Spannung hat, darf den Tank füllen. Seine Diode ist in
Durchlassrichtung und leitet. Die andere Versorgung findet den gemeinsamen
Knoten nun *über* ihrer eigenen Spannung vor, und das drückt ihre Diode
rückwärts — und rückwärts tut eine Diode nichts. Sie klemmt sich selbst ab.

Deshalb hat Schritt 2 fast nichts verändert. Der Last war es egal, wer sie
speist. Und deshalb ist Schritt 5 wichtiger, als er aussieht: **Ohne die Dioden
würde die 9-V-Quelle Strom rückwärts in die 5-V-Quelle drücken.** Je nachdem,
was für Quellen das sind, reicht das von verschwenderisch bis gefährlich — eine
Batterie, die von einem Netzteil geladen wird, das nie zum Laden gedacht war,
ist ein wirklich beliebter Weg, ein Feuer anzufangen.

Solche Anordnungen heißen **Dioden-ODER**, weil die Last läuft, wenn Quelle A
*oder* Quelle B lebt. Es ist die billigste denkbare automatische Umschaltung:
kein Schalter, keine Logik, keine beweglichen Teile — und keine Lücke beim
Übergang, weil die zweite Diode in dem Moment zu leiten beginnt, in dem die
erste Versorgung unter sie absackt.

Die Rechnung sind diese 0,71 V. Jede Diode im Weg nimmt sich davon etwas, es
wird zu Wärme, und deshalb ersetzt man sie in echten Entwürfen manchmal durch
Schottky-Dioden (rund 0,3 V) oder durch Transistoren, die dieselbe Aufgabe für
fast nichts erledigen.

## Warum das wichtig ist

Jedes Gerät, das wahlweise am Netz oder an der eigenen Batterie läuft, hat das
irgendwo drin: Laptops, USV-Geräte, Alarmanlagen, alles mit einer Stützzelle für
die Uhr. Genauso jede Platine, an der du USB-Strom anstecken könntest, während
schon eine Batterie dranhängt — also die meisten Bastelboards, und das ist der
Grund für die kleine Diode neben der Strombuchse, über die sich Anfänger oft
wundern.

## Wie es weitergeht

- **Als Nächstes:** [pc61-diode-or](../pc61-diode-or) — dieselbe Idee, aber als
  Logikfunktion statt als Stromversorgung dargestellt.
- **Danach:** [pc38-relay-changeover](../pc38-relay-changeover) — der
  mechanische Weg zur selben Aufgabe, mit eigenen Vor- und Nachteilen.
- **Zum Ausprobieren:** Ersetz beide Dioden durch Schottky-Typen, indem du `vf`
  auf `0,3` setzt. Rate die neue Knotenspannung und den LED-Strom, bevor du es
  laufen lässt, und prüf dann nach. (Tipp: Die Last bekommt 0,4 V mehr, und der
  1-kΩ-Widerstand macht daraus den zusätzlichen Strom.)
