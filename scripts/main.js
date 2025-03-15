let scene, camera, renderer, controls, pointLight, reflectionRenderTarget;

function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.localClippingEnabled = true;

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(200, 200, 200);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  pointLight = new THREE.PointLight(0xffffff, 1.5);
  pointLight.position.set(200, 200, 200);
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const sphere = createSphere();
  sphere.position.set(-100, 50, 0);
  scene.add(sphere);

  const cube = createCube();
  cube.position.set(100, 50, 0);
  scene.add(cube);

  reflectionRenderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
  });

  const planeGeometry = new THREE.PlaneGeometry(500, 500);
  planeMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
  
      void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uReflectionTexture;
      uniform float uTransparency;
      uniform float uDistortionFactor;
  
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
  
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        vec3 reflectDirection = reflect(-viewDirection, vNormal);
  
        reflectDirection.xy *= uDistortionFactor;
  
        vec2 reflectionUV = reflectDirection.xy * 0.5 + 0.5;
  
        vec4 reflectionColor = texture2D(uReflectionTexture, reflectionUV);
  
        gl_FragColor = vec4(reflectionColor.rgb, uTransparency);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    uniforms: {
      uReflectionTexture: { value: reflectionRenderTarget.texture },
      uTransparency: { value: 0.7 }, 
      uDistortionFactor: { value: 1.0 }, 
      cameraPosition: { value: camera.position },
    },
  });


  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.y = Math.PI / 2;
  plane.position.set(0, 50, 0);
  plane.name = "dividerPlane";
  scene.add(plane);

  animate();
}

function createSphere() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      metalness: 0.5,
      roughness: 0.2,
    })
  );
}

function createCube() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(50, 50, 50),
    new THREE.MeshPhysicalMaterial({
      color: 0x0080ff,
      metalness: 0.5,
      roughness: 0.2,
    })
  );
}

function renderReflection() {
  const reflectionCamera = camera.clone();
  const plane = scene.getObjectByName("dividerPlane");

  const planePosition = plane.position.clone();
  const distanceToPlane = camera.position.z - planePosition.z;
  reflectionCamera.position.z = planePosition.z - distanceToPlane;
  reflectionCamera.lookAt(planePosition);

  renderer.setRenderTarget(reflectionRenderTarget);
  renderer.render(scene, reflectionCamera);
  renderer.setRenderTarget(null);
}

function animate() {
  requestAnimationFrame(animate);
  renderReflection();
  controls.update();
  renderer.render(scene, camera);
}

init();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});