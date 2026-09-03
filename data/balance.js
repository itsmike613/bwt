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

const forge = {
  iron: 2,
  gold: 8
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

export { breaks, combat, diamond, drops, emerald, fireball, forge, health, resist, send, tnt };
