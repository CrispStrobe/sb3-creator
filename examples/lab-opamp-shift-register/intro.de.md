# Schieberegister aus drei Op-Amps

Drei Op-Amps, jeder so geschaltet, dass er sich ein Bit merkt, sind so verkettet, dass jeder Druck auf TAKT jedes Bit um eine Stelle nach rechts schiebt. Was DATEN sagt, kommt an die erste Stelle.

**Vermittelt:** Speicher-Flipflop, Schieberegister, getaktete Logik, Steuerdioden

## Was zu tun ist

Klick auf **Sim**. Schließ DATEN (switch_5) und drück zweimal TAKT (button_3). Öffne DATEN und drück dreimal TAKT. Schließ DATEN, drück einmal, öffne wieder und drück weiter.

## Was du sehen solltest

- Beim Einschalten sind alle drei LEDs dunkel.
- Bei jedem Druck rückt das Muster der leuchtenden LEDs eine Stelle nach rechts, und die erste LED übernimmt den Wert von DATEN: eine einzelne leuchtende LED wandert von links nach rechts und fällt am Ende heraus.
- Langer oder kurzer Druck: immer genau ein Schritt.

## Warum es funktioniert

Jeder Op-Amp hält seinen Zustand, weil sein Ausgang auf den eigenen +-Eingang zurückwirkt. Die Taktflanke schiebt den gemeinsamen −-Eingang hoch, was jede Stufe löschen würde — aber im selben Augenblick bekommt jede Stufe, deren linker Nachbar an war, einen stärkeren Stoß auf ihren +-Eingang, über einen Kondensator und eine Diode, die ihn nur durchlassen, wenn der Nachbar hoch ist. Der Wert des Nachbarn erreicht die Steuerdiode über eine Verzögerung, sodass die Stufen, die während der Flanke kippen, sie nicht beeinflussen können: jedes Bit rückt genau eine Stelle weiter.
