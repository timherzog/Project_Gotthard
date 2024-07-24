// Grundlegende Szeneneinstellungen 🏞️ 
const scene = new THREE.Scene();
let fov;

// FOV basierend auf der Bildschirmgröße bestimmen
function determineFOV() {
    if (window.innerWidth < 481) {
        return 110; // Höheres FOV für Mobilgeräte
    } else if (window.innerWidth < 768) {
        return 100; // Standard-FOV für Tablets
    } else if (window.innerWidth < 1280) {
        return 80; // Standard-FOV für Laptops
    } else {
        return 75; // Standard-FOV für Desktops
    }
}

fov = determineFOV();

// Kamera und Renderer Setup 🎥 👾
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Transparentes Canvas
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Pixelverhältnis anpassen
document.body.appendChild(renderer.domElement);

// OrbitControls Setup 🌀
function setupOrbitControls() {
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Trägheitseffekt (für sanftere Kamerabewegung)
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.enablePan = false; // Panning deaktivieren
    controls.minDistance = 5; // Minimaler Zoom-Abstand
    controls.maxDistance = 13; // Maximaler Zoom-Abstand
    controls.maxPolarAngle = Math.PI / 1.5; // Begrenzung der vertikalen Rotation nach oben
    controls.minPolarAngle = Math.PI / 3; // Begrenzung der vertikalen Rotation nach unten
}

setupOrbitControls();

// Lichtquellen Setup 💡

const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Mäßige Intensität
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0xFFFFFF, 0.67); // Himmelblau und Weiß
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(2, 1, 1);
scene.add(directionalLight);

// Zusätzliches Hemisphere Light für die Unterseite
const bottomHemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0x404040, 0.5);
bottomHemisphereLight.position.set(0, -1, 0);
scene.add(bottomHemisphereLight);

// Schatten-Einstellungen
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024; // Standardgröße
directionalLight.shadow.mapSize.height = 1024; // Standardgröße
directionalLight.shadow.bias = -0.005; // Bessere Schattenqualität

// Schattenkamera-Einstellungen für weiche Schatten
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;

// Kamera-Position setzen 🎥
camera.position.set(6.4, 3.1, 9.5); // x, y, z Position
camera.lookAt(0, 0, 0); // Blickpunkt (Zentrum der Szene)

// Arrays für Pfade und Fahrzeuge
const paths = [
    "Pfad_Autobahn_NtS_links", "Pfad_Autobahn_NtS_rechts",
    "Pfad_Autobahn_StN_links", "Pfad_Autobahn_StN_rechts",
    "Pfad_Passtrasse_NtS", "Pfad_Passtrasse_StN"
];

const vehicles = [
    "Auto_1_blau", "Auto_1_gelb", "Auto_1_grün", "Auto_1_orange", "Auto_1_rot",
    "Postauto",
    "Bus_blau", "Bus_grün", "Bus_orange", "Bus_rot",
    "Wohnmobil_blau", "Wohnmobil_gelb", "Wohnmobil_grün", "Wohnmobil_orange", "Wohnmobil_rot",
    "Lastwagen_blau", "Lastwagen_gelb", "Lastwagen_grün", "Lastwagen_orange", "Lastwagen_rot"
];

// Funktion zur Generierung zufälliger Fahrzeug-Pfad-Kombinationen
function generateRandomVehiclePaths(numVehicles) {
    const vehiclePaths = [];
    const carPaths = ["Pfad_Autobahn_NtS_links", "Pfad_Autobahn_StN_links", "Pfad_Passtrasse_NtS", "Pfad_Passtrasse_StN"];
    const truckPaths = ["Pfad_Autobahn_NtS_rechts", "Pfad_Autobahn_StN_rechts"];

    for (let i = 0; i < numVehicles; i++) {
        let randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        let randomPath;
        let reverse;

        // Überprüfen, ob es sich um einen Lastwagen handelt
        const isTruck = randomVehicle.startsWith("Lastwagen");

        if (isTruck) {
            // Für Lastwagen: nur erlaubte Pfade
            randomPath = truckPaths[Math.floor(Math.random() * truckPaths.length)];
            reverse = randomPath === "Pfad_Autobahn_StN_rechts";
        } else {
            // Für andere Fahrzeuge: nur nicht-Lastwagen-Pfade
            randomPath = carPaths[Math.floor(Math.random() * carPaths.length)];
            reverse = randomPath === "Pfad_Autobahn_StN_links" || randomPath === "Pfad_Passtrasse_StN";
        }

        const speed = Math.random() * (0.0012 - 0.0003) + 0.0003;

        // Hier die Änderung für die spezifischen Pfade
        if (randomPath === "Pfad_Autobahn_NtS_links" || randomPath === "Pfad_Autobahn_NtS_rechts" ||
            randomPath === "Pfad_Autobahn_StN_links" || randomPath === "Pfad_Autobahn_StN_rechts") {
            reverse = !reverse; // Umkehrung der Richtung für diese Pfade
        }

        vehiclePaths.push({ name: randomVehicle, pathName: randomPath, speed, reverse });
    }
    return vehiclePaths;
}

