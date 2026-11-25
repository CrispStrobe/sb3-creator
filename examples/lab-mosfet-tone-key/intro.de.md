# Ein Ton, geschaltet durch statische Ladung

Ein MOSFET, dessen Gate nur ein kurzer blanker Draht ist, schaltet einen Tongenerator. Bring ein geladenes Kunststofflineal an den Draht: Der Ton setzt ein und bleibt, solange du das Lineal stillhältst. Nimm das Lineal weg, und er verstummt.

**Vermittelt:** selbstleitender MOSFET, isoliertes Gate, elektrisches Feld, Influenz

## Was zu tun ist

Klick auf **Sim**. Stell den Abstandsknopf des Lineals (field_probe_12) auf etwa ein Drittel und hör hin; achte auf die rote LED (led_15). Halt ihn dort und dreh ihn dann zurück auf null.

## Was du sehen solltest

- Kein Lineal: rote LED an, Lautsprecher still.
- Lineal nah: Die LED geht aus, und ein Ton von etwa 280 Hz erklingt.
- Lineal stillgehalten: Der Ton bleibt. Lineal weg: Stille, LED wieder an.

## Warum es funktioniert

Dieser MOSFET leitet von selbst, wenn sein Gate auf null Volt liegt; ein negatives Gate sperrt ihn. Das geriebene Lineal trägt negative Ladung, und wenn es näher kommt, verschiebt es Ladung auf dem blanken Draht, sodass das Gate negativ wird. Solange der MOSFET leitet, hält er den Eingang des Tongenerators niedrig; sperrt er, läuft der Generator. Das Gate ist isoliert, also bleibt die Ladung, solange sich das Lineal nicht bewegt.
