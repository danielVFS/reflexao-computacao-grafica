let scene, camera, renderer, controls, pointlight;

function init() {
  scene = addScene();
  renderer = createRenderer();
  camera = setCamera();
  controls = setControls();
  pointlight = setPointLight();
  scene.add(pointlight);

  let envmaploader = new THREE.PMREMGenerator(renderer);

  new THREE.RGBELoader().load(
    "texture/cayley_interior_4k.hdr",
    function (hdrmap) {
      let envmap = envmaploader.fromCubemap(hdrmap);

      let sphere = createSphere(envmap);
      scene.add(sphere);
      animate(controls, renderer);
    }
  );
}

init();
