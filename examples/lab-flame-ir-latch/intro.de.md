# Flammenschalter, der sich selbst hält

Ein Fototransistor und ein Transistor bilden einen Lichtverstärker. Eine Flamme davor schaltet einen Verstärker ein, und der strahlt sein eigenes Infrarotlicht zurück auf den Fototransistor — so bleibt die Schaltung an, wenn die Flamme weg ist, bis eine Hand den Strahl unterbricht.

**Vermittelt:** Darlington-Schaltung, Lichtverstärker, optische Rückkopplung, Selbsthaltung

## Was zu tun ist

Klick auf **Sim**. Schieb den Lichtregler des Fototransistors (phototransistor_3) ein winziges Stück hoch, zu einem Schimmer, und schau auf die gelbe LED. Schieb ihn dann weiter — die Flamme — und wieder auf dunkel. Dreh zum Schluss den Knopf des Lichtwegs (light_path_13), die Hand im Strahl, auf und wieder zurück.

## Was du sehen solltest

- Ein Schimmer: die gelbe LED glimmt schon; mehr Licht, heller.
- Die Flamme: die rote LED (in Reihe mit der Infrarot-LED) geht an — und bleibt an, wenn der Regler wieder auf dunkel steht.
- Hand im Strahl: alles geht aus und bleibt aus, wenn die Hand wieder weg ist.

## Warum es funktioniert

Der winzige Strom des Fototransistors ist der Basisstrom des zweiten Transistors, der ihn etwa hundertfach verstärkt. Übersteigt die Spannung, die das erzeugt, die Referenz des Verstärkers, springt dessen Ausgang hoch und lässt die Infrarot-LED leuchten. Ihr Licht fällt auf den Fototransistor und hält den Strom aufrecht: die Schaltung versorgt sich selbst. Unterbricht man das Licht, bricht die Schleife zusammen.
