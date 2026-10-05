---
level: intermediate
age: 12+
prereqs: [03-night-light, 04-thermostat]
teaches: [hysteresis, time-qualification, state-machine]
---
## Was du siehst
Eine Lampe, die sich in der Dämmerung selbst einschaltet und im Morgengrauen aus — und die nicht flackert, solange das Licht genau an der Grenze liegt. Kurze Änderungen ignoriert sie außerdem: Ein Schatten, eine Wolke oder Autoscheinwerfer schalten sie nicht.

## Probier das
1. Starte das Programm bei hellem Licht und senke dann die Helligkeit am LDR deutlich. Einen Moment später — nach 0,8 Sekunden — geht die Lampe an, und der serielle Monitor meldet es.
2. Stelle die Helligkeit in die Mitte. Die Lampe bleibt, wie sie ist — dieses mittlere Band ist die Hysterese.
3. Hebe die Helligkeit an und senke sie so schnell wie möglich wieder. Nichts passiert: Die Änderung war zu kurz.

## Was passiert hier
Ein einfaches Nachtlicht mit einer einzigen Schwelle flackert in der Dämmerung, weil der Messwert um diesen einen Wert herum schwankt. Dieses Programm benutzt zwei Schwellen: Es schaltet unter 300 ein, aber erst über 500 wieder aus. Dazwischen bleibt alles, wie es war.

Außerdem verlangt es Geduld. Ein Zähler steigt bei jedem Messwert jenseits der Grenze und fällt auf null, sobald einer es nicht ist. Erst nach 8 Messwerten am Stück — 0,8 Sekunden — schaltet die Lampe. Bei einer echten Außenleuchte würdest du das viel länger machen, eine Minute oder mehr. Eine Variable `state` merkt sich, ob die Lampe an ist; davon hängt ab, welche Grenze zählt. Dieses Paar aus Zustand und Regeln ist ein kleiner Zustandsautomat.

## Warum das wichtig ist
Hysterese und „muss eine Weile anhalten" stecken in jedem Thermostat, Akkuladegerät und automatischen Licht. Ohne sie verschleißen echte Steuerungen ihre Relais, nerven mit Flackern oder reagieren auf jede kleine Störung.

## Weiter geht's
- [04-thermostat](../04-thermostat) — Hysterese mit einem Temperatursensor.
- [sense-pir-alarm](../sense-pir-alarm) — mit einem Bewegungsmelder kombinieren, damit die Lampe nach Einbruch der Dunkelheit nur auf Menschen reagiert.
- Experiment: Verwende unterschiedliche Bestätigungszeiten für Ein und Aus — schnell einschalten, langsam ausschalten.
