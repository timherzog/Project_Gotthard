// Szene, Kamera und Renderer erstellen 🏞️ 🎥 👾
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Pixelverhältnis anpassen
document.body.appendChild(renderer.domElement);

// OrbitControls hinzufügen 🌀
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Trägheitseffekt (für sanftere Kamerabewegung)
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minDistance = 1; // Minimum zoom distance
controls.maxDistance = 500; // Maximum zoom distance

// Hintergrundfarbe setzen 🟦
scene.background = new THREE.Color(0x87CEEB); // Himmelsblau

// Licht hinzufügen 💡
const ambientLight = new THREE.AmbientLight(0x404040); // weiches Umgebungslicht
ambientLight.intensity = 0.5;
scene.add(ambientLight);

// Funktion zur Berechnung des Sonnenstandes 🌞
function calculateSunPosition(date, latitude, longitude) {
    const sunCalc = SunCalc.getPosition(date, latitude, longitude);
    const azimuth = sunCalc.azimuth * (180 / Math.PI); // Azimutwinkel in Grad
    const altitude = sunCalc.altitude * (180 / Math.PI); // Höhenwinkel in Grad
    return { azimuth, altitude };
}

// Licht hinzufügen, das die Sonne imitiert 💡🌞
const sunPosition = calculateSunPosition(new Date('2024-06-30T11:00:00'), 47.3769, 8.5417); // Zürich Koordinaten
const sunDirection = new THREE.Vector3();
sunDirection.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - sunPosition.altitude), THREE.MathUtils.degToRad(sunPosition.azimuth));
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.copy(sunDirection);
scene.add(directionalLight);

// Kamera-Position setzen 🎥
camera.position.set(5.3, 2.2, 7.1); // x, y, z Position
camera.lookAt(0, 0, 0); // Blickpunkt (Zentrum der Szene)

// GLTF-Modell laden 🖼️
const gltfLoader = new THREE.GLTFLoader();

gltfLoader.load('glb/Gotthard_3.6.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    // Die Paths unsichtbar machen ⛔
    // const pathObjects = ["Pfad_Autobahn_NtS_links", "Pfad_Autobahn_NtS_rechts", "Pfad_Autobahn_StN_links", "Pfad_Autobahn_StN_rechts"];
    // pathObjects.forEach(pathName => {
    //     const pathObject = model.getObjectByName(pathName);
    //     if (pathObject) {
    //         pathObject.visible = false;
    //     } else {
    //         console.warn(`Pfad nicht gefunden: ${pathName}`);
    //     }
    // });

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // OrbitControls updaten
        renderer.render(scene, camera);
    }

    animate();
}, undefined, (error) => {
    console.error(error);
});

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

// Fenstergrößeänderungen handhaben
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


let nordStauLevel = ''; // Variable für den aktuellen Verkehrszustand

// Funktionen zur Anpassung der Szene entsprechend der Verkehrsdichte
function adjustSceneClearTraffic() {
    nordStauLevel = 'Kein Stau'; // Aktualisierung von nordStauLevel
    '🚗';
    //hier Szene normal laufen lassen ohne Ampel usw. Das alles ausserhalb dieser Funktion und mit denen unten dran manipulieren. nordStauLevel kann verwendet werden, um Text auf der Website anzeigen zu lassen. Wenn ich etwas an der Szene ändern will aufgrund des Verkehrszustandes kommt das unten rein.
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
                $('#nord_km').html('Stau Nord: ' + (data.nord_km !== null ? data.nord_km + ' km' : 'Keine Daten'));
                $('#sued_km').html('Stau Süd: ' + (data.sued_km !== null ? data.sued_km + ' km' : 'Keine Daten'));

                // Update der Verkehrsszene entsprechend der Verkehrsdichte
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
    setInterval(loadVerkehrsmeldungen, 300000); // alle 5 Minuten (300000 Millisekunden)
});
