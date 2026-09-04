import * as THREE from 'three';

class View {
  constructor(node) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87b7e8);
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 500);
    this.render = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.render.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.render.outputColorSpace = THREE.SRGBColorSpace;
    node.append(this.render.domElement);

    const sky = new THREE.HemisphereLight(0xffffff, 0x59606b, 1.8);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(20, 35, 12);
    this.scene.add(sky, sun);

    this.node = node;
    this.closed = false;
    this.bound = () => this.resize();
    this.resize();
    addEventListener('resize', this.bound);
  }

  resize() {
    if (this.closed) return;
    const width = this.node.clientWidth || innerWidth;
    const height = this.node.clientHeight || innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render.setSize(width, height, false);
  }

  draw() {
    if (!this.closed) this.render.render(this.scene, this.camera);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    removeEventListener('resize', this.bound);
    this.render.setAnimationLoop?.(null);
    this.render.renderLists?.dispose?.();
    this.render.dispose();
    this.render.forceContextLoss?.();
    this.render.domElement.remove();
    this.scene.clear();
  }
}

export { View };
