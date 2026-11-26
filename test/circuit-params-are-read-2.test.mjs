/**
 * Shard 2 of 4 of the circuit-params-are-read gate's tier-2 sweep. The gate,
 * its ratchet and why it is sharded: test/circuit-params-are-read.test.mjs and
 * test/helpers/param-tier2.mjs.
 */
import { defineTier2 } from './helpers/param-tier2.mjs';

defineTier2(1);
