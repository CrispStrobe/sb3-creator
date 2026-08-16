---
level: beginner
age: 10+
prereqs: [arduino-01-analog-read-serial]
teaches: [string-concatenation, join-operator, data-formatting]
---
## What you see
The program reads a sensor value and the timer, then prints them joined into formatted messages like "Sensor value: 512" and "millis: 3000".

## Try this
1. Change the label text from "Sensor value: " to something else and see how the output changes.
2. Add a third print that joins the sensor reading with a unit like " counts".
3. Try joining more than two pieces in a single line -- how many can you chain?

## What is going on
The `join` block glues text and numbers together into a single string. In Arduino C++ you would use the `+` operator on String objects, but in blocks the join block does the same job. This is how programs build readable messages out of raw data -- every serial monitor sketch needs it.

## Go further
- [arduino-08-string-append](../arduino-08-string-append/) -- build strings piece by piece instead of all at once.
- [arduino-08-string-constructors](../arduino-08-string-constructors/) -- see how numbers become text in the first place.
- [arduino-01-analog-read-serial](../arduino-01-analog-read-serial/) -- the analog read that supplies the sensor value used here.
