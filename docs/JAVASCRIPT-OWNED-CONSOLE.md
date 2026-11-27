# Owned JavaScript console generation

`generateJavaScript(project, {async: true, execution: 'owned-console-v1'})`
emits a bounded console-program contract for a host that owns its asynchronous
tasks. This is opt-in. Omitting `execution` preserves the existing classic
JavaScript output, including its existing async and driver options.

The owning cross-repository claim is
[`brickwright/lanes/2026-11-27-javascript-owned-console-tasks.md`](https://github.com/CrispStrobe/brickwright/blob/93c991254e51f5457ccfc0f85fa96381f6b896c9/lanes/2026-11-27-javascript-owned-console-tasks.md).
This upstream change does not move Brickwright's dependency pin or enable the
option in its Code tab. Those require qualified upstream adoption.

## Source and host contract

The result remains valid classic-script syntax. It has no imports, top-level
`await`, or top-level `return`. A host supplies an entry-scoped `codeRun` object
before evaluating it. The generated header checks the version and all three
methods before any script starts:

| Member | Required behavior |
| --- | --- |
| `version` | The number `1`. |
| `spawn(thunk)` | Register a concurrent task immediately, call `thunk(taskApi)` with a distinct task scope, and own the thunk's returned promise, including rejection. `spawn` itself returns `undefined`. |
| `input(question)` | Return a promise for one string reply belonging to this scope and run. The generated caller awaits it. |
| `sleep(milliseconds)` | Return a promise for an owned, cancellable wait in this scope. The generated caller awaits it. The host validates duration and resource limits. |

Each green-flag script becomes an async function with a `codeRun` parameter and
registers with `codeRun.spawn(flagFunction)`. The parameter receives that flag's
task scope, distinct from the entry API. All flag functions register before
evaluation returns; a waiting flag does not prevent its sibling from being
registered. Custom procedures also receive `codeRun` as their first parameter,
and every procedure call forwards the caller's scope with `await`. That scope
therefore survives nested calls and asynchronous suspension.

Scratch ask becomes `await codeRun.input(String(question))`. Scratch wait becomes
`await codeRun.sleep(Number(seconds) * 1000)`. The receiver is the current task
scope. Each scope has the same version and method surface. Its methods reject
new work after the initiating entry/task completes; a completed entry API
cannot acquire a later flag's input or wait on its behalf.

`spawn` is registration-only, not a joining operation. Sequential work uses an
awaited local async function call and passes its existing scope:

```js
async function askLater(codeRun) {
    await codeRun.sleep(20);
    console.log(await codeRun.input('Name?'));
}

async function flag(codeRun) {
    await askLater(codeRun);
    console.log('finished');
}

codeRun.spawn(flag);
```

An authored `await codeRun.spawn(...)` does not wait for the registered task.
There is no automatic inference of arbitrary promise dependencies. The host
owns each registered task separately and rejects unawaited outstanding
input/wait resources when their initiating scope completes.
Within a scope, input must finish before another input, sleep or spawn operation.
Previously started sleeps must finish before that same scope requests input.
This prevents an unawaited question from suspending the budget of work that its
owner continues to perform. Independent sibling scopes retain their own work.

The host owns entry evaluation, registered tasks, input, waits, output and
completion. It must wait for the admitted task lifetime, report rejections,
bound resources and execution, and dispose the run on Stop or failure. A
generated source file does not implement that host service. Brickwright's
worker service supplies it; this repository's tests use a small contract
referee to inspect the actual emitted promises.

The host must keep input ownership distinct from execution responsiveness.
Human waiting may exceed an execution budget, but a worker that stops processing
messages while an input form is open still needs a responsiveness watchdog.
Multiple registered tasks must not gain unlimited execution time because one
of them requested input. Concurrent asks may be refused by the host; this
contract does not promise Scratch's concurrent-ask scheduling.

Generated input never uses `prompt()` or replay. Earlier effects run once.
Authored synchronous `prompt()` compatibility is a separate host route and must
not replay an active owned-task program. Arbitrary detached timers or promises
are not discovered automatically. Authored code must return, await or register
its work according to the host contract.

The emitter reserves `codeRun` and the console's required bindings against
learner variable and argument names. A learner variable named `codeRun` is
renamed in the emitted JavaScript without changing the injected owner.

## Admitted console subset

Admission checks every block in the supplied project, including disconnected
blocks. Unknown or unsupported blocks stop generation with the target name,
block ID and opcode. The emitter does not silently substitute stage stubs for
unsupported behavior in this mode.

| Category | Admitted operations |
| --- | --- |
| Entry and procedures | Green-flag hats; custom procedure definitions, prototypes and calls; string/number and Boolean arguments. Procedures marked “run without screen refresh” are refused. |
| Control | Counted repeat, if, if/else and wait. A dynamic repeat count is still subject to host execution limits; termination is not statically proved. |
| Console | Say and think without a duration log to the console. Ask-and-wait and the answer reporter use the owned input service. |
| Data | Set/change scalar; add, delete, clear, insert and replace list item; item, length and contains reporters. |
| Expressions | Arithmetic, modulo, random, round, join, letter, length, contains, comparisons and Boolean operators through the existing JavaScript lowering. |
| Math functions | `abs`, `floor`, `ceiling`, `sqrt`, `sin`, `cos`, `tan`, `ln`, `log`, `e ^` and `10 ^`. Other variants are refused. |
| Literals | Normal serialized SB3 inline number/text values. Separate `math_number`/`text` shadow nodes are refused because the generic JavaScript expression reader does not lower those nodes. |

Comparison and Boolean reporters also retain their Boolean values when connected
to ordinary value sockets, such as say, assignment, procedure arguments and an
input question. This mode uses the same comparison/Boolean lowering in those
positions as in an if condition. It does not substitute `undefined` for an
admitted reporter. This correction is scoped to the owned output; pre-existing
generator targets retain their source compatibility.

The only driver is the neutral console shim. `async: true` is required.
`events: true`, other execution versions and non-shim drivers fail explicitly.

Nonflag events, broadcasts, clones, forever/repeat-until/wait-until, stop blocks,
timed speech, stage motion, graphics, sensing, audio, Arcade, hardware and other
extension blocks are outside this subset. They require their own scheduling or
host capability contract. Sprite and variable structure markers remain in the
source as metadata; they do not create a playable stage.

This milestone qualifies **ownership of console work**, not complete Scratch
semantic equivalence. The admitted operations use the existing generator's
JavaScript data initialization, coercion, numeric and list behavior. They do
not establish Scratch list-index edge cases, saved-state fidelity, fair
cooperative scheduling, or game behavior. JS execution order runs each task to
its first asynchronous suspension; there is no new Scratch VM scheduler.

## Compatibility and validation

The current JavaScript reverse reader does not admit this async contract.
Owned output is therefore an editable console source target, not a newly
qualified JS-to-blocks roundtrip. Default output and its existing roundtrip
remain unchanged.

Run the focused checks with the repository's installed dependencies:

```sh
node --test test/javascript-owned-console.test.mjs test/codegen.test.mjs test/roundtrip.test.mjs
```

The focused suite drives actual generated source: concurrent flags, delayed
procedure completion, repeated input without replay, rejected operations,
reserved learner names, real JSZip archive data, invalid hosts/options and
unsupported graphs. The host worker/browser tests separately qualify Stop,
timeouts, resource bounds, input replies and fresh runs. Passing this upstream
suite does not qualify a rendered application, browser platform matrix,
simulator, game export or native package.

### Candidate evidence, 27 November 2026

The scoped implementation passes **193/193** focused tests with no skips:
36 owned-console cases plus the existing code generation and roundtrip suites.
All **240** outputs from 40 existing examples across six pre-existing generator
option combinations are byte-identical to the source at
`682e462914a22947b196858e5687800521b368e8`. Emitter ESLint and whitespace checks pass.

The procedure-scope test includes a negative control that removes only the
forwarded `codeRun` argument; the mutated generated program rejects before its
wait or later output. An earlier version of the new contract suite against the
unchanged baseline produced one ordinary control pass and 33 contract failures.
These measurements used Node 24.22.3 and the repository's locked dependencies;
hosted qualification remains a separate landing requirement.

### Boolean value continuation, 27 November 2026

The admitted graph could contain a comparison or Boolean reporter in an ordinary
value socket, but the existing value reader emitted `undefined` for six such
opcodes. The owned target now delegates those nodes to the existing condition
lowering. Eight new executable controls all fail against the prior emitter and
pass with this correction: both truth values for each of the six opcodes,
assignment followed by an awaited procedure, and an owned input question.

The focused suite now passes **201/201** tests with no skips, including **44**
owned-console cases. Emitter ESLint and whitespace checks pass. A fresh comparison
with `682e462914a22947b196858e5687800521b368e8` preserves **240/240** outputs across
the same 40-example corpus using default, async, events, async-plus-events,
comments-disabled and remote-driver options. These local checks used Node
24.22.3. The 14 newly exercised Boolean-value graphs also preserve **84/84**
legacy outputs against the previous candidate `c7584fd0f4cbb26e0742d45bfc10a04c47f77ebd`
with those six options, including after owned generation on the same instance.
The persistent mode-isolation control now uses a nested Boolean-value graph;
it checks source stability without specifying the inherited legacy lowering.
Hosted supplier qualification remains required.
