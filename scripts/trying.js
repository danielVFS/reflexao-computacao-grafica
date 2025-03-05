let scene, camera, renderer, controls, pointlight, reflectionRenderTarget;

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
  camera.position.set(100, 0, 500);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(200, 200, 200);
  scene.add(pointlight);

  let envmaploader = new THREE.PMREMGenerator(renderer);
  new THREE.RGBELoader().load(
    "texture/cayley_interior_4k.hdr",
    function (hdrmap) {
      let envmap = envmaploader.fromCubemap(hdrmap);

      // Esfera à frente do plano
      let sphere1 = createSphere(envmap);
      sphere1.position.set(0, 0, 100);
      scene.add(sphere1);

      // Esfera atrás do plano
      let sphere2 = createSphere(envmap);
      sphere2.position.set(-50, 0, -100);
      scene.add(sphere2);

      reflectionRenderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
      });

      // Plano (para-brisa)
      const planeGeometry = new THREE.PlaneGeometry(300, 300);
      const planeMaterial = new THREE.ShaderMaterial({
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
          uTransparency: { value: 0.2 },
          uDistortionFactor: { value: 1.5 },
        },
      });

      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.renderOrder = 1;
      plane.position.set(0, 0, 0);
      scene.add(plane);

      animate();
    }
  );
}

function createSphere(envmap) {
  let texture = new THREE.CanvasTexture(new THREE.FlakesTexture());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);

  const ballMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 0,
    clearcoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.1,
    // color: 0x8418ca,
    normalMap: texture,
    envMap: envmap.texture,
    normalScale: new THREE.Vector2(0.0, 0.0),
  });

  return new THREE.Mesh(new THREE.SphereGeometry(100, 64, 64), ballMaterial); // (100, 64, 64)
}

function renderReflection() {
  const reflectionCamera = camera.clone();
  const planePosition = new THREE.Vector3(0, 0, 0);
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
