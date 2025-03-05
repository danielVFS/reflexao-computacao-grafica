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
  camera.position.set(0, 0, 500);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  //   controls.autoRotate = true;
  //   controls.autoRotateSpeed = 1.5;
  //   controls.enableDamping = true;

  pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(200, 200, 200);
  scene.add(pointlight);

  let envmaploader = new THREE.PMREMGenerator(renderer);
  new THREE.RGBELoader().load(
    "texture/cayley_interior_4k.hdr",
    function (hdrmap) {
      let envmap = envmaploader.fromCubemap(hdrmap);

      // Adicionar a esfera
      let sphere = createSphere(envmap);
      sphere.position.set(0, 0, 100); // Posicionada à frente do plano (z positivo)
      scene.add(sphere);

      reflectionRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
      });

      // Adicionar o plano (para-brisa)
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
            // Calcular a reflexão
            vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
            vec3 reflectDirection = reflect(-viewDirection, vNormal);

            // Aplicar distorção ao vetor de reflexão
            reflectDirection.xy *= uDistortionFactor;

            // Mapear a reflexão para coordenadas de textura
            vec2 reflectionUV = reflectDirection.xy * 0.5 + 0.5;

            // Amostrar a textura de reflexão
            vec4 reflectionColor = texture2D(uReflectionTexture, reflectionUV);

            // Aplicar transparência
            gl_FragColor = vec4(reflectionColor.rgb, uTransparency);
          }
        `,
        transparent: true,
        uniforms: {
          uReflectionTexture: { value: reflectionRenderTarget.texture },
          uTransparency: { value: 0.2 },
          uDistortionFactor: { value: 1.5 },
        },
        clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 0, -1), 50)],
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.set(0, 0, 100); // Plano posicionado em z = -200
      scene.add(plane);

      animate();
    }
  );
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

function renderReflection() {
  // Criar uma câmera de reflexão
  const reflectionCamera = camera.clone();

  // Posicionar a câmera de reflexão atrás do plano
  const planePosition = new THREE.Vector3(0, 0, -200);
  const distanceToPlane = camera.position.z - planePosition.z;
  reflectionCamera.position.z = planePosition.z - distanceToPlane;

  // Ajustar a rotação da câmera de reflexão
  reflectionCamera.rotation.y = Math.PI;

  // Renderizar a cena refletida no framebuffer
  renderer.setRenderTarget(reflectionRenderTarget);
  renderer.render(scene, reflectionCamera);
  renderer.setRenderTarget(null);
}

function animate() {
  requestAnimationFrame(animate);

  // Renderizar a reflexão
  renderReflection();

  // Atualizar a textura de reflexão no shader
  scene.traverse((child) => {
    if (
      child.material &&
      child.material.uniforms &&
      child.material.uniforms.uReflectionTexture
    ) {
      child.material.uniforms.uReflectionTexture.value =
        reflectionRenderTarget.texture;
    }
  });

  // Atualizar controles e renderizar a cena principal
  controls.update();
  renderer.render(scene, camera);
}

init();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
