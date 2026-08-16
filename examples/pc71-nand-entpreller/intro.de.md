---
level: advanced
age: 14+
prereqs: [pc45-nand-test, pc69-nand-inverter]
teaches: [NAND-gate, SR-latch, debounce, contact-bounce]
---
## Was du siehst
Zwei NAND-Gatter kreuzgekoppelt als RS-Latch — der klassische prellfreie Schalter. Drücke den Set-Taster: die LED geht sauber an, ohne Flackern. Drücke Reset: sie geht sauber aus.

## Probier das
1. Klick auf **Sim** — die LED ist aus.
2. Drücke Set — die LED geht an, ein einziger sauberer Übergang.
3. Drücke Reset — die LED geht aus.
4. Mechanische Taster prellen normalerweise (mehrfaches Ein/Aus in Millisekunden). Das Latch filtert das: der erste Kontakt setzt den Ausgang, und Preller ändern ihn nicht mehr.

## Was passiert hier
Jedes NAND-Gatter hat einen Eingang über Pull-up auf High. Ein Tastendruck zieht den Eingang auf Low. NAND mit einem Low-Eingang gibt High aus, was den Eingang des anderen Gatters steuert. Durch die Kreuzrückkopplung rastet das Latch ein — weitere Impulse am selben Eingang ändern den Ausgang nicht. Erst ein Impuls am anderen Eingang kippt das Latch zurück.

## Weiter geht's
- [pc45-nand-test](../pc45-nand-test) — NAND-Wahrheitstabelle.
- [pc63-555-bistabil](../pc63-555-bistabil) — eine andere Art Flip-Flop (555-basiert).
- [pc59-nor-memory](../pc59-nor-memory) — das gleiche Latch-Prinzip mit NOR-Gattern.
