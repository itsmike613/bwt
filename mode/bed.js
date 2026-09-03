import * as THREE from 'three';

function make(team, pos) {
  const group = new THREE.Group();
  const color = team === 'red' ? 0xc94e4e : 0x4f79cc;
  const cloth = new THREE.MeshLambertMaterial({ color });
  const wood = new THREE.MeshLambertMaterial({ color: 0x8b6a45 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.9), cloth);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.9), wood);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.9), wood);
  head.position.x = -0.81;
  foot.position.x = 0.81;
  base.position.y = 0.34;
  head.position.y = 0.23;
  foot.position.y = 0.23;
  group.add(base, head, foot);
  group.position.set(pos.x + 0.5, pos.y, pos.z + 0.5);
  group.userData.team = team;
  group.traverse(node => {
    if (node.isMesh) node.userData.team = team;
  });
  return group;
}

class Beds {
  constructor(scene, markers) {
    this.scene = scene;
    this.groups = new Map();
    this.ray = new THREE.Raycaster();
    this.center = new THREE.Vector2();
    for (const team of ['red', 'blue']) {
      const pos = markers?.[team]?.bed;
      if (!pos) continue;
      const group = make(team, pos);
      scene.add(group);
      this.groups.set(team, group);
    }
  }

  sync(state) {
    for (const [team, group] of this.groups) group.visible = Boolean(state?.beds?.[team]);
  }

  hit(camera, reach) {
    this.ray.setFromCamera(this.center, camera);
    this.ray.far = reach;
    const list = this.ray.intersectObjects([...this.groups.values()], true);
    const hit = list.find(item => {
      const team = item.object.userData.team;
      return this.groups.get(team)?.visible;
    });
    if (!hit) return null;
    return { team: hit.object.userData.team, dist: hit.distance };
  }

  close() {
    for (const group of this.groups.values()) {
      group.traverse(node => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
      group.parent?.remove(group);
    }
    this.groups.clear();
  }
}

export { Beds };
