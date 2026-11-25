# Morsetaste und Fingertaste am Reset-Pin

Ein Tongenerator, der nur klingt, solange du ihn tastest: mit einer normalen Taste oder mit einer Berührungstaste, die nur eine Fingerkuppe braucht.

**Vermittelt:** Reset-Pin als Ein/Aus-Eingang, Transistorverstärkung, Hautwiderstand

## Was zu tun ist

Klick auf **Sim**. Tippe TASTE (button_10) kurz und lang: Morsezeichen. Halte dann FINGER (button_11): Der Schiebeschalter (slide_switch_12) links ist eine feuchte Fingerkuppe. Schieb ihn nach rechts (eine trockene Fingerkuppe) und halte FINGER noch einmal.

## Was du sehen solltest

- TASTE: ein Ton von etwa 680 Hz, solange sie gedrückt ist.
- FINGER mit feuchtem Finger: derselbe Ton.
- FINGER mit trockenem Finger: nichts.

## Warum es funktioniert

Der 555 schwingt nur, solange sein Reset-Pin High ist. Die Taste verbindet diesen Pin mit +9 V. Die Berührungstaste lässt einen winzigen Strom durch deine Haut in einen NPN-Transistor fließen; der schaltet einen PNP-Transistor, und der hebt den Reset-Pin an. Zusammen verstärken sie etwa zehntausendfach: genug für die paar Mikroampere durch eine feuchte Fingerkuppe, nicht für den hundertmal kleineren Strom durch eine trockene.
