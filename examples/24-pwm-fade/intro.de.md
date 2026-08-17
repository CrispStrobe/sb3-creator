---
level: intermediate
age: 12+
prereqs: [01-blink]
teaches: [pwm, fading, duty-cycle]
---
## Was du siehst
Eine LED wird sanft von aus bis zur vollen Helligkeit heller und wieder dunkler, immer wieder. Kein Flackern — die Helligkeitsänderungen wirken kontinuierlich, wie ein Dimmer. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und beobachte, wie die LED auf und ab atmet.
2. Beschleunige das Fading, indem du die Verzögerung zwischen den Helligkeitsstufen verkürzt — das Atmen wird schneller.
3. Verlangsame die PWM-Frequenz (erhöhe die Zykluszeit), bis du die LED flackern statt gleichmäßig leuchten siehst.

## Was passiert hier
Der MCU kann keine analoge Spannung ausgeben — seine Pins sind entweder HIGH oder LOW. Stattdessen schaltet er den Pin sehr schnell ein und aus und variiert das Verhältnis von Ein- zu Aus-Zeit. Dieses Verhältnis heißt Tastverhältnis (Duty Cycle). Bei 50% ist die LED die Hälfte der Zeit an und erscheint halb so hell. Bei 10% ist sie schwach; bei 90% fast voll. Wenn das Schalten schnell genug ist (über etwa 100 Hz), sieht das menschliche Auge ein gleichmäßiges Leuchten statt Flackern. Der Code fährt das Tastverhältnis von 0% auf 100% und zurück, was den Fade-Effekt erzeugt.

## Warum das wichtig ist
PWM ist die Art, wie digitale Systeme analoge Größen steuern. Motordrehzahl, LED-Helligkeit, Lautsprecherlautstärke und Servoposition werden alle per PWM gesteuert. Es ist eine der vielseitigsten Techniken in der Embedded-Programmierung — und sie kostet keine zusätzliche Hardware, weil jeder GPIO-Pin sie in Software umsetzen kann.

## Weiter geht's
- [01-blink](../01-blink) — die einfachste Ein-/Aus-Steuerung, vor PWM.
- [02-dimmer](../02-dimmer) — die Helligkeit mit einem Potentiometer manuell einstellen statt automatisch zu faden.
- Experiment: Ändere die Fade-Kurve von linear zu exponentiell (quadriere den Duty-Cycle-Wert) und beobachte, wie die Helligkeitsänderung für das Auge natürlicher wirkt.
