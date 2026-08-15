---
level: intermediate
age: 12+
prereqs: [38-npn-switch]
teaches: [darlington, high-gain, buzzer-drive]
---
## Was du siehst
Ein Taster treibt einen Summer ueber ein Darlington-Paar — zwei NPN-Transistoren gestapelt, sodass der Emitter des ersten die Basis des zweiten speist. Der winzige Strom vom Taster wird zweimal verstaerkt und liefert genug Strom, um den Summer laut anzutreiben. Ein einzelner Transistor koennte Schwierigkeiten haben; das Darlington-Paar macht es einfach.

## Probier das
1. Druecke den Taster und hoere, wie der Summer anspringt — das Darlington-Paar liefert genug Verstaerkung.
2. Ersetze das Darlington-Paar durch einen einzelnen Transistor und beobachte, ob der Summer noch toent (er koennte schwaecher oder stumm sein).
3. Miss den Spannungsabfall ueber dem Darlington-Paar im eingeschalteten Zustand — er sollte etwa 1,2-1,4 V betragen, ungefaehr doppelt so viel wie bei einem einzelnen Transistor.

## Was passiert hier
Ein Darlington-Paar multipliziert die Stromverstaerkung zweier Transistoren. Wenn jeder Transistor eine Verstaerkung von 100 hat, hat das Paar eine Verstaerkung von etwa 10.000. Das bedeutet, ein Basisstrom von nur wenigen Mikroampere kann Hunderte von Milliampere am Kollektor schalten. Der Nachteil ist eine hoehere Saettigungsspannung (etwa 1,2 V statt 0,2 V), die mehr Leistung als Waerme verschwendet. Darlington-Paare werden haeufig als einzelne Bauteile (wie der TIP120) zum Antreiben von Motoren, Magnetventilen und Summern verpackt.

## Warum das wichtig ist
Viele Lasten brauchen mehr Strom, als ein Mikrocontroller-Pin oder eine einzelne Transistorstufe liefern kann. Die Darlington-Konfiguration loest das ohne separaten Treiber-IC und ist ein Grundbaustein der Hobby-Elektronik.

## Weiter geht's
- [54-motor-driver](../54-motor-driver) — sieh einen dedizierten H-Bruecken-IC fuer bidirektionale Motorsteuerung.
- [38-npn-switch](../38-npn-switch) — wiederhole den Einzeltransistor-Schalter, auf dem dieses Beispiel aufbaut.
- Experiment: Berechne den minimalen Basisstrom, um das Darlington-Paar fuer einen 200-mA-Summer zu saettigen, bei einer angenommenen Gesamtverstaerkung von 5.000.
