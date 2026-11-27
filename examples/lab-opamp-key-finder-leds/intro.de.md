# Schlüsselfinder mit Schwellen-LEDs

Pfeif, und der Schlüsselbund antwortet. Ein Lautsprecher als Mikrofon, Verstärkerstufen und ein Speicher aus Operationsverstärkern: ein ausreichend lauter Pfiff schaltet den Alarm ein, und nur RESET schaltet ihn wieder aus. Zwei weitere LEDs zeigen ständig, ob der Schall über oder unter der Schwelle liegt, so dass du sie nach Augenmaß einstellen kannst.

**Vermittelt:** Verstärkerkette, Spitzenwerterkennung, Speicher, Komparator als Anzeige, Empfindlichkeit

## Was zu tun ist

Klick auf **Sim**. Erhöh den Schall am Lautsprecher (speaker_3) auf 80 dB, dann auf 90 dB und wieder auf 0. Warte ein, zwei Sekunden und drück dann RESET (button_23). Schieb SENSITIVE (slide_switch_17) nach rechts und probier 60 dB und 70 dB. Dreh zum Schluss in der Stille THRESHOLD (potentiometer_20) auf 0.4 herunter.

## Was du sehen solltest

- Stille: die grüne LED UNDER (led_34) leuchtet.
- 80 dB: weiter UNDER. 90 dB: die rote LED OVER (led_32) und die ALARM-LED (led_26) leuchten. Hört der Pfiff auf, geht OVER nach einem Moment wieder aus und UNDER leuchtet wieder, aber der ALARM bleibt an.
- RESET löscht den ALARM.
- SENSITIVE: schon 70 dB schalten OVER und den ALARM ein.
- THRESHOLD auf 0.4: OVER leuchtet ganz ohne Schall, und der Alarm löst von selbst aus. Dreh zurück, bis UNDER wieder leuchtet: das ist die empfindlichste sichere Einstellung.

## Warum es funktioniert

Die Verstärkerstufen vervielfachen die winzige Spannung des Lautsprechers. Ihre Spitzen laden über eine Diode den Eingang des Speichers; überschreitet er die Schwelle, geht dessen Ausgang hoch und hält sich selbst. Eine zweite Diode lädt einen kleinen Kondensator, den Schallpegel, den ein zweiter Operationsverstärker in beide Richtungen mit derselben Schwelle vergleicht: ein Ausgang schaltet OVER, der andere UNDER. Der Unterschied zwischen Pegel und Schwelle beträgt oft nur einige Zehntel Volt, viel zu wenig, um eine LED direkt leuchten zu lassen; die Komparatoren machen daraus ein volles Ein oder Aus.
