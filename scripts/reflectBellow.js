let scene, camera, renderer, controls, reflectionRenderTarget, planeMaterial;

function init() {
  // Cena
  scene = new THREE.Scene();

  // Renderer
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
  camera.position.set(0, 100, 300);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  const pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(200, 200, 200);
  scene.add(pointlight);

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
        vec3 normal = normalize(vNormal);

        vec3 reflectDirection = reflect(-viewDirection, normal);
        reflectDirection.xy *= uDistortionFactor; // Aplicar distorção

        vec2 reflectionUV = reflectDirection.xy * 0.5 + 0.5;

        vec4 reflectionColor = texture2D(uReflectionTexture, reflectionUV);
        
        gl_FragColor = vec4(reflectionColor.rgb, uTransparency);
      }
    `,
    transparent: true,
    uniforms: {
      uReflectionTexture: { value: reflectionRenderTarget.texture },
      uTransparency: { value: 0.5 },
      uDistortionFactor: { value: 1.5 },
    },
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2; 
  plane.position.set(0, 0, 0);
  plane.name = "reflectionPlane"; 
  scene.add(plane);

  animate();
}

function createSphere() {
  const geometry = new THREE.SphereGeometry(50, 64, 64);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 0.5,
    roughness: 0.2,
  });
  return new THREE.Mesh(geometry, material);
}

function createCube() {
  const geometry = new THREE.BoxGeometry(50, 50, 50);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0080ff,
    metalness: 0.5,
    roughness: 0.2,
  });
  return new THREE.Mesh(geometry, material);
}

function renderReflection() {
  const reflectionCamera = camera.clone();

  reflectionCamera.position.y = -camera.position.y;
  reflectionCamera.rotation.x = -camera.rotation.x; 

  reflectionCamera.lookAt(scene.position);

  const plane = scene.getObjectByName("reflectionPlane");
  plane.visible = false;

  renderer.setRenderTarget(reflectionRenderTarget);
  renderer.render(scene, reflectionCamera);
  renderer.setRenderTarget(null);

  plane.visible = true;
}

function animate() {
  requestAnimationFrame(animate);
  renderReflection();
  renderer.render(scene, camera);
  controls.update();
}

init();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});