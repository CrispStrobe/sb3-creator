# Arcade inspection value word

The consumer contract is the merged [Lite inspection lane](https://github.com/CrispStrobe/brickwright-lite/pull/942).
This supplier adds one canonical reporter:

```text
arcade inspect value (VALUE) limit (LIMIT)
```

Both slots are connected value inputs. Neither is a fixed menu field. The
reporter returns String through the Arcade native service; it does not log.
The supplier preserves the actual input graph and edits across Code and SB3.
It does not establish native operand provenance or qualify SDK execution.

The consumer must evaluate VALUE followed by LIMIT once, including an explicitly
supplied limit unused by primitive inspection. Its initial runtime admission is
String, Number, Boolean, null and Undefined, proved from actual producers and
writers. Arrays and opaque/reference values remain named refusals until their
separate consumer qualification. A spelling that resembles a resource handle
does not determine its type. The initial source default limit is 20.

Selected-original, native, export/reimport and installed authoring qualification
belong to the paired consumer revision. A successful grammar test does not
qualify those routes or a complete project.
