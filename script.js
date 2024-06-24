// Szene, Kamera und Renderer erstellen
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Pixelverhältnis anpassen
document.body.appendChild(renderer.domElement);

// Hintergrundfarbe setzen
scene.background = new THREE.Color(0x87CEEB); // Himmelsblau

// Licht hinzufügen
const ambientLight = new THREE.AmbientLight(0x404040); // weiches Umgebungslicht
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Kamera-Position setzen
camera.position.set(3, 2, 5); // x, y, z Position
camera.lookAt(0, 0, 0); // Blickpunkt (Zentrum der Szene)

// GLTF-Modell laden
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('glb/Gotthard_2.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    const mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat); // Endlos wiederholen
        action.play();
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);
        renderer.render(scene, camera);
    }

    animate();
}, undefined, (error) => {
    console.error(error);
});

// dat.GUI zur Steuerung hinzufügen
const gui = new dat.GUI();
gui.domElement.classList.add('gui-container');

// Kamera-Steuerung
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(camera.position, 'x', -10, 10).name('Position X').onChange(() => updateCamera());
cameraFolder.add(camera.position, 'y', -10, 10).name('Position Y').onChange(() => updateCamera());
cameraFolder.add(camera.position, 'z', -10, 10).name('Position Z').onChange(() => updateCamera());
cameraFolder.open();

function updateCamera() {
    camera.lookAt(0, 0, 0); // Blickpunkt (Zentrum der Szene) nach der Positionsänderung beibehalten
}

// Licht-Steuerung
const lightFolder = gui.addFolder('Light Settings');

// Ambient Light
const ambientLightFolder = lightFolder.addFolder('Ambient Light');
ambientLightFolder.addColor({ color: ambientLight.color.getHex() }, 'color').name('Color').onChange((value) => {
    ambientLight.color.setHex(value);
});
ambientLightFolder.add(ambientLight, 'intensity', 0, 2).name('Intensity');
ambientLightFolder.open();

// Directional Light
const directionalLightFolder = lightFolder.addFolder('Directional Light');
directionalLightFolder.addColor({ color: directionalLight.color.getHex() }, 'color').name('Color').onChange((value) => {
    directionalLight.color.setHex(value);
});
directionalLightFolder.add(directionalLight, 'intensity', 0, 2).name('Intensity');
directionalLightFolder.add(directionalLight.position, 'x', -10, 10).name('Position X');
directionalLightFolder.add(directionalLight.position, 'y', -10, 10).name('Position Y');
directionalLightFolder.add(directionalLight.position, 'z', -10, 10).name('Position Z');
directionalLightFolder.open();

lightFolder.open();

// Funktion zum Abrufen der Temperaturdaten von Open-Meteo
async function fetchTemperature() {
    const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=46.6667&longitude=8.5667&current_weather=true';
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.current_weather.temperature;
    } catch (error) {
        console.error('Fehler beim Abrufen der Wetterdaten:', error);
    }
}

// 3D-Textobjekt erstellen und Temperatur anzeigen
let textMesh;
const loader = new THREE.FontLoader();

async function createTemperatureText() {
    const temperature = await fetchTemperature();
    if (temperature === undefined) {
        console.error('Temperaturdaten konnten nicht abgerufen werden.');
        return;
    }
    const tempText = `Temperature: ${temperature}°C`;

    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new THREE.TextGeometry(tempText, {
            font: font,
            size: 0.5, // Kleinere Schriftgröße
            height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Text mittig in der Szene platzieren
        textGeometry.computeBoundingBox();
        const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
        textMesh.position.set(centerOffset, 2, 0); // Etwas höher platzieren
        
        scene.add(textMesh);
    });
}

// Temperaturtext erstellen
createTemperatureText();

// Temperaturtext regelmäßig aktualisieren
setInterval(async () => {
    if (textMesh) {
        const temperature = await fetchTemperature();
        if (temperature === undefined) {
            console.error('Temperaturdaten konnten nicht abgerufen werden.');
            return;
        }
        const tempText = `Temperature: ${temperature}°C`;

        // Entferne das alte Text-Objekt
        scene.remove(textMesh);
        
        // Erstelle ein neues Text-Objekt mit der aktualisierten Temperatur
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const textGeometry = new THREE.TextGeometry(tempText, {
                font: font,
                size: 0.5, // Kleinere Schriftgröße
                height: 0.1,
            });
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            // Text mittig in der Szene platzieren
            textGeometry.computeBoundingBox();
            const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
            textMesh.position.set(centerOffset, 2, 0); // Etwas höher platzieren
            
            scene.add(textMesh);
        });
    }
}, 300000); // Aktualisiere alle 5 Minuten (300000 Millisekunden)

// Fenstergrößeänderungen handhaben
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}