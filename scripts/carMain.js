// Configuração básica do Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Posicionando a câmera
camera.position.z = 5;

// Carregando o vertex shader
const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Carregando o fragment shader
const fragmentShader = `
    uniform sampler2D reflectionTexture;
    uniform float transparency;
    uniform float distortionFactor;
    uniform float time;

    varying vec2 vUv;

    void main() {
        vec2 distortedUv = vUv + vec2(sin(vUv.y * 10.0 + time) * 0.02, cos(vUv.x * 10.0 + time) * 0.02) * distortionFactor;
        vec4 reflectionColor = texture2D(reflectionTexture, distortedUv);
        reflectionColor.a *= transparency;
        gl_FragColor = reflectionColor;
    }
`;

// Uniforms do shader
const uniforms = {
    reflectionTexture: { value: null },
    transparency: { value: 0.5 },
    distortionFactor: { value: 0.1 },
    time: { value: 0.0 }
};

// Criando o material com shader customizado
const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true
});

// Criando o plano
const geometry = new THREE.PlaneGeometry(5, 5);
const plane = new THREE.Mesh(geometry, shaderMaterial);
scene.add(plane);

// Carregando a textura de reflexão
const textureLoader = new THREE.TextureLoader();
textureLoader.load('texture/reflectionTexture.jpg', (texture) => {
    shaderMaterial.uniforms.reflectionTexture.value = texture;
});

// Loop de animação
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Atualiza o tempo no shader
    shaderMaterial.uniforms.time.value = elapsedTime;

    renderer.render(scene, camera);
}

animate();

// Ajustar o tamanho da tela ao redimensionar a janela
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});