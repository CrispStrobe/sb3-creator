# Historical Arcade receiver-overlap words

The user-requested import-coverage batch adds two canonical parser/decompiler
words for the historical receiver callback protocol implemented by Lite:

- `arcade register instance overlap of (arcade local hero) as "handler" capturing "value"`
- `WHEN arcade instance overlap handler "handler" runs:`

These map to `arcade_registerInstanceOverlapHandler` and
`arcade_whenRegisteredInstanceOverlap`. They use the existing argument-slot and
hat machinery; receiver identity, replacement and dispatch belong to the runtime.

Coordination and source are committed together for this local batch. The complete
Arcade dialect suite passes, including independent spellings and roundtrips for
both new opcodes. No runtime behavior or supplier dependency changes occur here.