// Loading Overlay anzeigen 🔋 
document.getElementById('loading-overlay').style.display = 'flex';

// GLTF-Modell laden 🖼️
const gltfLoader = new THREE.GLTFLoader();
let mixer;
let clock = new THREE.Clock();

gltfLoader.load('glb/Gotthard_4.2.glb', (gltf) => {
    const model = gltf.scene;

    // Traverse-Block für Modell-Anpassungen
    //model.traverse((node) => {
       // if (node.isMesh) {
            //node.material.flatShading = true; // Flat Shading für einen Low-Poly-Effekt
            //node.material.color = new THREE.Color(0xff0000); // Beispiel: Rot für kräftige Farben
       // }
   // });
    scene.add(model);

    // Loading Overlay ausblenden 🪫
    document.getElementById('loading-overlay').style.display = 'none';

    //Die Paths unsichtbar machen 🧶->⛔
    function hidePathObjects() {
        const pathObjects = ["Pfad_Autobahn_NtS_links", "Pfad_Autobahn_NtS_rechts", "Pfad_Autobahn_StN_links", "Pfad_Autobahn_StN_rechts"];
        pathObjects.forEach(pathName => {
            const pathObject = model.getObjectByName(pathName);
            if (pathObject) {
                if (pathObject.type === 'Line' || pathObject.type === 'LineSegments' || pathObject.type === 'LineLoop') {
                    pathObject.material.visible = false;
                } else if (pathObject.type === 'NURBS') {
                    pathObject.visible = false;
                }
            }
        });
    }

    hidePathObjects();

    // Animationen starten
    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.play();
    });

    // Zufällige Fahrzeuge generieren und animieren 🚗
    const randomVehiclePaths = generateRandomVehiclePaths(20);
    randomVehiclePaths.forEach((vehicle, index) => {
        const vehicleObject = model.getObjectByName(vehicle.name);
        const pathObject = model.getObjectByName(vehicle.pathName);
        if (vehicleObject && pathObject) {
            const clonedVehicle = vehicleObject.clone();
            scene.add(clonedVehicle);
            animateVehicle(clonedVehicle, pathObject, vehicle.speed, vehicle.reverse, Math.random());
        }
        });

    // Animation starten
    animate();
}, undefined, (error) => {
    console.error(error);
    document.getElementById('loading-overlay').innerHTML = '<p>Failed to load the 3D model. Please try again later.</p>';
});

// Funktion zur Animation der Fahrzeuge
function animateVehicle(vehicle, path, speed, reverse, initialProgress = 0) {
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
    let progress = reverse ? 1 - initialProgress : initialProgress;

    function moveVehicle() {
        requestAnimationFrame(moveVehicle);

        progress += reverse ? -speed : speed;
        if (progress > 1) progress -= 1;
        if (progress < 0) progress += 1;

        const position = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress).normalize();

        vehicle.position.copy(position);

        if (path.name === "Pfad_Passtrasse_NtS" || path.name === "Pfad_Passtrasse_StN") {
            const axis = new THREE.Vector3(0, 1, 0);
            const up = new THREE.Vector3(0, 0, 1);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangent);
            const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
            euler.z = 0;
            vehicle.quaternion.setFromEuler(euler);
        } else {
            const axis = new THREE.Vector3(0, 1, 0);
            const up = new THREE.Vector3(0, 0, 1);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangent);
            vehicle.quaternion.copy(quaternion);
        }

        if (reverse) {
            vehicle.rotateY(Math.PI);
        }
    }

    moveVehicle();
}

// GUI Setup 🎮
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

// Hemisphere Light
const hemisphereLightFolder = lightFolder.addFolder('Hemisphere Light');
hemisphereLightFolder.addColor({ color: hemisphereLight.color.getHex() }, 'color').name('Color').onChange((value) => {
    hemisphereLight.color.setHex(value);
});
hemisphereLightFolder.add(hemisphereLight, 'intensity', 0, 2).name('Intensity');
hemisphereLightFolder.open();

