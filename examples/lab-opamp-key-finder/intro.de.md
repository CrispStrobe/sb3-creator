# Schlüsselfinder: ein Pfiff hält den Alarm

Pfeif, und der Schlüsselbund antwortet. Ein Lautsprecher als Mikrofon, Verstärkerstufen und ein Speicher aus Operationsverstärkern: ein ausreichend lauter Pfiff schaltet den Alarm ein, und nur der Taster RESET schaltet ihn wieder aus.

**Vermittelt:** Verstärkerkette, Spitzenwerterkennung, Speicher, Empfindlichkeit

## Was zu tun ist

Klick auf **Sim**. Erhöh den Schall am Lautsprecher (speaker_3) auf 80 dB, dann auf 90 dB und wieder auf 0. Drück RESET (button_24). Schieb SENSITIVE (slide_switch_17) nach rechts und probier 60 dB und 70 dB. Dreh an THRESHOLD (potentiometer_20) und beobachte voltmeter_21, um zu sehen, wie viel Abstand du hast.

## Was du sehen solltest

- Normal: bei 80 dB bleibt die ALARM-LED (led_27) dunkel, bei 90 dB leuchtet sie und bleibt auch in der Stille an.
- RESET löscht sie.
- SENSITIVE: schon 70 dB schalten sie ein.

## Warum es funktioniert

Zwei (oder drei) Verstärkerstufen vervielfachen die winzige Spannung des Lautsprechers. Ihre Spitzen laden über eine Diode den Eingang des Speichers; überschreitet er die Schwelle, geht der Ausgang hoch und speist sich selbst auf denselben Eingang zurück — er braucht den Schall nicht mehr. RESET zieht diesen Eingang herunter und unterbricht die Schleife.
