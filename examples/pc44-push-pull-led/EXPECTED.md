# Push-pull indicator

One switch completes the upper LED branch and the other completes the lower
branch. Operating both at once is deliberately shown as a wiring condition to
inspect, not as a safe default.

```assert
# Push-pull: supply 5V, each LED branch through 1k
net src.pos V 5.00 +-0.01
```
