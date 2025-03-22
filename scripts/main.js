let scene, camera, renderer, controls, pointLight, reflectionRenderTarget, reflectionCamera;

function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.localClippingEnabled = true; 

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 0, 500);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  let cubeColored = createColoredCube(); 
  cubeColored.position.set(130, 50, 150);
  scene.add(cubeColored);

  let cube = createCube(); 
  cube.position.set(-130, 50, -150);
  scene.add(cube);

  reflectionRenderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
  });

  reflectionCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);

  const planeGeometry = new THREE.PlaneGeometry(600, 600);
  const planeMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      precision mediump float;
      out vec3 vWorldPosition;
      out vec3 vNormal;
      void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D uReflectionTexture;
      uniform float uTransparency;
      uniform vec3 uBaseColor;
      in vec3 vWorldPosition;
      in vec3 vNormal;
      out vec4 fragColor;
      void main() {
        vec2 uv = (vWorldPosition.xz + vec2(400.0)) / 600.0;
        vec4 reflectionColor = texture(uReflectionTexture, uv);
        vec3 finalColor = mix(uBaseColor, reflectionColor.rgb, 0.6);
        fragColor = vec4(finalColor, uTransparency);
      }
    `,
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
    uniforms: {
      uReflectionTexture: { value: reflectionRenderTarget.texture },
      uTransparency: { value: 0.5 },
      uBaseColor: { value: new THREE.Color(0x888888) },
    },
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(-120, 0, 20);
  scene.add(plane);

  animate();
}

function createColoredCube() {
  const geometry = new THREE.BoxGeometry(50, 64, 64);
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), 
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), 
    new THREE.MeshBasicMaterial({ color: 0x0000ff }), 
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), 
    new THREE.MeshBasicMaterial({ color: 0xff00ff }), 
    new THREE.MeshBasicMaterial({ color: 0x00ffff }), 
    new THREE.MeshPhysicalMaterial({
        metalness: 0.5,
        roughness: 0.2,
      })
  ];
  return new THREE.Mesh(geometry, materials);
}

function createCube() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshPhysicalMaterial({
      color: 0x0080ff,
      metalness: 0.5,
      roughness: 0.2,
    })
  );
}

function renderReflection() {
  const reflectionCamera = camera.clone();
  reflectionCamera.position.y = -camera.position.y;
  reflectionCamera.lookAt(new THREE.Vector3(0, 0, 0));

  const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  renderer.clippingPlanes = [clippingPlane];

  renderer.setRenderTarget(reflectionRenderTarget);
  renderer.render(scene, reflectionCamera);
  renderer.setRenderTarget(null);

  renderer.clippingPlanes = [];

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