function wrap(value) {
  const turn = Math.PI * 2;
  return ((value + Math.PI) % turn + turn) % turn - Math.PI;
}

function face(yaw) {
  return wrap(yaw + Math.PI);
}

function turn(value, goal, mix) {
  return wrap(value + wrap(goal - value) * Math.max(0, Math.min(1, mix)));
}

export { face, turn, wrap };
