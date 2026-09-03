import { Runtime } from '../core/runtime.js';
import { Player } from '../core/player.js';
import { Build } from '../core/build.js';
import { cast } from '../core/ray.js';
import { read } from '../core/map.js';
import { move as tune } from '../data/tune.js';

async function play() {
  const landing = document.querySelector('#landing');
  const stage = document.querySelector('#stage');
  const hud = document.querySelector('#hud');
  const response = await fetch('./data/map.json');
  const data = await response.json();
  landing.hidden = true;
  stage.hidden = false;
  hud.hidden = false;
  const runtime = new Runtime(stage);
  read(runtime.world, data);
  const player = new Player(runtime.world, runtime.input, runtime.view.camera);
  const build = new Build(runtime.world);
  player.spawn(0.5, 1.01, 0.5);
  let selected = 2;

  runtime.tick = dt => {
    if (runtime.input.press('Digit1')) selected = 2;
    if (runtime.input.press('Digit2')) selected = 3;
    if (runtime.input.press('Digit3')) selected = 4;
    if (runtime.input.press('Digit4')) selected = 5;
    player.tick(dt);
    if (!runtime.input.locked) return;
    const left = runtime.input.click(0);
    const right = runtime.input.click(2);
    if (!left && !right) return;
    const hit = cast(runtime.world, runtime.view.camera, tune.reach);
    if (left) build.break(hit, false);
    if (right) build.place(hit, selected, player, 2);
  };
  runtime.frame = alpha => player.frame(alpha);
  runtime.start();
}

export { play };
