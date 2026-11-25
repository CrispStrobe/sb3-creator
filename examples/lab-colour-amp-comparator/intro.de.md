# Rot oder grün? Der LM386 als Farbvergleicher

Eine rote LED beleuchtet eine Fläche, und ein Fototransistor fängt auf, was zurückkommt. Ein LM386-Verstärkerchip, hier als Komparator benutzt, entscheidet zwischen Rot und Grün und lässt die passende LED leuchten.

**Vermittelt:** Reflexion und Farbe, der Komparator, ein Audioverstärkerchip als Schalter

## Was zu tun ist

Klick auf **Sim**: Die Fläche ist rot. Stell im Inspektor die `surface` des Lichtwegs auf green, dann white, dann black. Stell sie wieder auf red und zieh mit dem Regler des Lichtwegs die Fläche weiter weg.

## Was du sehen solltest

- Rote oder weiße Fläche: Die rote LED leuchtet.
- Grüne oder schwarze Fläche: Die grüne LED leuchtet.
- Rote Fläche weiter als etwa 2 cm entfernt: Die grüne LED leuchtet, weil zu wenig Licht zurückkommt.

## Warum es funktioniert

Eine rote Fläche wirft rotes Licht gut zurück, eine grüne schluckt das meiste davon. Der Fototransistor macht aus dem zurückgeworfenen Licht eine Spannung. Der LM386 vergleicht sie mit der Spannung vom Poti: Mit verbundenen Verstärkungs-Pins verstärkt er den Unterschied 200-fach, also springt sein Ausgang auf hoch oder tief. Hoch lässt die rote LED leuchten, tief lässt Strom von der Versorgung in den Ausgang fließen und die grüne leuchten.
