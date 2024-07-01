// Szene, Kamera und Renderer erstellen 🏞️ 🎥 👾
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Pixelverhältnis anpassen
document.body.appendChild(renderer.domElement);

// Hintergrundfarbe setzen 🟦
scene.background = new THREE.Color(0x87CEEB); // Himmelsblau

// Licht hinzufügen 💡
const ambientLight = new THREE.AmbientLight(0x404040); // weiches Umgebungslicht
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(1, 1.2, 0.8).normalize();
scene.add(directionalLight);

// Kamera-Position setzen 🎥
camera.position.set(3, 2, 5); // x, y, z Position
camera.lookAt(0, 0, 0); // Blickpunkt (Zentrum der Szene)

// GLTF-Modell laden 🖼️
const gltfLoader = new THREE.GLTFLoader();
let mixer;
const clock = new THREE.Clock();

gltfLoader.load('glb/Gotthard_3.4.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);

// Die Paths unsichtbar machen ⛔
const pathObjects = ["Pfad_Autobahn_NtS_links", "Pfad_Autobahn_NtS_rechts", "Pfad_Autobahn_StN_links", "Pfad_Autobahn_StN_rechts"];
pathObjects.forEach(pathName => {
    const pathObject = model.getObjectByName(pathName);
    if (pathObject) {
        pathObject.visible = false;
    } else {
        console.warn(`Pfad nicht gefunden: ${pathName}`);
    }
});
//
    mixer = new THREE.AnimationMixer(model);

    // Hier werden alle Animationen des Modells gestartet 💨
    gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat); // Endlos wiederholen
        action.play();
    });

    // Fahrzeuge mit Pfaden und Geschwindigkeiten verbinden 🚗
    const vehicles = [
        { name: "Auto_1_blau", pathName: "Pfad_Autobahn_NtS_links", speed: 0.001, reverse: false },
        { name: "Auto_1_gelb", pathName: "Pfad_Autobahn_NtS_rechts", speed: 0.0015, reverse: false },
        { name: "Auto_1_orange", pathName: "Pfad_Autobahn_StN_links", speed: 0.002, reverse: true },
        { name: "Auto_1_rot", pathName: "Pfad_Autobahn_StN_rechts", speed: 0.0025, reverse: true }
    ];

    vehicles.forEach(vehicle => {
        const vehicleObject = model.getObjectByName(vehicle.name);
        const pathObject = model.getObjectByName(vehicle.pathName);

        if (vehicleObject && pathObject) {
            animateVehicle(vehicleObject, pathObject, vehicle.speed, vehicle.reverse);
        } else {
            console.warn(`Fahrzeug oder Pfad nicht gefunden: ${vehicle.name}, ${vehicle.pathName}`);
        }
    });

    // Auto_1_gelb duplizieren und auf dem Pfad Pfad_Autobahn_StN_rechts fahren lassen
    const yellowCar = model.getObjectByName("Auto_1_gelb").clone();
    if (yellowCar) {
        yellowCar.name = "Auto_1_gelb_clone";
        model.add(yellowCar);
        const pathObject = model.getObjectByName("Pfad_Autobahn_StN_rechts");
        if (pathObject) {
            animateVehicle(yellowCar, pathObject, 0.002, true, 0.5); // Mit initialem Fortschritt von 0.5
        } else {
            console.warn("Pfad nicht gefunden: Pfad_Autobahn_StN_rechts");
        }
    }
    
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

function animateVehicle(vehicle, path, speed, reverse, initialProgress = 0) {
    // Überprüfen ob das Pfadobjekt tatsächlich eine Geometrie hat
    if (!path.geometry || !path.geometry.attributes.position) {
        console.error(`Pfad ${path.name} hat keine Geometrie.`);
        return;
    }

    const points = path.geometry.attributes.position.array;
    const curvePoints = [];
    for (let i = 0; i < points.length; i += 3) {
        curvePoints.push(new THREE.Vector3(points[i], points[i + 1], points[i + 2]));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    //const pathLength = curve.getLength();
    let progress = reverse ? 1 :0;

    function moveVehicle() {
        requestAnimationFrame(moveVehicle);


        progress += reverse ? -speed : speed;
        if (progress > 1) progress -= 1; // Reset progress to loop the animation
        if (progress < 0) progress += 1; // Reset progress to loop the animation in reverse

        const position = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress).normalize();

        vehicle.position.copy(position);

        const axis = new THREE.Vector3(0, 1, 0);
        const up = new THREE.Vector3(0, 0, 1);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangent);
        vehicle.quaternion.copy(quaternion);

        // Fahrzeug um 180 Grad um die Y-Achse drehen, wenn es in die entgegengesetzte Richtung fährt
        if (reverse) {
            vehicle.rotateY(Math.PI);
        }
    }

    moveVehicle();
}

// dat.GUI zur Steuerung hinzufügen 🎮
const gui = new dat.GUI();
gui.domElement.classList.add('gui-container');

// Kamera-Steuerung 🎮-🎥
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(camera.position, 'x', -10, 10).name('Position X').onChange(() => updateCamera());
cameraFolder.add(camera.position, 'y', -10, 10).name('Position Y').onChange(() => updateCamera());
cameraFolder.add(camera.position, 'z', -10, 10).name('Position Z').onChange(() => updateCamera());
cameraFolder.open();

function updateCamera() {
    camera.lookAt(0, 0, 0); // Blickpunkt (Zentrum der Szene) nach der Positionsänderung beibehalten
}

// Licht-Steuerung 🎮-💡
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


// Funktion zum Abrufen der Temperaturdaten von Open-Meteo 🌡️
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
