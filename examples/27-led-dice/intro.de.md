---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [random, led-pattern, button-trigger]
---

## Was du siehst

Sieben LEDs sind im klassischen Wuerfelmuster angeordnet. Wenn du den Taster
drueckst, wechseln sie kurz schnell durch verschiedene Muster und bleiben dann
auf einer zufaelligen Zahl von 1 bis 6 stehen, wobei die LEDs leuchten, die zu
dieser Wuerfelseite gehoeren.

## Probier das aus

1. Klick auf **Sim** und drueck den Taster. Beobachte, wie die LEDs auf einem
   Wuerfelbild stehen bleiben.
2. Drueck mehrmals. Jedes Ergebnis sollte wie eine echte Wuerfelseite
   aussehen -- ein Punkt in der Mitte fuer 1, zwei Ecken fuer 2, und so
   weiter bis sechs.
3. Zaehle, wie oft jede Zahl bei 20 Druecken vorkommt. Es sollte ungefaehr
   gleichmaessig verteilt sein, auch wenn 20 Wuerfe zu wenig sind, um das zu
   beweisen.

## Was passiert hier

Der MCU hat eine Tabelle mit sieben LED-Zustaenden fuer jede der sechs Seiten.
Beim Tastendruck waehlt er eine Zufallszahl zwischen 1 und 6, schlaegt die
passende Zeile in der Tabelle nach und schaltet jede LED entsprechend ein oder
aus. Die kurze Wechselanimation vor dem Ergebnis entsteht, weil der MCU alle
paar Millisekunden eine neue Zufallszahl waehlt, solange der Taster gedrueckt
ist -- das erweckt den Eindruck des Wuerfelns. Die Zufaelligkeit stammt von
einem Timer oder Zaehler im Hintergrund, dessen Wert im genauen Moment des
Loslassens unvorhersehbar genug ist, um fair zu wirken.

## Warum das wichtig ist

Eine Zahl auf ein Muster abzubilden ist die einfachste Form einer
Nachschlagetabelle, und Nachschlagetabellen stecken ueberall in eingebetteten
Systemen: Zeichensaetze, Sinuswellen, Fehlercodes und Pin-Konfigurationen sind
alle nur eine Zahl, die eine Datenzeile auswaehlt.

## Weiter geht's

- **Woher die LED-Grundlagen kommen:** [01-blink](../01-blink) -- eine einzelne
  LED ein- und ausschalten.
- **Noch ein Zufallsprojekt:**
  [25-reaction-timer](../25-reaction-timer) -- zufaellige Verzoegerungen fuer
  Messungen statt Anzeige.
- **Zum Ausprobieren:** Fuege eine siebte Seite hinzu, bei der alle sieben LEDs
  leuchten, als spezieller „Lucky 7"-Wurf. Du musst den Zufallsbereich von 1--6
  auf 1--7 aendern und eine weitere Zeile in die Mustertabelle einfuegen.
