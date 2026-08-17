# NOR memory

Pressing SET makes Q high; pressing RESET makes Q low. Releasing both inputs
leaves the cross-coupled gates in their previous stable state.

```assert
# NOR SR latch: idle (both inputs LOW) -> holds previous state
net vcc.pos V 5.00 +-0.01
```
