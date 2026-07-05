// Browser harness: wire scratch-vm to the real WebGL renderer so that touching /
// collision works, then expose control hooks for Playwright. Bundled by esbuild.
import VM from 'scratch-vm';
import ScratchRender from 'scratch-render';
import { ScratchStorage } from 'scratch-storage';
import { BitmapAdapter } from 'scratch-svg-renderer';

window.SB3 = {
    async load(base64) {
        const bin = atob(base64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

        const canvas = document.getElementById('stage');
        const vm = new VM();
        vm.attachStorage(new ScratchStorage());
        const renderer = new ScratchRender(canvas);
        vm.attachRenderer(renderer);
        vm.attachV2BitmapAdapter(new BitmapAdapter());

        await vm.loadProject(buf.buffer);
        vm.start();
        vm.setCompatibilityMode(true); // 30fps
        vm.greenFlag();

        window.__vm = vm;
        window.__renderer = renderer;
        return { targets: vm.runtime.targets.length };
    },

    // Advance the VM by n frames of real time (renders each frame).
    async step(n) {
        const vm = window.__vm;
        for (let i = 0; i < n; i++) {
            vm.runtime._step();
            await new Promise(r => requestAnimationFrame(r));
        }
        return true;
    },

    // Fire a key hat + hold the key down for the sensing blocks.
    pressKey(key, scratchKey) {
        const vm = window.__vm;
        vm.runtime.startHats('event_whenkeypressed', { KEY_OPTION: scratchKey });
        vm.postIOData('keyboard', { key, isDown: true });
    },
    releaseKey(key) {
        window.__vm.postIOData('keyboard', { key, isDown: false });
    },

    // Read a variable/list by name across all targets.
    getVar(name) {
        for (const t of window.__vm.runtime.targets) {
            for (const v of Object.values(t.variables)) if (v.name === name) return v.value;
        }
        return undefined;
    },

    // Do two named sprites' drawables currently overlap (real renderer collision)?
    touching(nameA, nameB) {
        const vm = window.__vm;
        const a = vm.runtime.targets.find(t => !t.isStage && t.sprite.name === nameA);
        const b = vm.runtime.targets.find(t => !t.isStage && t.sprite.name === nameB);
        if (!a || !b) return null;
        return a.isTouchingSprite(nameB);
    },

    counts() {
        const vm = window.__vm;
        const byName = {};
        for (const t of vm.runtime.targets) {
            if (t.isStage) continue;
            byName[t.sprite.name] = (byName[t.sprite.name] || 0) + 1;
        }
        return byName;
    }
};
