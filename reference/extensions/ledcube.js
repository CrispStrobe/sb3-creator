// Name: LED Cube
// ID: ledcube
// Description: Animate a 4x4x4 LED cube: set voxels, fill layers, shift patterns.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  const N = 4; // side length — 4x4x4
  const S = 8; // select lines (N * 2 for bi-colour)

  function _cubeDecl(runtime) {
    const stc = runtime && runtime.stc;
    return stc && stc.ledcube ? stc.ledcube : null;
  }

  // Frame buffer, shared with the stc12 pin extension's board state.
  function frame(runtime) {
    if (!runtime._ledcubeFrame) runtime._ledcubeFrame = new Uint8Array(S);
    return runtime._ledcubeFrame;
  }

  function addr(x, y, z, c) {
    return [z * 2 + (c > 1 ? 1 : 0), y * N + x];
  }

  class LEDCube {
    constructor(runtime) {
      this.runtime = runtime;
    }

    getInfo() {
      return {
        id: "ledcube",
        name: Scratch.translate({ id: "ledcube.name", default: "LED Cube" }),
        color1: "#9b59b6",
        color2: "#8e44ad",
        color3: "#7d3c98",
        blocks: [
          {
            opcode: "setvoxel",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.setvoxel",
              default: "set voxel [X] [Y] [Z] to [COLOUR]",
            }),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COLOUR: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "clearvoxel",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.clearvoxel",
              default: "clear voxel [X] [Y] [Z]",
            }),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "filllayer",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.filllayer",
              default: "fill layer [LAYER] with [COLOUR]",
            }),
            arguments: {
              LAYER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COLOUR: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "fillcolumn",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.fillcolumn",
              default: "fill column [X] [Y] with [COLOUR]",
            }),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COLOUR: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "fillwall",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.fillwall",
              default: "fill wall [Z] with [COLOUR]",
            }),
            arguments: {
              Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COLOUR: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          "---",
          {
            opcode: "clear",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.clear",
              default: "clear cube",
            }),
          },
          {
            opcode: "invert",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.invert",
              default: "invert cube",
            }),
          },
          {
            opcode: "shift",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.shift",
              default: "shift cube [DIR]",
            }),
            arguments: {
              DIR: {
                type: Scratch.ArgumentType.STRING,
                menu: "directions",
                defaultValue: "up",
              },
            },
          },
          {
            opcode: "hold",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "ledcube.hold",
              default: "hold frame for [DURATION] ms",
            }),
            arguments: {
              DURATION: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 500,
              },
            },
          },
          "---",
          {
            opcode: "readvoxel",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "ledcube.readvoxel",
              default: "voxel [X] [Y] [Z]",
            }),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
        ],
        menus: {
          directions: {
            acceptReporters: false,
            items: ["up", "down", "left", "right", "forward", "back"],
          },
        },
      };
    }

    setvoxel(args) {
      const f = frame(this.runtime);
      const [s, b] = addr(
        Number(args.X) | 0,
        Number(args.Y) | 0,
        Number(args.Z) | 0,
        Number(args.COLOUR) | 0
      );
      if (s >= 0 && s < S && b >= 0 && b < 8) {
        if (args.COLOUR) f[s] |= 1 << b;
        else f[s] &= ~(1 << b);
      }
    }

    clearvoxel(args) {
      const f = frame(this.runtime);
      const [s, b] = addr(
        Number(args.X) | 0,
        Number(args.Y) | 0,
        Number(args.Z) | 0,
        1
      );
      if (s >= 0 && s < S && b >= 0 && b < 8) f[s] &= ~(1 << b);
    }

    filllayer(args) {
      const f = frame(this.runtime);
      const s =
        (Number(args.LAYER) | 0) * 2 + (Number(args.COLOUR) > 1 ? 1 : 0);
      if (s >= 0 && s < S) f[s] = args.COLOUR ? 0xff : 0;
    }

    fillcolumn(args) {
      for (let z = 0; z < N; z++)
        this.setvoxel({
          X: args.X,
          Y: args.Y,
          Z: z,
          COLOUR: args.COLOUR,
        });
    }

    fillwall(args) {
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          this.setvoxel({ X: x, Y: y, Z: args.Z, COLOUR: args.COLOUR });
    }

    clear() {
      frame(this.runtime).fill(0);
    }

    invert() {
      const f = frame(this.runtime);
      for (let i = 0; i < S; i++) f[i] ^= 0xff;
    }

    shift(args) {
      const f = frame(this.runtime);
      const d = String(args.DIR);
      if (d === "up") {
        for (let i = S - 1; i > 0; i--) f[i] = f[i - 1];
        f[0] = 0;
      } else if (d === "down") {
        for (let i = 0; i < S - 1; i++) f[i] = f[i + 1];
        f[S - 1] = 0;
      } else if (d === "left") {
        for (let i = 0; i < S; i++) f[i] <<= 1;
      } else if (d === "right") {
        for (let i = 0; i < S; i++) f[i] >>= 1;
      }
      // forward/back need the voxel map
    }

    hold(args, util) {
      // In the editor, hold is a visual pause — use Scratch's wait.
      if (util && util.yield) util.yield();
    }

    readvoxel(args) {
      const f = frame(this.runtime);
      const [s, b] = addr(
        Number(args.X) | 0,
        Number(args.Y) | 0,
        Number(args.Z) | 0,
        1
      );
      if (s >= 0 && s < S && b >= 0 && b < 8) return (f[s] >> b) & 1;
      return 0;
    }
  }

  Scratch.extensions.register(new LEDCube(Scratch.vm && Scratch.vm.runtime));
})(Scratch);
