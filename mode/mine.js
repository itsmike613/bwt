import { block, item } from '../data/item.js';
import { breaks } from '../data/balance.js';

function time(blockid, heldid = '') {
  const def = block(blockid);
  const tune = def ? breaks[def.id] : null;
  if (!tune) return Infinity;
  const held = item(heldid);
  const correct = held?.kind === 'tool' && held.tool === tune.tool;
  return tune.time / (correct ? tune.boost : 1);
}

export { time };
