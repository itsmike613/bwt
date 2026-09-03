import * as THREE from 'three';

function cast(world, camera, reach = 5) {
  const origin = camera.position.clone();
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);
  const sx = Math.sign(dir.x) || 1;
  const sy = Math.sign(dir.y) || 1;
  const sz = Math.sign(dir.z) || 1;
  const dx = dir.x === 0 ? Infinity : Math.abs(1 / dir.x);
  const dy = dir.y === 0 ? Infinity : Math.abs(1 / dir.y);
  const dz = dir.z === 0 ? Infinity : Math.abs(1 / dir.z);
  let tx = dir.x === 0 ? Infinity : ((sx > 0 ? x + 1 : x) - origin.x) / dir.x;
  let ty = dir.y === 0 ? Infinity : ((sy > 0 ? y + 1 : y) - origin.y) / dir.y;
  let tz = dir.z === 0 ? Infinity : ((sz > 0 ? z + 1 : z) - origin.z) / dir.z;
  let dist = 0;
  let face = { x: 0, y: 0, z: 0 };

  while (dist <= reach) {
    if (world.get(x, y, z)) return { x, y, z, face, dist };
    if (tx < ty && tx < tz) {
      x += sx;
      dist = tx;
      tx += dx;
      face = { x: -sx, y: 0, z: 0 };
    } else if (ty < tz) {
      y += sy;
      dist = ty;
      ty += dy;
      face = { x: 0, y: -sy, z: 0 };
    } else {
      z += sz;
      dist = tz;
      tz += dz;
      face = { x: 0, y: 0, z: -sz };
    }
  }
  return null;
}

export { cast };
