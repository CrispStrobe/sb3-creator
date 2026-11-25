# Infrarot-Reflexionsalarm

Eine Infrarot-LED blinkt tausendmal pro Sekunde; ein Fototransistor daneben wartet darauf, dass das Blinken von etwas davor zurückkommt. Ein Filter aus einem Operationsverstärker hört nur auf dieses Blinken, ein Speicher merkt sich den Alarm, und ein Verstärker-IC gibt ihn aus, bis du RESET drückst.

**Vermittelt:** moduliertes Licht, Bandpass, Gleichrichter, selbsthaltender Alarm

## Was zu tun ist

Klick auf **Sim**. Dreh den Abstandsknopf des Lichtwegs (light_path_48) langsam von 20 cm auf 3 cm und beobachte das Messgerät (analog_meter_25). Dreh ihn zurück auf 20 cm und halte RESET (button_31) einen Moment gedrückt. Probier auch, nur den Lichtregler des Fototransistors (phototransistor_14) hochzuziehen.

## Was du sehen solltest

- Die Anzeige steigt, je näher der Gegenstand kommt; bei etwa 3 cm leuchtet die ALARM-LED (led_34), und der Lautsprecher ertönt.
- Den Gegenstand wegzunehmen ändert nichts; RESET macht ihn still.
- Raumlicht allein löst nichts aus.

## Warum es funktioniert

Nur das zurückgeworfene IR blinkt mit der Frequenz des Senders, und der Bandpass lässt nur diese Frequenz durch; gleichmäßiges Licht ist für ihn ein konstanter Wert. Eine Diode macht aus dem gefilterten Blinken eine Spannung; überschreitet sie die Schwelle, schaltet der Komparator und hält sich selbst, und sein Ausgang gibt den Tongenerator frei.
