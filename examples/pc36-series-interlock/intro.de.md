---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [series-circuit, and-logic, interlock, complete-circuit]
---

## Was du siehst

Zwei Schalter, einer hinter dem anderen, dann einen Widerstand und eine LED.
Alles hängt an einer einzigen Drahtschleife. Kein Chip, nichts zu programmieren.

## Probier das aus

1. Klick auf **Sim**. Beide Schalter sind offen, die LED ist aus.
2. Schließ nur `sw1`. Immer noch aus.
3. Schließ stattdessen nur `sw2`. Immer noch aus.
4. Schließ beide. **Jetzt** leuchtet sie, mit 2,97 mA.
5. Öffne bei beiden geschlossenen Schaltern irgendeinen davon. Sie geht sofort
   aus — egal, welchen du nimmst.

## Was dahintersteckt

Strom muss immer den ganzen Weg herum. Er verlässt die Quelle, läuft durch den
ersten Schalter, den zweiten Schalter, den Widerstand und die LED und kommt
zurück. Jedes einzelne dieser Teile muss geschlossen sein, damit die Runde
zustande kommt. Eine Lücke irgendwo, und die ganze Schleife steht still — nicht
nur der Teil hinter der Lücke, sondern die *ganze*.

Deshalb funktioniert Schritt 5 mit jedem der beiden Schalter. Es gibt nur einen
Weg, also gibt es auch nur eines zu unterbrechen, und beide Schalter stehen
darauf.

Damit hast du die Regel "**dies UND das**" aus nichts als Draht gebaut. Zwei
Schalter hintereinander heißt: Beide müssen geschlossen sein. Das ist das
einfachste Logikgatter überhaupt, und es braucht weder eigene Stromversorgung
noch Chip noch Code.

Sieh dir ruhig die Zahlen aus Schritt 4 an: Bei beiden geschlossenen Schaltern
kommen die vollen 5 V am Widerstand an, ganz so, als wären die Schalter einfache
Drahtstücke. Genau das ist ein geschlossener Schalter — ein Stück Draht, das man
wegnehmen kann.

## Warum das wichtig ist

Echte Maschinen sind absichtlich so verdrahtet, und zwar aus Sicherheitsgründen,
nicht aus Bequemlichkeit. Eine Industriepresse läuft nur, wenn beide Handtaster
gedrückt sind — dann sind beide Hände nachweislich woanders als unter der Presse.
Eine Mikrowelle braucht die eingerastete Tür *und* die gedrückte Starttaste. So
eine Kette heißt **Verriegelung**, und man baut sie oft bewusst aus einfachen
Schaltern in Reihe statt aus Software, weil ein Draht nicht abstürzen kann.

## Wie es weitergeht

- **Als Nächstes:** [pc28-logic-interlock](../pc28-logic-interlock) — dieselbe
  UND-Regel mit einem Logikchip gebaut, und warum man das überhaupt täte.
- **Zum Vergleich:** [pc42-parallel-paths](../pc42-parallel-paths) — zwei
  Schalter nebeneinander statt hintereinander: Aus UND wird ODER.
- **Zum Ausprobieren:** Häng einen dritten Schalter in die Kette. Rate vorher,
  wie viele der acht möglichen Kombinationen die LED zum Leuchten bringen.
  (Es ist genau eine.)
