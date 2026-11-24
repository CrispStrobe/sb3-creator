# Elektronisches Elektroskop: wie viel Ladung, und welches Vorzeichen

Ein geriebenes Lineal biegt einen dünnen Wasserstrahl: Es zieht entgegengesetzte Ladung in die nahe Seite des Strahls. Diese Schaltung misst dieselbe influenzierte Ladung mit einem MOSFET und zeigt ihr Vorzeichen: Die LED wird bei der einen Ladungsart heller und bei der anderen dunkler.

**Vermittelt:** Influenz, positive und negative Ladung, ein Elektrometer

## Was zu tun ist

Klick auf **Sim**. Drück und lass den Taster **set** los: Das Gate wird voreingestellt, und die LED leuchtet etwa halb hell. Dreh dann den Knopf der Sonde hoch (das Lineal kommt näher) und wieder zurück. Stell in den Einstellungen der Sonde `rodVolts` auf −1000 (ein Lineal, an einem anderen Stoff gerieben) und versuch es noch einmal.

## Was du sehen solltest

- Nach *set*: eine schwach leuchtende LED.
- Positiv geladenes Lineal kommt näher: Die LED wird heller und bleibt so, solange das Lineal still gehalten wird.
- Negativ geladenes Lineal kommt näher: Die LED geht aus.
- Lineal weg: zurück zur eingestellten Helligkeit.

## Warum es funktioniert

Nach *set* schwebt das Gate mit einer festen Ladung. Das Lineal influenziert zusätzliche Ladung auf Draht und Gate; positive hebt die Gatespannung, und der MOSFET leitet mehr, negative senkt sie, und er leitet weniger. Einen Wasserstrahl kann eine Schaltung nicht halten, aber der gebogene Strahl und diese LED reagieren auf dieselbe influenzierte Ladung.
