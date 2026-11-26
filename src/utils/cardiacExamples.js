// SPDX-License-Identifier: BSD-3-Clause
// Original Brickwright programs. These are CARDIAC source, not pseudocode.

const example = value => Object.freeze({...value,
    title: Object.freeze(value.title), description: Object.freeze(value.description),
    input: Object.freeze(value.input), expectedOutput: Object.freeze(value.expectedOutput)});

export const CARDIAC_EXAMPLES = Object.freeze({
    'cardiac-echo': example({
        id: 'cardiac-echo',
        title: {en: 'A number makes a round trip', de: 'Eine Zahl kommt zurück'},
        description: {en: 'Store one input word, output that same cell, then halt.',
            de: 'Speichere eine Eingabe, gib dieselbe Zelle aus und halte an.'},
        input: [42], expectedOutput: [42], terminal: 'halted',
        source: `; Original Brickwright CARDIAC example: follow one input word.
ORG 01
ENTRY start
start: INP sample
       OUT sample
       HRS
ORG 80
sample: DAT 0
`
    }),
    'cardiac-add': example({
        id: 'cardiac-add',
        title: {en: 'Add two stored numbers', de: 'Zwei gespeicherte Zahlen addieren'},
        description: {en: 'Use the accumulator, store the sum, then output memory.',
            de: 'Nutze den Akkumulator, speichere die Summe und gib den Speicher aus.'},
        input: [17, 25], expectedOutput: [42], terminal: 'halted',
        source: `; Original Brickwright CARDIAC example: input, compute, store, output.
ORG 01
ENTRY start
start: INP left
       INP right
       CLA left
       ADD right
       STO total
       OUT total
       HRS
ORG 80
left:  DAT 0
right: DAT 0
total: DAT 0
`
    }),
    'cardiac-countdown': example({
        id: 'cardiac-countdown',
        title: {en: 'Count down through zero', de: 'Bis einschließlich null herunterzählen'},
        description: {en: 'TAC branches only when the accumulator is negative.',
            de: 'TAC springt nur bei einem negativen Akkumulatorwert.'},
        input: [3], expectedOutput: [3, 2, 1, 0], terminal: 'halted',
        source: `; Original Brickwright CARDIAC example: zero is not negative.
ORG 01
ENTRY start
start: INP remaining
again: CLA remaining
       TAC done
       OUT remaining
       SUB one
       STO remaining
       JMP again
done:  HRS
ORG 80
remaining: DAT 0
one:       DAT 1
`
    }),
    'cardiac-night-light': example({
        id: 'cardiac-night-light',
        title: {en: 'A transparent night-light', de: 'Ein nachvollziehbares Nachtlicht'},
        description: {en: 'Emit 001 below a threshold and 000 otherwise; the modern adapter may drive an LED.',
            de: 'Gib unterhalb einer Schwelle 001 aus, sonst 000; der moderne Adapter kann eine LED ansteuern.'},
        input: [200, 500, 800, 300], expectedOutput: [1, 0, 0, 1], terminal: 'waiting',
        source: `; Original Brickwright CARDIAC example: one decision per input sample.
; Numeric I/O is historical; a circuit adapter is a modern Brickwright device.
; OUT emits memory, so each branch stores its decision before output.
ORG 01
ENTRY again
again: INP sample
       CLA sample
       SUB threshold
       TAC dark
       CLA zero
       STO decision
       OUT decision
       JMP again
dark:  CLA one
       STO decision
       OUT decision
       JMP again
ORG 80
sample:    DAT 0
threshold: DAT 500
one:       DAT 1
zero:      DAT 0
decision:  DAT 0
`
    }),
    'cardiac-bootstrap': example({
        id: 'cardiac-bootstrap',
        title: {en: 'Load a program using a program', de: 'Ein Programm mit einem Programm laden'},
        description: {en: 'Start from fixed cell 00. The input strip builds a loader, installs an addition program, then supplies 035.',
            de: 'Beginne mit der festen Zelle 00. Der Eingabestreifen baut einen Lader auf, installiert ein Additionsprogramm und liefert dann 035.'},
        input: [2, 800, 20, 80, 21, 180, 22, 281, 23, 680, 24, 580, 25, 900, 81, 7, 820, 35],
        expectedOutput: [42], terminal: 'halted',
        source: `; Original Brickwright exercise: construct an add-seven program from input.
; Only the fixed bootstrap word is present initially. Use the supplied strip.
ENTRY 00
ORG 00
001
`
    }),
    'cardiac-self-modify': example({
        id: 'cardiac-self-modify',
        title: {en: 'An instruction visits three cells', de: 'Ein Befehl besucht drei Zellen'},
        description: {en: 'Change the operand of OUT in memory to walk through three data cells.',
            de: 'Ändere den OUT-Operanden im Speicher, um drei Datenzellen zu durchlaufen.'},
        input: [], expectedOutput: [11, 22, 33], terminal: 'halted',
        source: `; Original Brickwright CARDIAC example: the executed word changes.
; The source remains a draft; live memory is the execution authority.
ORG 10
ENTRY show
show:  OUT table
       CLA show
       ADD one
       STO show
       CLA remaining
       SUB one
       STO remaining
       TAC done
       JMP show
done:  HRS
ORG 80
table: DAT 11, 22, 33
ORG 90
one:       DAT 1
remaining: DAT 2
`
    })
});
