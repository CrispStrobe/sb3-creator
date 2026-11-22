---
level: intermediate
age: 12+
prereqs: [51-555-astable, pc100-555-clock]
teaches: [binary-counting, frequency-divider, ripple-counter, timer]
---
## Was du siehst
Ein 555-Taktgeber, ein 4-Bit-Binärzählerchip, drei rote LEDs, die den Zählerstand zeigen, und eine grüne „fertig“-LED. Erreicht der Zähler acht, hält er seinen eigenen Takt an.

## Probier das
1. Klick auf **Sim** und sieh den roten LEDs beim binären Zählen zu: 1, 10, 11, 100 …
2. Bei acht gehen die roten LEDs aus, die grüne leuchtet und alles steht.
3. Drück **Start**, um den Timer noch einmal laufen zu lassen.
4. Häng den Draht zum Stopp-Transistor von QD auf QC um. Jetzt hält der Timer schon bei vier.

## Was passiert hier
Jede Stufe des Zählers kippt, wenn die Stufe davor von 1 auf 0 fällt, sie wechselt also halb so oft. Jeder Ausgang teilt deshalb den vorherigen durch zwei: vier Stufen teilen den Takt durch sechzehn. Hier wird der höchste Ausgang außerdem als Wecker benutzt: er schaltet einen Transistor, der den 555 im Reset festhält. Ein langsamer Takt und eine lange Kette von Stufen ergeben mit kleinen Bauteilen sehr lange, sehr genaue Verzögerungen – so arbeiten Küchenwecker und die Minutenzähler in Uhren.

## Weiter geht's
- [pc100-555-clock](../pc100-555-clock) — der Taktgeber für sich allein.
- [lab-coin-toss](../lab-coin-toss) — eine einzelne Teilerstufe, von Hand angehalten.
