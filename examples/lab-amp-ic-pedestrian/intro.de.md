# Langsame Fußgängerampel mit einem Verstärker

Eine Fußgängerampel zeigt Rot, bis jemand den Taster drückt, dann eine Weile Grün und danach wieder Rot. Hier übernimmt ein LM386-Verstärker die Zeitsteuerung: Sobald sein Ausgang hochspringt, führt ein Kondensator diesen Sprung an seinen eigenen Eingang zurück und hält ihn dort, bis der Kondensator entladen ist. Das Poti stellt ein, wie lange Grün dauert.

**Vermittelt:** Monoflop (monostabile Kippstufe), RC-Zeitglied, zwei LEDs an einem Ausgang

## Was zu tun ist

Klick auf **Sim**. Drück den Taster einmal und zähl, wie lange Grün leuchtet. Dreh am Poti und drück noch einmal.

## Was du sehen solltest

- In Ruhe: Rot.
- Nach einem Druck: etwa 1,4 Sekunden Grün, wenn das Poti am kurzen Ende steht, länger, wenn du es aufdrehst (bis etwa 6 Sekunden).
- Danach wieder Rot bis zum nächsten Druck.

## Warum es funktioniert

Der Verstärker vergleicht seinen Plus-Eingang mit einer festen Spannung am Minus-Eingang. Der Taster hebt den Plus-Eingang an, der Ausgang springt hoch, und der Kondensator zwischen Ausgang und Plus-Eingang hält den Plus-Eingang oben, auch wenn du loslässt. Dann entlädt sich der Kondensator über das Poti; sinkt der Plus-Eingang unter den Minus-Eingang, fällt der Ausgang zurück. Mehr Widerstand bedeutet langsameres Entladen und längeres Grün.
