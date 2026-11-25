---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower, lab-push-pull]
teaches: [class-a, class-c, conduction-angle, bias]
---
## Was du siehst
Ein Sinussignal und zwei Transistorstufen. Die linke ist so vorgespannt, dass sie immer leitet (A-Betrieb); die rechte bekommt gar keine Vorspannung (C-Betrieb) und hat eine rote LED im Kollektor.

## Was du tun kannst
1. Klick auf **Sim**. Die rote LED der C-Stufe flackert: Sie bekommt nur bei den Spitzen des Signals Strom.
2. Dreh das **LEVEL**-Poti herunter. Die C-Stufe leitet immer kürzer, hört dann ganz auf, und ihre LED bleibt dunkel; die A-Stufe leitet weiter die ganze Zeit, nur mit kleinerem Ausschlag.

## Was passiert hier
Ein Transistor leitet erst, wenn seine Basis etwa 0,7 V über dem Emitter liegt. Der A-Betrieb hält die Basis mit einem Spannungsteiler ständig dort, also bewegt das Signal den Strom nur um einen Ruhewert: getreu, aber der Transistor zieht immer Strom. Der C-Betrieb hat keine Vorspannung, also kommen nur die Spitzen des Signals über 0,7 V. Das verschwendet wenig Leistung, verzerrt aber stark: gut für Sender mit Schwingkreis, unbrauchbar für Musik. B- und AB-Betrieb, bei denen zwei Transistoren je eine Hälfte übernehmen, findest du in lab-push-pull.

## Weiter geht's
- [lab-push-pull](../lab-push-pull) — Gegentaktstufen im B- und AB-Betrieb.
- [lab-ce-vs-follower](../lab-ce-vs-follower) — Verstärkung einer vorgespannten Stufe.
