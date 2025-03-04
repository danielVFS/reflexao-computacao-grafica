import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//import * as THREE from 'https://esm.sh/three';
//import { GLTFLoader } from 'https://esm.sh/three/examples/jsm/loaders/GLTFLoader.js';

// Configuração básica do Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Posicionando a câmera
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

// Adicionando luzes
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

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

// Criando o plano (para-brisa)
const planeGeometry = new THREE.PlaneGeometry(5, 5);
const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
plane.rotation.x = -Math.PI / 2; // Rotaciona o plano para ficar horizontal
plane.position.y = 1; // Posiciona o plano acima do chão
scene.add(plane);

// Criar um render target para a reflexão
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
shaderMaterial.uniforms.reflectionTexture.value = renderTarget.texture;

// Função para renderizar a cena no render target
function renderReflection() {
    // Salvar a posição original da câmera
    const originalCameraPosition = camera.position.clone();

    // Posicionar a câmera para renderizar a reflexão
    const reflectionCamera = camera.clone();
    reflectionCamera.position.y = -camera.position.y; // Inverte a posição da câmera
    reflectionCamera.rotation.x = -camera.rotation.x; // Inverte a rotação da câmera

    // Renderizar a cena no render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, reflectionCamera);
    renderer.setRenderTarget(null);

    // Restaurar a posição original da câmera
    camera.position.copy(originalCameraPosition);
}

// Carregando o modelo 3D do carro
const gltfLoader = new GLTFLoader(); // Usando o GLTFLoader carregado via <script>
gltfLoader.load('models/2021_bmw_m4/scene.gltf', (gltf) => {
    const car = gltf.scene;
    car.scale.set(0.5, 0.5, 0.5); // Ajusta o tamanho do carro
    car.position.set(0, 0, 0); // Posiciona o carro
    scene.add(car);
});

// Adicionando objetos ao redor
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(3, 0.5, 0); // Posiciona o cubo ao lado do carro
scene.add(cube);

const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(-3, 0.5, 0); // Posiciona a esfera ao lado do carro
scene.add(sphere);

// Loop de animação
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Atualiza o tempo no shader
    shaderMaterial.uniforms.time.value = elapsedTime;

    // Renderizar a reflexão
    renderReflection();

    // Renderizar a cena principal
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