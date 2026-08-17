---
level: intermediate
age: 12+
prereqs: [01-blink]
teaches: [ldr, analog-sensing, threshold]
---
## Was du siehst
Eine LED schaltet sich automatisch ein, wenn es dunkel wird. Ein lichtabhängiger Widerstand (LDR) in einem Spannungsteiler liefert ein analoges Signal an den MCU, der den Messwert mit einem Schwellwert vergleicht und die LED entsprechend schaltet. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und verändere den LDR-Wert — die LED schaltet ein, wenn der Messwert den Schwellwert überschreitet.
2. Finde den genauen Umschaltpunkt, an dem die LED ein- und ausgeht.
3. Ändere den Schwellwert im Code und beobachte, wie sich die Lichtstärke verschiebt, bei der die LED reagiert.

## Was passiert hier
Der Widerstand des LDR sinkt bei steigender Helligkeit. Im Spannungsteiler mit einem Festwiderstand bedeutet das: Die Spannung am ADC-Pin steigt bei Licht und fällt bei Dunkelheit. Das Programm liest den ADC kontinuierlich und vergleicht mit einem festen Schwellwert. Liegt der Wert unter dem Schwellwert (dunkel), schaltet der MCU die LED ein; darüber (hell) schaltet er sie aus. Das ist die einfachste Form analoger Sensorik: eine physikalische Größe in eine Spannung umwandeln, digitalisieren und anhand eines Schwellwerts entscheiden.

## Warum das wichtig ist
Schwellwert-basierte Sensorik ist überall — automatische Straßenbeleuchtung, Handy-Bildschirmhelligkeit, Sicherheitsleuchten. Zu verstehen, wie ein sich ändernder Widerstand zu einer Entscheidung wird, ist der erste Schritt zu jedem sensorgesteuerten Projekt.

## Weiter geht's
- [04-thermostat](../04-thermostat) — dasselbe Muster mit Temperatursensor und Hysterese gegen schnelles Hin- und Herschalten.
- [02-dimmer](../02-dimmer) — analogen Eingang für proportionale Steuerung statt Ein/Aus nutzen.
- Experiment: Füge einen zweiten Schwellwert hinzu, sodass die LED in der Dämmerung langsam blinkt, aber bei völliger Dunkelheit dauerhaft leuchtet.
