# Rot und Grün mit rotem Licht unterscheiden

Eine rote LED beleuchtet eine Fläche, und ein Fototransistor daneben fängt auf, was zurückkommt. Eine rote Fläche wirft viel rotes Licht zurück, eine grüne kaum welches, und ein Transistor schaltet danach eine Anzeige.

**Vermittelt:** Reflexion und Farbe, warum ein Farbsensor das richtige Licht braucht

## Was zu tun ist

Klick auf **Sim**: Die Fläche ist rot, und die Anzeige leuchtet. Setz im Inspektor `surface` des Lichtwegs auf green, blue, black oder white. Stell dann die Farbe der LED auf ir und probiere Rot und Grün noch einmal.

## Was du sehen solltest

- Rote oder weiße Fläche: Anzeige an (auf Rot etwa 1,9 V am Messgerät).
- Grün, Blau oder Schwarz: Anzeige aus (auf Grün etwa 0,4 V).
- Mit der Infrarot-LED sehen Rot und Grün gleich aus.

## Warum es funktioniert

Eine Fläche sieht rot aus, weil sie rotes Licht zurückwirft und den Rest schluckt. Rotes Licht auf einer grünen Fläche wird größtenteils geschluckt. Infrarot, das wir nicht sehen, wird von roten und grünen Farbstoffen gleich gut zurückgeworfen und kann sie deshalb nicht unterscheiden.
