import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AudioListener, AudioLoader, Audio } from 'https://cdn.skypack.dev/three@0.132.2';
import TWEEN from 'https://cdn.skypack.dev/@tweenjs/tween.js';
import { gsap } from 'https://cdn.skypack.dev/gsap';

// Create the scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Set the starting camera position higher and farther back
camera.position.set(10, 10, 10); // Move the camera up and farther back

// Rotate the camera to look downwards (on the x-axis)
camera.rotation.x = -Math.PI / 6; // Rotate downwards (30 degrees)

// Create a renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Tone mapping and gamma correction
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false; // Disable panning with the middle mouse button
controls.enableZoom = true; // Enable zooming with the scroll wheel
controls.mouseButtons = { LEFT: THREE.MOUSE.LEFT }; // Allow only left mouse button for movement

// Set zoom limits
controls.minDistance = 0.5;  // Minimum distance (zoom in)
controls.maxDistance = 4.5;   // Maximum distance (zoom out)

// Function to enforce spherical camera bounds
function enforceSphericalBounds() {
    const cameraDistance = camera.position.length(); // Distance from the origin (center)
    if (cameraDistance < controls.minDistance) {
        camera.position.setLength(controls.minDistance);
    } else if (cameraDistance > controls.maxDistance) {
        camera.position.setLength(controls.maxDistance);
    }
}


// Bloom effect parameters
const params = {
    exposure: 1.0,
    bloomStrength: 2,
    bloomThreshold: 0.0,
    bloomRadius: 0.5
};

// Set up the bloom composer
const composer = new EffectComposer(renderer);
const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), params.bloomStrength, params.bloomRadius, params.bloomThreshold);
composer.addPass(bloomPass);

// Add ambient lighting
const ambientLight = new THREE.AmbientLight(0xffcc99, 0.05);
scene.add(ambientLight);

// Add a PointLight for the lamp post
const lampLight = new THREE.PointLight(0xffffff, 0.3, 50);
lampLight.position.set(0, 5, 0);
lampLight.castShadow = true;
scene.add(lampLight);

let rotatingObject = null; // Variable to store the object (Akata)

// Load the GLB model and add it to the scene
const loader = new GLTFLoader();
loader.load('./assets/ramenx.glb', function (gltf) {
    scene.add(gltf.scene); // Add the loaded model to the scene

    // Find the object (Akata)
    rotatingObject = gltf.scene.getObjectByName('Akata');

    if (!rotatingObject) {
        console.error('Object Akata not found!');
    } else {
        console.log('Akata found:', rotatingObject);
    }

    // Apply bloom effect to the purple lamp post light
    const purpleLamp = gltf.scene.getObjectByName('Cylinder.017');
    if (purpleLamp) {
        purpleLamp.material.emissive = new THREE.Color(0x800080);
        purpleLamp.material.emissiveIntensity = 1.5;
    }

    // Apply bloom effect to the white front sign
    const whiteSign = gltf.scene.getObjectByName('Plane.091');
    if (whiteSign) {
        whiteSign.material.emissive = new THREE.Color(0xffffff);
        whiteSign.material.emissiveIntensity = 0;
    }
}, undefined, function (error) {
    console.error('Error loading the GLB model:', error);
});

// Create a floating screen with PNG frames
const frames = [
    './assets/frame1.png',
    './assets/frame2.png',
    './assets/frame3.png',
    './assets/frame4.png',
    './assets/frame5.png'
];

let frame = 0;
const textureLoader = new THREE.TextureLoader();
let texture = textureLoader.load(frames[frame], function (texture) {
    floatingScreenMaterial.map = texture;
}, undefined, function (error) {
    console.error('Error loading texture:', error);
});

// Create a plane geometry for the floating screen
const floatingGeometry = new THREE.PlaneGeometry(2, 2);
const floatingScreenMaterial = new THREE.MeshBasicMaterial({ map: texture });
const floatingScreen = new THREE.Mesh(floatingGeometry, floatingScreenMaterial);
floatingScreen.position.set(-1.15, 0.9, 1.64);
floatingScreen.scale.set(0.23, 0.3, 0.4);
scene.add(floatingScreen);

// Cycle through frames every second
let intervalId = setInterval(() => {
    frame = (frame + 1) % frames.length;
    textureLoader.load(frames[frame], function (newTexture) {
        floatingScreenMaterial.map = newTexture;
        floatingScreenMaterial.map.needsUpdate = true;
    }, undefined, function (error) {
        console.error('Error loading texture:', error);
    });
}, 1000);

// Add project PNG placeholders here
const projectFiles = [
    './assets/project1.png',
    './assets/project2.png',
    './assets/project3.png',
    './assets/project4.png'
];