lightFolder.open();

// // Effect Composer für Postprocessing hinzufügen 🎞️
// const composer = new THREE.EffectComposer(renderer);

// const renderPass = new THREE.RenderPass(scene, camera);
// composer.addPass(renderPass);

// const filmPass = new THREE.FilmPass(0.35, 0.025, 648, false);
// filmPass.renderToScreen = true;
// composer.addPass(filmPass);

// Fenstergrößeänderungen handhaben
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.fov = determineFOV();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ⛔ Funktionen zur Anpassung der Szene entsprechend der Passzugänglichkeit ⛔
function adjustSceneOpen() {
    // Implementierung für offene Szene
}

function adjustSceneClosed() {
    // Implementierung für geschlossene Szene
}

// Funktionen zur Anpassung der Verkehrsdichte
let nordStauLevel = ''; // Variable für den aktuellen Verkehrszustand vor Tunnel im Norden

// ❗Funktionen zur Anpassung der Szene entsprechend der Verkehrsdichte vor Tunnel❗
function adjustSceneClearTraffic() {
    nordStauLevel = 'Kein Stau'; // Aktualisierung von nordStauLevel
    '🚗';
    
}

function adjustSceneLightTraffic() {
    nordStauLevel = 'Wenig Stau'; // Aktualisierung von nordStauLevel
    '🚗 🚗';
}

function adjustSceneModerateTraffic() {
    nordStauLevel = 'Mittel Stau'; // Aktualisierung von nordStauLevel
    '🚗 🚗 🚗';
}

function adjustSceneHeavyTraffic() {
    nordStauLevel = 'Viel Stau'; // Aktualisierung von nordStauLevel
    '🚗 🚗 🚗 🚗';
}

// jQuery-Funktion / Datenabfrage
$(document).ready(function() {
    function loadVerkehrsmeldungen() {
        $.ajax({
            url: 'scrape.php', // Pfad zur PHP-Datei
            type: 'GET',
            success: function(data) {
                const now = new Date();
                const formattedDate = now.toLocaleDateString('de-DE');
                const formattedTime = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                $('#gotthard-nord').html('A2 Gotthard Nord: ' + data.text_nord_1);
                $('#gotthard-nord-update').html('Zuletzt aktualisiert am: ' + formattedDate + ' ' + formattedTime);
                $('#gotthard-sued').html('A2 Gotthard Süd: ' + data.text_sued_1);
                $('#gotthard-sued-update').html('Zuletzt aktualisiert am: ' + formattedDate + ' ' + formattedTime);
                $('#gotthard-status').html('Status: ' + data.gotthard_status);
                $('#gotthard-last-update').html('' + data.gotthard_last_update);
                //$('#gotthard-status-only').html('Status: ' + data.gotthard_status_only);
                //$('#gotthard-temperature').html('Temperatur: ' + data.gotthard_temperature);

                // Kilometeranzahl in die neuen div-Elemente einfügen
                // Update navbar data
                $('#nord-km').html(data.nord_km !== null && data.nord_km !== 0 ? data.nord_km + ' km Stau' : 'freie Fahrt');
                $('#sued-km').html(data.sued_km !== null && data.sued_km !== 0 ? data.sued_km + ' km Stau' : 'freie Fahrt');
                $('#gotthard-pass-status').html(data.gotthard_pass_status || 'Keine Daten');

                // ⛔ Update der Szene entsprechend Passzugänglichkeit ⛔
                if (data.gotthard_status === 'Offen') {
                    adjustSceneOpen();
                } else {
                    adjustSceneClosed();
                }

                // ❗ Update der Verkehrsszene entsprechend der Verkehrsdichte ❗
                if (data.nord_km === 0) {
                    adjustSceneClearTraffic();
                } else if (data.nord_km > 0 && data.nord_km <= 5) {
                    adjustSceneLightTraffic();
                } else if (data.nord_km > 5 && data.nord_km <= 10) {
                    adjustSceneModerateTraffic();
                } else {
                    adjustSceneHeavyTraffic();
                }

                // Konsolenausgabe des aktuellen Verkehrszustands
                console.log('Aktueller Verkehrszustand (Nord):', nordStauLevel);
            },

            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error loading data: " + textStatus, errorThrown);
            }
        });
    }

    loadVerkehrsmeldungen();
    setInterval(loadVerkehrsmeldungen, 300000); // Alle 5 Minuten aktualisieren
});

// Renderer-Einstellungen
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

// Haupt-Animations-Loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixer.update(delta);
    renderer.render(scene, camera);
    //composer.render();
}