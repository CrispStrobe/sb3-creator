---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor, pc08-diode-polarity]
teaches: [inductance, flyback, freewheel-diode, back-emf, switch-arcing]
---

## Was du siehst

Eine 9-V-Quelle, ein Schalter und ein Motor. Das zusätzliche Bauteil in Reihe
zum Motor (`l1`) ist die Wicklung des Motors selbst — eine Spule aus Draht,
hier extra eingezeichnet, damit du sie sehen kannst. Die Diode quer über der
Last sieht falsch herum aus: Ihre Kathode zeigt zur Plusseite, sie leitet also
nie, solange der Motor läuft. Sie ist für einen einzigen Augenblick da.

## Probier das aus

1. Klick auf **Sim** und schließe `sw1`. Der Motor läuft, der geschaltete Knoten
   liegt auf **9 V**.
2. Öffne `sw1` und schau **sofort** hin — im Mikrosekundenbereich. Der Knoten
   fällt auf etwa **−9,7 V** und erholt sich wieder.
3. Lösche jetzt `d1` samt seinen zwei Drähten und wiederhole das. Wenn du jede
   Mikrosekunde misst, erreicht derselbe Knoten **−900 V**.
4. Miss noch einmal zehnmal schneller (alle 0,1 µs). Ohne Diode stehen da jetzt
   **−9000 V**. Mit Diode bleibt es bei etwa −9,7 V, egal wie schnell du
   hinsiehst.

## Was dahintersteckt

Eine Spule speichert Energie in einem Magnetfeld, und sie hasst es, wenn man
ihren Strom unterbricht. Strom in einer Spule verhält sich wie etwas Schweres,
das schon in Bewegung ist: Man kann es nicht schlagartig anhalten, und wenn man
es versucht, drückt es zurück — kräftig.

Wie kräftig, sagt `U = L × (Stromänderung) ÷ (Zeit dafür)`. Öffnet man einen
perfekten Schalter, ist die Zeit null, also geht die Spannung ins Unendliche.
Genau das zeigt Schritt 4: Misst du zehnmal schneller, erwischst du eine
zehnmal größere Spitze, weil das Modell keine Untergrenze hat. Auf einem echten
Tisch hört es dort auf, wo die Luft im Schalter durchschlägt und ein Funke den
Strom übernimmt. Dieser Funke frisst die Schaltkontakte auf — und dieselbe
Spitze zerstört den Transistor, wenn statt eines Schalters einer geschaltet hat.

Die Diode löst das, indem sie dem Strom einen erlaubten Heimweg gibt. Solange
der Motor läuft, ist sie in Sperrrichtung und tut nichts. In dem Moment, in dem
der Schalter öffnet, wird der Knoten negativ — und genau das schaltet die Diode
ein. Jetzt hat der Strom einen Kreis: durch die Spule, durch den Motor, durch
die Diode und zurück. Er läuft im Bruchteil einer Millisekunde aus, und die
Spannung kommt nie über etwa eine Diodenspannung unter Masse hinaus.

Deshalb heißt sie **Freilaufdiode**: Sie lässt die Spule ausrollen, statt sie
gegen die Wand fahren zu lassen.

## Warum das wichtig ist

Jeder Motor, jede Relaisspule, jeder Hubmagnet bekommt so eine Diode. Ein
Bauteil, fast umsonst, und sie wegzulassen ist der Klassiker unter den Arten,
eine Motoransteuerung zu zerstören — nicht sofort, sondern beim zehnten oder
hundertsten Ausschalten. Genau das macht den Fehler so scheußlich zu finden.

## Wie es weitergeht

- **Verwandt:** [pc56-inductor-freewheel](../pc56-inductor-freewheel) —
  derselbe Effekt mit einer nackten Spule, ohne Motor dazwischen.
- **Zum Vergleich:** [33-inductive-no-flyback](../33-inductive-no-flyback) —
  dieselbe Lektion, erzählt über eine Transistorstufe.
- **Zum Ausprobieren:** Dreh die Diode um (vertausche `anode` und `cathode` in
  `circuit.json`) und mach Schritt 1. Jetzt leitet sie quer über die Quelle,
  solange der Schalter zu ist — ein Kurzschluss. Falsch herum ist eben nicht
  "einfach nutzlos", sondern schlimmer als gar keine.

**Hinweis:** Der Wert von `l1` lässt sich derzeit nicht verstellen — die Engine
liest den Induktivitätsparameter unter einer anderen Schreibweise, als die
Beispiele ihn angeben. Es bleibt also bei 1 mH, egal was dort steht. Der
Vergleich oben funktioniert trotzdem, weil beide Seiten denselben Wert benutzen.
