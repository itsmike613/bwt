import { Runtime } from '../core/runtime.js';
import { Player } from '../core/player.js';
import { Build } from '../core/build.js';
import { cast } from '../core/ray.js';
import { all } from '../core/block.js';
import { read, write } from '../core/map.js';
import { Mark, defs } from '../core/mark.js';
import { fly as tune } from '../data/tune.js';

const stage = document.querySelector('#stage');
const palette = document.querySelector('#palette');
const markers = document.querySelector('#markers');
const save = document.querySelector('#save');
const load = document.querySelector('#load');
const clear = document.querySelector('#clear');
const mode = document.querySelector('#mode');
const runtime = new Runtime(stage);
const player = new Player(runtime.world, runtime.input, runtime.view.camera, true);
const build = new Build(runtime.world);
const mark = new Mark(runtime.view.scene);
let selected = { type: 'block', id: 1, name: 'Stone' };

runtime.world.set(0, 0, 0, 1, 1);
player.spawn(0.5, 1.001, 0.5);

function active(button) {
  for (const node of document.querySelectorAll('#palette button, #markers button')) node.classList.remove('active');
  button.classList.add('active');
}

function choose(type, id, name, button) {
  selected = { type, id, name };
  mode.textContent = `Selected: ${name}`;
  active(button);
}

for (const block of all()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = block.name;
  if (block.id === 1) button.classList.add('active');
  button.addEventListener('click', () => choose('block', block.id, block.name, button));
  palette.append(button);
}

for (const def of defs) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = def.name;
  button.addEventListener('click', () => choose('marker', def, def.name, button));
  markers.append(button);
}

runtime.tick = dt => {
  player.tick(dt);
  if (!runtime.input.locked) return;
  const hit = cast(runtime.world, runtime.view.camera, tune.reach);
  if (runtime.input.click(0)) build.break(hit, true);
  if (runtime.input.click(2) && hit) {
    if (selected.type === 'block') {
      build.place(hit, selected.id, player, 1);
    } else {
      mark.set(selected.id, {
        x: hit.x + hit.face.x,
        y: hit.y + hit.face.y,
        z: hit.z + hit.face.z
      });
    }
  }
};

runtime.frame = alpha => player.frame(alpha);

clear.addEventListener('click', () => {
  if (selected.type !== 'marker') return;
  mark.clear(selected.id);
});

save.addEventListener('click', () => {
  const data = write(runtime.world, mark.data);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'map.json';
  link.click();
  URL.revokeObjectURL(url);
});

load.addEventListener('change', async () => {
  const file = load.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const marks = read(runtime.world, data);
    mark.load(marks);
    player.spawn(0.5, 1.001, 0.5);
    player.flight = false;
  } catch (cause) {
    alert(cause instanceof Error ? cause.message : 'Could not load map.');
  } finally {
    load.value = '';
  }
});

runtime.start();
