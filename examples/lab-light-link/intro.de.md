---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator, pc25-relay-isolator]
teaches: [optical-link, modulation, AC-coupling, optocoupler, light-barrier]
---
## Was du siehst
Ein Sender, der unsichtbares Licht etwa tausendmal pro Sekunde blitzen lässt, und ein Empfänger, der aus den Blitzen wieder einen Ton macht. Dazwischen liegt der Lichtstrahl (hier in einem Optokoppler eingeschlossen). Du kannst den Strahl mit der Hand unterbrechen oder den Sender auf Dauerlicht schalten.

## Probier das
1. Starte die Simulation: Der Lautsprecher spielt den Ton des Senders, und die grüne Empfänger-LED wirkt halb hell.
2. Drück HAND IN BEAM. Der Ton verstummt, und die LED wird dunkel: eine Lichtschranke.
3. Lass los und halte dann STEADY LIGHT. Die LED leuchtet jetzt voll, also kommt mehr Licht an als vorher, und trotzdem schweigt der Lautsprecher.
4. Erkläre Schritt 3 mit dem Koppelkondensator.

## Was dahintersteckt
Der Fototransistor leitet, wenn Licht auf ihn fällt, und zieht seinen Kollektor herunter. Bei blitzendem Licht springt der Kollektor im Takt des Tons auf und ab. Der Koppelkondensator gibt diese Sprünge an den Lautsprecher weiter, sperrt aber jede gleichbleibende Spannung. Eine Lampe, die einfach nur leuchtet (der STEADY-Fall oder Tageslicht im Zimmer), erzeugt deshalb gar keinen Ton. Nur Licht, das im richtigen Rhythmus ein- und ausgeschaltet wird, kommt durch. Fernbedienungen, Lichtschranken und Glasfaserstrecken modulieren ihr Licht genau deshalb. Und weil die beiden Seiten nur über Licht verbunden sind, hält ein Optokoppler gefährliche Spannungen auf der einen Seite von der anderen fern.

## Weiter geht's
- [pc67-555-tongenerator](../pc67-555-tongenerator): der 555-Tongenerator für sich.
- [pc25-relay-isolator](../pc25-relay-isolator): ein anderer Weg, zwei Schaltungen zu trennen.
