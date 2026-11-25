# Klatschschalter mit Transistor-Schmitt-Trigger

Ein Lautsprecher ist das Mikrofon, und ein LM386 verstärkt das Klatschen. Zwei Transistoren mit einem gemeinsamen Emitterwiderstand bilden einen Schmitt-Trigger, einen Schalter mit Gedächtnis: Ein Klatschen schaltet die rote LED ein, und sie bleibt an, bis du RESET drückst. Ein Drehregler bestimmt, wie laut das Klatschen sein muss.

**Vermittelt:** Lautsprecher als Mikrofon, emittergekoppelter Schmitt-Trigger, Hysterese als Speicher, Schwelle und Empfindlichkeit

## Was zu tun ist

Klick auf **Sim** und warte einen Moment. Schieb in der Instrumentenspalte den Regler **Schall** am Lautsprecher kurz auf 120 und zurück auf 0 (ein lautes Klatschen). Drück RESET. Probier 80 (Sprechen). Probier dann ein leiseres Klatschen (etwa 110), mit dem Poti THRESHOLD in der Mitte und weiter aufgedreht.

## Was du sehen solltest

- Sprechen: nichts. Lautes Klatschen: Die LED geht an und bleibt an.
- RESET schaltet sie aus.
- Weiter aufgedreht lässt das Poti THRESHOLD schon ein leiseres Klatschen schalten.

## Warum es funktioniert

Der Transistor, der gerade leitet, trägt den gemeinsamen Emitterstrom, und dieser Strom hebt die Emitter an: Q1 muss seine Basis über etwa 3,9 V bringen, um den Strom zu übernehmen, gibt ihn aber erst unter etwa 3,0 V wieder ab. Der Regler hält Q1s Basis zwischen diesen beiden Spannungen, also bleibt die Schaltung in dem Zustand, in dem sie gerade ist. Das verstärkte Klatschen stößt die Basis über die obere Schwelle; eine Diode lässt nur die Stöße nach oben durch. RESET zieht die Basis unter die untere Schwelle.
