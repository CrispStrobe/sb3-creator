# Der Verstärker als Schmitt-Trigger

Ein Audio-Verstärkerchip, dem ein wenig von seinem Ausgang an den eigenen Eingang zurückgegeben wird, verstärkt nicht mehr, sondern schaltet. Fahr den Eingang mit dem Knopf durch und schau aufs Voltmeter: Er schaltet bei einer Spannung ein und bei einer niedrigeren wieder aus.

**Vermittelt:** Schmitt-Trigger, Mitkopplung, Hysterese

## Was zu tun ist

Klick auf **Sim**. Dreh den EINGANG-Knopf (potentiometer_6) langsam auf und merk dir die Anzeige des Voltmeters (voltmeter_9), wenn die rote LED angeht. Dreh dann langsam zurück und merk dir die Anzeige, wenn die grüne LED wieder angeht.

## Was du sehen solltest

- Am Anfang: grüne LED an, rote aus.
- Beim Aufdrehen: Bei etwa 2,3 V geht die rote LED an und die grüne aus.
- Beim Zurückdrehen: Die rote LED bleibt bis etwa 1,6 V an, dann übernimmt wieder die grüne.

## Warum es funktioniert

Der Chip vergleicht seinen +-Eingang mit 1,2 V am −-Eingang. Der +-Eingang bekommt etwa die Hälfte der Knopfspannung und zusätzlich einen kleinen Anteil des Ausgangs. Solange der Ausgang niedrig ist, ist dieser Anteil klein, also muss der Knopf weit aufgedreht werden, bis die Schaltschwelle erreicht ist. Ist der Ausgang hoch, hilft sein Anteil mit, und der Knopf muss weit zurückgedreht werden, bevor der Ausgang wieder abfällt.
