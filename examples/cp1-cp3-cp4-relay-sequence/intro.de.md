---
level: intermediate
age: 11+
prereqs: [cp1-expansion-step, cp1-cp4-relay-signals]
teaches: [cp1-memory, cp1-output, relay, isolated-load]
---

## Eine Folge aus dem Erweiterungsspeicher abspielen

Die Erweiterung CP3 ergänzt die Speicherzellen 128–255 und Port 4. In dieser Schaltung führen P4.0 und P4.1 zu zwei Relais-Treiberstufen nach Art des CP4. Jedes Relais schließt einen Kontakt im separaten Lampenstromkreis. In **Schaltungen** sind die Portleitungen und die Lampenversorgung sichtbar.

1. **Brickwright-Monitor verwenden** wählen und die CPU bis zur Bereitschaftsanzeige laufen lassen. Die CPU anhalten, das beigefügte Programm laden und ohne Reset fortsetzen. **0, 0, 0, PC, RUN** auf der Tastatur eingeben.
2. Die Anzeige durchläuft 1, 2 und 0. Grüne Lampe, rote Lampe und Dunkelphase entsprechen den beiden niederwertigsten Bits. Im **Code** stehen `LDA entry` und `LDA exit`. Die jeweils nachfolgenden `P4A 0` schreiben ein ganzes Byte an Port 4.
3. Im **Debugger** beim zweiten `P4A 0` anhalten und prüfen, dass der Akku 2 enthält. Die Anweisung einzeln ausführen. Die Leitung von P4.1 bis zur Treiberstufe der roten Lampe und danach den getrennten Batteriestromkreis der Lampe verfolgen.
4. Die CPU anhalten und Zelle 255 von `00.002` auf `00.003` ändern. Nach dem Fortsetzen leuchten in der zweiten Phase beide Lampen, weil beide niederwertigsten Bits gesetzt sind. Zelle 128 bestimmt weiterhin die erste Phase. Um die Änderung im **Code** zu behalten, `exit: DATA 2` in `exit: DATA 3` ändern und den Quelltext erneut laden.
