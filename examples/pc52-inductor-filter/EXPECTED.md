# Inductor filter

The series inductor passes steady current but opposes fast changes. Probe the
load node while changing the source or compare it with a direct wire.

```assert
# Inductor filter: steady-state V_load = 5 * 1k/(100+1k) = 4.55V
net src.pos V 5.00 +-0.01
```
