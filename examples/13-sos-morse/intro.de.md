---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [morse-code, timing-patterns, encoding]
---
## Was du siehst
Eine LED blinkt das SOS-Notsignal im Morsecode: drei kurze Blitze, drei lange Blitze, drei kurze Blitze, dann eine Pause, bevor es sich wiederholt. Das Timing codiert Information — ein Strich ist dreimal so lang wie ein Punkt.

## Probier das
1. Starte das Programm und zähle die Blitze: 3 kurz, 3 lang, 3 kurz.
2. Ändere die Punktdauer auf einen größeren Wert, zum Beispiel 400 ms, und beobachte, wie sich das gesamte Muster proportional verlangsamt.
3. Versuche, einen anderen Buchstaben zu codieren — der Buchstabe „A" ist ein Punkt gefolgt von einem Strich.

## Was passiert hier
Morsecode codiert Buchstaben als Folgen von kurzen Signalen (Punkten) und langen Signalen (Strichen). Ein Strich dauert dreimal so lang wie ein Punkt. Zwischen Punkten und Strichen innerhalb eines Buchstabens ist die LED für eine Punktlänge aus. Zwischen Buchstaben beträgt die Pause drei Punktlängen, zwischen Wörtern sieben. SOS wurde als universelles Notsignal gewählt, weil sein Muster unverwechselbar und selbst unter Stress leicht zu senden ist.

## Warum das wichtig ist
Das ist dein erstes Projekt, bei dem das Timing eine Bedeutung trägt. Die LED ist entweder an oder aus — dieselben zwei Zustände wie beim Blinken — aber jetzt codiert die Dauer jedes Zustands Information. Dieses Prinzip liegt serieller Kommunikation, PWM und jedem digitalen Protokoll zugrunde.

## Weiter geht's
- [01-blink](../01-blink) — der einfachere Startpunkt mit einem gleichmäßigen Rhythmus.
- [14-traffic-light](../14-traffic-light) — eine weitere getimte Sequenz, diesmal mit drei Ausgängen.
- Experiment: Codiere deine Initialen im Morsecode und lasse sie blinken. Schlag das Morse-Alphabet nach und baue das Muster aus Punkten und Strichen zusammen.