function createProjectPlaceholder(texturePath, x, y, z) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(texturePath);

    const planeGeometry = new THREE.PlaneGeometry(1, 1); // Adjust size as needed
    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    plane.position.set(x, y, z); // Set initial position
    plane.rotation.set(0, 0, 0); // Set initial rotation

    scene.add(plane);
    return plane;
}

const project1 = createProjectPlaceholder(projectFiles[0], -1.5, 2, 0);
project1.rotation.set(0, -Math.PI / 2, 0); // Rotate 90 degrees to the left on the y-axis

// Position project2 to the left of project1
const project2 = createProjectPlaceholder(projectFiles[1], -1.5, 2, 1);
project2.rotation.set(0, -Math.PI / 2, 0); // Same rotation to face left

// Position project3 to the right of project1
const project3 = createProjectPlaceholder(projectFiles[2], -1.5, 2, -1);
project3.rotation.set(0, -Math.PI / 2, 0); // Same rotation to face left

// Position project4 above project1
const project4 = createProjectPlaceholder(projectFiles[3], -1.5, 1, 0);
project4.rotation.set(0, -Math.PI / 2, 0); // Same rotation to face left

// Add zoom-in functionality for project1-4 placeholders
function handleProjectClick(target) {
    // Lock rotation and panning, but keep zoom enabled
    controls.enableRotate = false; // Lock camera rotation
    controls.enablePan = false;    // Lock panning
    controls.enableZoom = true;    // Keep zoom enabled

    // Adjust the camera position for a more direct view (reduce y-position for less steep angle)
    gsap.to(camera.position, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: target.position.x + Math.sin(target.rotation.y) * 0.8,  // Adjust horizontal distance
        y: target.position.y + 0.3,   // Lower the height for a more direct view (reduce to 0.3)
        z: target.position.z + Math.cos(target.rotation.y) * 0.8   // Adjust depth distance
    });

    // Set the camera to look directly at the target by updating the controls target
    gsap.to(controls.target, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: target.position.x,
        y: target.position.y,
        z: target.position.z
    });
}

// Combined event listener for screen and project PNG clicks
window.addEventListener('click', function (event) {
    // Raycaster to detect clicks on floatingScreen and project PNGs
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Detect floating screen click
    const intersectsFloatingScreen = raycaster.intersectObject(floatingScreen);
    if (intersectsFloatingScreen.length > 0) {
        clearInterval(intervalId); // Stop cycling frames
        handleProjectClick(floatingScreen); // Zoom to floating screen
    }

    // Detect project PNG clicks
    const projects = [project1, project2, project3, project4];
    projects.forEach((project) => {
        const intersectsProject = raycaster.intersectObject(project);
        if (intersectsProject.length > 0) {
            handleProjectClick(project); // Zoom to the clicked project
        }
    });
});

// Function to unlock camera controls and reset the camera when back button is pressed
function unlockCameraControls() {
    controls.enableRotate = true;  // Unlock rotation
    controls.enableZoom = true;    // Unlock zoom
    controls.enablePan = true;     // Unlock panning

    // Reset the camera to its default position
    gsap.to(camera.position, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: 0,
        y: 2,
        z: 4  // Default camera position
    });

    gsap.to(controls.target, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: 0,
        y: 0,
        z: 0  // Default camera target
    });
}

// Add event listener for the back button
document.getElementById('backButton').addEventListener('click', function () {
    unlockCameraControls();  // Unlock the camera when the back button is clicked
});

// Add background audio listener
const listener = new THREE.AudioListener();
camera.add(listener);  // Attach the listener to the camera

// Create the audio object and attach it to the listener
const sound = new THREE.Audio(listener);

// Load the audio file
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./assets/background-music.mp3', function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);  // Set to loop the background music
    sound.setVolume(0.3); // Adjust volume
    console.log('Audio loaded successfully.');
});

// Play the audio after user interaction (click event)
window.addEventListener('click', function () {
    if (!sound.isPlaying) {
        sound.play();  // Play the audio
    }
});

function animate() {
    requestAnimationFrame(animate);

    // Rotate the object (Akata) on a different axis (e.g., x or y) continuously if it's loaded
    if (rotatingObject) {
        rotatingObject.rotation.x += -0.02;  // Spins around the x-axis
        // rotatingObject.rotation.y += 0.02;  // Uncomment to spin around the y-axis instead
        // rotatingObject.rotation.z += 0.02;  // Default z-axis rotation, reverse with -= 0.02
    }

    controls.update();
    composer.render();
    enforceSphericalBounds();
}
animate();

// Handle window resize
window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
});
