const list = [
  { id: 'iron', name: 'Iron', kind: 'resource', stack: 64 },
  { id: 'gold', name: 'Gold', kind: 'resource', stack: 64 },
  { id: 'diamond', name: 'Diamond', kind: 'resource', stack: 64 },
  { id: 'emerald', name: 'Emerald', kind: 'resource', stack: 64 },
  { id: 'wool', name: 'Wool', kind: 'block', block: 2, stack: 64 },
  { id: 'wood', name: 'Wood', kind: 'block', block: 3, stack: 64 },
  { id: 'end', name: 'End Stone', kind: 'block', block: 4, stack: 64 },
  { id: 'obsidian', name: 'Obsidian', kind: 'block', block: 5, stack: 64 }
];

const table = new Map(list.map(item => [item.id, item]));

function item(id) {
  return table.get(id) ?? null;
}

function block(id) {
  return list.find(item => item.block === id) ?? null;
}

export { block, item, list };
