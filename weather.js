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