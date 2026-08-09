# Ledcube picker entry — for bw-bundle

For the extension library picker in `lite/overlay/scratch-gui/src/lib/libraries/extensions/index.jsx`.

```js
{
    name: 'LED Cube',
    extensionId: 'ledcube',
    description: 'Animate a 4x4x4 LED cube: set voxels, fill layers, shift patterns.',
    featured: true,
    // No icon yet — use a placeholder or the generic hardware icon.
    // DE: name 'LED-Würfel', description 'Animiere einen 4x4x4-LED-Würfel: Voxel setzen, Ebenen füllen, Muster verschieben.'
}
```

The extension source is at `extensions/CrispStrobe/ledcube.js` (gallery) and
`reference/extensions/ledcube.js` (pinned). Bundling follows the same pattern as
stc12/circuit: `makeExt(...)` wrapper in `overlay/scratch-vm/src/extensions/crispstrobe/ledcube/index.js`.
