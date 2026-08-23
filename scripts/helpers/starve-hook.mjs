/**
 * Module-resolution hook that swaps one module for a stub — the "starve" in
 * `scripts/starve-gate.mjs`.
 *
 * WHY A RESOLVE HOOK AND NOT AN EDIT. Editing the corpus file in place is the
 * obvious move and it is the one that produced three false readings in this
 * project: an edit made through a sibling symlink landed where the import did
 * not resolve, and the run reported the gate as robust when nothing had been
 * changed on the path the gate actually read. Swapping the SPECIFIER is
 * unambiguous — either the loader replaced the module the importer asked for, or
 * it did not, and it says which on stderr.
 *
 * Configured by BW_STARVE={"from":"<abs path>","to":"<abs path>"}.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const cfg = process.env.BW_STARVE ? JSON.parse(process.env.BW_STARVE) : null;
if (cfg) {
    register(pathToFileURL(new URL('./starve-resolver.mjs', import.meta.url).pathname), {
        parentURL: import.meta.url,
        data: {
            from: pathToFileURL(cfg.from).href,
            to: pathToFileURL(cfg.to).href
        }
    });
}
