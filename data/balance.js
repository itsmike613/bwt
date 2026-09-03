const health = {
  max: 20,
  respawn: 3,
  void: -20,
  safe: 3
};

const drops = {
  cap: 96,
  reach: 1.35
};

const forge = [
  { iron: 2, gold: 8 },
  { iron: 1.5, gold: 6 },
  { iron: 1, gold: 4 }
];

const armor = {
  leather: { rank: 0, reduce: 0.10 },
  iron: { rank: 1, reduce: 0.25 },
  diamond: { rank: 2, reduce: 0.45 }
};

const apple = {
  time: 30,
  every: 1,
  heal: 1
};

const shop = {
  reach: 3.25,
  item: {
    swordwood: { cost: '', price: 0, count: 1 },
    swordiron: { cost: 'gold', price: 7, count: 1 },
    sworddiamond: { cost: 'emerald', price: 4, count: 1 },
    pickaxe: { cost: 'iron', price: 10, count: 1 },
    axe: { cost: 'iron', price: 10, count: 1 },
    shears: { cost: 'iron', price: 20, count: 1 },
    leather: { cost: '', price: 0, count: 1 },
    ironarmor: { cost: 'gold', price: 12, count: 1 },
    diamondarmor: { cost: 'emerald', price: 6, count: 1 },
    wool: { cost: 'iron', price: 4, count: 16 },
    wood: { cost: 'gold', price: 4, count: 16 },
    end: { cost: 'iron', price: 24, count: 12 },
    obsidian: { cost: 'emerald', price: 4, count: 4 },
    apple: { cost: 'gold', price: 3, count: 1 },
    tnt: { cost: 'gold', price: 4, count: 1 },
    fireball: { cost: 'iron', price: 40, count: 1 }
  },
  forge: {
    forge1: { name: 'Forge I', level: 1, cost: 'diamond', price: 2, text: 'Improves the team forge to about 1 Iron every 1.5 seconds.' },
    forge2: { name: 'Forge II', level: 2, cost: 'diamond', price: 4, text: 'Improves the team forge to about 1 Iron every 1 second.' }
  }
};

const combat = {
  reach: 3.2,
  delay: 0.45,
  credit: 8,
  knock: 6.8,
  lift: 4.2,
  fist: 1,
  angle: 0.28
};

const breaks = {
  wool: { time: 0.8, tool: 'shears', boost: 4.5 },
  wood: { time: 1.8, tool: 'axe', boost: 4 },
  end: { time: 3.2, tool: 'pickaxe', boost: 4 },
  obsidian: { time: 9, tool: 'pickaxe', boost: 2.5 }
};

const tnt = {
  fuse: 3.5,
  radius: 4,
  damage: 12,
  knock: 10,
  power: 4
};

const fireball = {
  speed: 18,
  radius: 3,
  damage: 6,
  knock: 12,
  power: 2,
  life: 6
};

const resist = {
  wool: 1,
  wood: 2,
  end: 4,
  obsidian: 99
};

const diamond = 30;
const emerald = 45;
const send = 0.1;

export { apple, armor, breaks, combat, diamond, drops, emerald, fireball, forge, health, resist, send, shop, tnt };
