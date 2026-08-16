---
level: advanced
age: 14+
prereqs: [pc59-nor-memory, pc75-alarmgeber]
teaches: [NOR-latch, alarm, contact-switch, memory, buzzer]
---
## Was du siehst
Eine Alarmschaltung mit Speicher: ein Kontaktschalter (Reed-/Kippschalter) löst den Alarm aus, ein NOR-Latch speichert den Zustand, der Summer ertönt dauerhaft. Erst der Reset-Taster schaltet den Alarm ab.

## Probier das
1. Klick auf **Sim** — kein Ton (Latch im Ruhezustand).
2. Betätige den Alarmschalter — der Summer ertönt und bleibt an.
3. Drücke den Reset-Taster — der Summer verstummt.
4. Der Alarmschalter kann zurückgestellt werden, der Ton bleibt trotzdem bis zum Reset.

## Was passiert hier
Zwei NOR-Gatter sind kreuzgekoppelt zu einem SR-Latch. Der Alarmschalter setzt den Latch (Q = High → Summer an). Der Latch speichert den Zustand: auch wenn der Schalter loslässt, bleibt der Summer aktiv. Erst ein High-Impuls am Reset-Eingang (zweites NOR-Gatter) kippt den Latch zurück (Q = Low → Summer aus).

## Weiter geht's
- [pc59-nor-memory](../pc59-nor-memory) — das NOR-Latch isoliert.
- [pc75-alarmgeber](../pc75-alarmgeber) — Alarm ohne Speicher (Ton nur bei gedrücktem Taster).
