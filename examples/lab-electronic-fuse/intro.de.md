---
level: advanced
age: 14+
prereqs: [38-npn-switch, pc32-pnp-high-side]
teaches: [current-sensing, overcurrent-protection, thyristor-latch, positive-feedback]
---
## Was du siehst
Eine grüne LED ist der Verbraucher. Darunter sitzt ein winziger 4,7-Ω-Widerstand, der den Laststrom in eine Spannung verwandelt, daneben ein Speicher aus einem NPN- und einem PNP-Transistor. Eine rote LED zeigt, wenn die Sicherung ausgelöst hat.

## Probier das
1. Klick auf **Sim**: die grüne LED ist an, die rote aus.
2. Drück **Kurzschluss**: die grüne LED geht aus, die rote leuchtet.
3. Lass los. Die Sicherung bleibt ausgelöst, obwohl der Kurzschluss weg ist.
4. Drück **Reset**: der Verbraucher ist wieder da.
5. Mach den Messwiderstand kleiner. Löst die Sicherung noch aus?

## Was passiert hier
Bei normalem Strom fällt am Messwiderstand weniger als ein Zehntel Volt ab. Ein Kurzschluss lässt den Strom springen, und sobald der Spannungsabfall etwa 0,6 V erreicht, wacht der Messtransistor auf. Er schaltet den PNP ein, der PNP speist Strom zurück in die Basis des Messtransistors, und beide halten sich gegenseitig fest – derselbe Trick wie bei einem Thyristor. Der Speicher schaltet außerdem den Transistor ab, der den Laststrom trägt. Weil sich der Speicher selbst versorgt, bleibt er ausgelöst, wenn die Überlast weg ist; nur der Reset-Taster kann die Schleife unterbrechen.

## Weiter geht's
- [lab-break-loop-alarm](../lab-break-loop-alarm) — ein weiterer Speicher, ausgelöst durch einen durchtrennten Draht.
- [pc32-pnp-high-side](../pc32-pnp-high-side) — wie ein PNP schaltet.
