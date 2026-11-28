// Shared semantic cases for the host compiler and the actual native CPUs.
// Expected arithmetic is calculated with BigInt, independently of the emitter.
export function boundaryPrograms(maxOperations = Infinity) {
    const pairs = [
        [0, 0], [1, -1], [-1, 1], [-1, -1], [2147483647, 0], [-2147483648, 0],
        [-2147483648, 1], [1, -2147483648], [-2147483648, -1], [-1, -2147483648],
        [2147483647, -1], [-2147483647, -1], [46340, 46340], [46340, -46340],
        [-46340, 46340], [-46340, -46340], [1073741824, -2], [-2, 1073741824],
        [715827882, 3], [-715827882, 3], [3, -715827882], [3, 715827882]
    ];
    const operations = [];
    for (const [a, b] of pairs) for (const op of ['+', '-', '*']) {
        const value = op === '+' ? BigInt(a) + BigInt(b) : op === '-' ? BigInt(a) - BigInt(b) : BigInt(a) * BigInt(b);
        if (value < -2147483648n || value > 2147483647n) continue;
        operations.push({statements: `  set left to ${a}\n  set right to ${b}\n  say (left ${op} right)\n`,
            output: `${value}\n`});
    }
    const programs = [];
    for (let offset = 0; offset < operations.length; offset += maxOperations) {
        const part = operations.slice(offset, offset + maxOperations);
        programs.push({source: `GLOBAL left = 0\nGLOBAL right = 0\nWHEN flag clicked:\n${part.map(item => item.statements).join('')}`,
            output: part.map(item => item.output).join('')});
    }
    return programs;
}

// Small-memory machines run the same operand cases as separate bounded programs.
// The ordinary host and larger CPUs retain the original combined source.
export const boundaryCase = () => boundaryPrograms()[0];

export const OVERFLOW_MESSAGE = 'Cowgol Blocks: signed int32 overflow\n';
export const overflowCases = [
    '2147483647 + 1', '-2147483648 + -1', '-2147483648 - 1', '2147483647 - -1',
    '0 - -2147483648', '-2147483648 * -1', '-1 * -2147483648',
    '2147483647 * 2', '46341 * 46341', '46341 * -46341', '-46341 * 46341',
    '-46341 * -46341', '(2147483647 + 1) - 1'
].map(expression => ({name: expression,
    source: `WHEN flag clicked:\n  say (${expression})\n  say "wrong"\n`, output: OVERFLOW_MESSAGE}));
overflowCases.push({name: 'variable increment in a loop',
    source: 'GLOBAL n = 2147483646\nWHEN flag clicked:\n  REPEAT 2:\n    change n by 1\n  say "wrong"\n', output: OVERFLOW_MESSAGE});

export const controlCase = {source: `GLOBAL n = 7
GLOBAL text = "001"
WHEN flag clicked:
  say (((n + 2) * (n - 3)) + (n + 1))
  IF (n = 0) and ((n * 2147483647) = 0) THEN:
    say "wrong"
  ELSE:
    say text
  IF (n = 7) or ((n * 2147483647) = 0) THEN:
    say "short circuit"
  set n to 0
  REPEAT UNTIL (n = 3) or ((n < 0) and ((n * 2147483647) = 0)):
    change n by 1
  say n
  say ((-1) bitxor 2147483647)
  stop all
  say "wrong"
`, output: '44\n001\nshort circuit\n3\n-2147483648\n'};
