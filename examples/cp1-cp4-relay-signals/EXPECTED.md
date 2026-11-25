# CP4 relay signals

| State | Port 2 byte | Entry lamp | Exit lamp |
| --- | --- | --- | --- |
| Monitor ready | 255 | On | On |
| Teaching program waiting | 0 | Off | Off |
| Request closed, first interval | 1 | On | Off |
| Second interval | 2 | Off | On |
| Held closed after the two intervals | 0 | Off | Off |

A lit branch carries about 3.25 mA through its series resistor and lamp. The switched-off branch carries less than 1 µA in the model. Opening the request switch rearms one more sequence. Use the battery negative terminal as the reference when measuring its isolated load circuit.
