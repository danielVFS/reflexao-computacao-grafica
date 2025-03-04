function addScene() {
  return new THREE.Scene();
}

function createRenderer() {
  let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  return renderer;
}

function setCamera() {
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 0, 500);

  return camera;
}

function setControls() {
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;
  controls.enableDamping = true;

  return controls;
}

function setPointLight() {
  let pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(200, 200, 200);
  return pointlight;
}

function createSphere(envmap) {
  let texture = new THREE.CanvasTexture(new THREE.FlakesTexture());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.x = 10;
  texture.repeat.y = 10;

  const ballMaterial = {
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.5,
    color: 0x8418ca,
    normalMap: texture,
    envMap: envmap.texture,
    normalScale: new THREE.Vector2(0.15, 0.15),
  };

  let ballGeo = new THREE.SphereGeometry(100, 64, 64);
  let ballMat = new THREE.MeshPhysicalMaterial(ballMaterial);
  return new THREE.Mesh(ballGeo, ballMat);
}

function animate(controls, renderer) {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(() => animate(controls, renderer));
}
