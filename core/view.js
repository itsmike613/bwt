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
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const width = this.node.clientWidth || innerWidth;
    const height = this.node.clientHeight || innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render.setSize(width, height, false);
  }

  draw() {
    this.render.render(this.scene, this.camera);
  }
}

export { View };
