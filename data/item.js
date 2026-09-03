const list = [
  { id: 'iron', name: 'Iron', kind: 'resource', stack: 64 },
  { id: 'gold', name: 'Gold', kind: 'resource', stack: 64 },
  { id: 'diamond', name: 'Diamond', kind: 'resource', stack: 64 },
  { id: 'emerald', name: 'Emerald', kind: 'resource', stack: 64 },
  { id: 'swordwood', name: 'Wooden Sword', kind: 'weapon', stack: 1, damage: 4 },
  { id: 'swordiron', name: 'Iron Sword', kind: 'weapon', stack: 1, damage: 6 },
  { id: 'sworddiamond', name: 'Diamond Sword', kind: 'weapon', stack: 1, damage: 7 },
  { id: 'pickaxe', name: 'Pickaxe', kind: 'tool', tool: 'pickaxe', stack: 1, persist: true },
  { id: 'axe', name: 'Axe', kind: 'tool', tool: 'axe', stack: 1, persist: true },
  { id: 'shears', name: 'Shears', kind: 'tool', tool: 'shears', stack: 1, persist: true },
  { id: 'wool', name: 'Wool', kind: 'block', block: 2, stack: 64 },
  { id: 'wood', name: 'Wood', kind: 'block', block: 3, stack: 64 },
  { id: 'end', name: 'End Stone', kind: 'block', block: 4, stack: 64 },
  { id: 'obsidian', name: 'Obsidian', kind: 'block', block: 5, stack: 64 },
  { id: 'tnt', name: 'TNT', kind: 'utility', stack: 64 },
  { id: 'fireball', name: 'Fireball', kind: 'utility', stack: 16 }
];

const table = new Map(list.map(item => [item.id, item]));

function item(id) {
  return table.get(id) ?? null;
}

function block(id) {
  return list.find(item => item.block === id) ?? null;
}

export { block, item, list };
