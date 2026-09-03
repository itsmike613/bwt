const list = [
  { id: 'iron', name: 'Iron', kind: 'resource', stack: 64, icon: 'Fe' },
  { id: 'gold', name: 'Gold', kind: 'resource', stack: 64, icon: 'Au' },
  { id: 'diamond', name: 'Diamond', kind: 'resource', stack: 64, icon: 'D' },
  { id: 'emerald', name: 'Emerald', kind: 'resource', stack: 64, icon: 'E' },
  { id: 'swordwood', name: 'Wooden Sword', kind: 'weapon', stack: 1, damage: 4, rank: 0, category: 'Weapons', icon: 'WS', text: 'Default sword restored after every respawn.' },
  { id: 'swordiron', name: 'Iron Sword', kind: 'weapon', stack: 1, damage: 6, rank: 1, category: 'Weapons', icon: 'IS', text: 'Stronger melee damage. Lost on death.' },
  { id: 'sworddiamond', name: 'Diamond Sword', kind: 'weapon', stack: 1, damage: 7, rank: 2, category: 'Weapons', icon: 'DS', text: 'Best V1 melee damage. Lost on death.' },
  { id: 'pickaxe', name: 'Pickaxe', kind: 'tool', tool: 'pickaxe', stack: 1, persist: true, category: 'Tools', icon: 'P', text: 'Breaks End Stone and Obsidian faster. Persists after death.' },
  { id: 'axe', name: 'Axe', kind: 'tool', tool: 'axe', stack: 1, persist: true, category: 'Tools', icon: 'A', text: 'Breaks Wood faster. Persists after death.' },
  { id: 'shears', name: 'Shears', kind: 'tool', tool: 'shears', stack: 1, persist: true, category: 'Tools', icon: 'S', text: 'Breaks Wool faster. Persists after death.' },
  { id: 'leather', name: 'Leather Armor', kind: 'armor', tier: 'leather', rank: 0, category: 'Armor', icon: 'LA', text: 'Default armor for the whole match.' },
  { id: 'ironarmor', name: 'Iron Armor', kind: 'armor', tier: 'iron', rank: 1, category: 'Armor', icon: 'IA', text: 'Permanent armor upgrade for this match.' },
  { id: 'diamondarmor', name: 'Diamond Armor', kind: 'armor', tier: 'diamond', rank: 2, category: 'Armor', icon: 'DA', text: 'Best permanent armor upgrade in V1.' },
  { id: 'wool', name: 'Wool', kind: 'block', block: 2, stack: 64, category: 'Blocks', icon: 'W', text: 'Fast, cheap bridging and basic defense.' },
  { id: 'wood', name: 'Wood', kind: 'block', block: 3, stack: 64, category: 'Blocks', icon: 'WD', text: 'A sturdier defense block best broken with an Axe.' },
  { id: 'end', name: 'End Stone', kind: 'block', block: 4, stack: 64, category: 'Blocks', icon: 'ES', text: 'Strong defense best broken with a Pickaxe.' },
  { id: 'obsidian', name: 'Obsidian', kind: 'block', block: 5, stack: 64, category: 'Blocks', icon: 'OB', text: 'Very strong defense resistant to normal explosions.' },
  { id: 'apple', name: 'Golden Apple', kind: 'utility', stack: 16, category: 'Utility', icon: 'GA', text: 'Grants faster health regeneration for about 30 seconds.' },
  { id: 'tnt', name: 'TNT', kind: 'utility', stack: 64, category: 'Utility', icon: 'TNT', text: 'Placeable explosive for players and weaker defenses.' },
  { id: 'fireball', name: 'Fireball', kind: 'utility', stack: 16, category: 'Utility', icon: 'FB', text: 'Projectile explosion with strong knockback.' }
];

const table = new Map(list.map(item => [item.id, item]));

function item(id) {
  return table.get(id) ?? null;
}

function block(id) {
  return list.find(item => item.block === id) ?? null;
}

export { block, item, list };
