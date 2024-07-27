<?php
require_once 'config.php';

// Funktion zur Abrufung der Daten für die letzten 7 vollständigen Tage
function getLast7CompleteDaysData() {
    global $pdo;
    
    // SQL-Abfrage, um die stündlichen Durchschnittswerte der letzten 7 vollständigen Tage abzurufen
    $sql = "SELECT 
            DATE(hour) as date,
            HOUR(hour) as hour_of_day,
            AVG(avg_stau_nord) as avg_stau_nord,
            AVG(avg_stau_sued) as avg_stau_sued
        FROM hourly_averages
        WHERE hour >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND hour < CURDATE()
        GROUP BY DATE(hour), HOUR(hour)
        ORDER BY date ASC, hour_of_day ASC";
    
    try {
        // Ausführung der SQL-Abfrage
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Fehlerbehandlung und Loggen des Fehlers
        error_log("Database query error: " . $e->getMessage());
        return [];
    }
}

// Abruf der stündlichen Daten für die letzten 7 vollständigen Tage
$hourlyData = getLast7CompleteDaysData();

// Überprüfung, ob genügend Daten vorhanden sind (7 Tage * 24 Stunden = 168 Datensätze)
if (count($hourlyData) < 7 * 24) {
    // Wenn nicht genügend Daten vorhanden sind, wird ein Fehler zurückgegeben
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'Nicht genügend Daten verfügbar']);
    exit;
}

// Initialisierung des Arrays für die Heatmap-Daten
$heatmapData = [
    'nord' => [],
    'sued' => []
];

// Erstellen eines Arrays mit den letzten 7 Tagen in umgekehrter Reihenfolge
$days = array_reverse(range(0, 6)); // [6, 5, 4, 3, 2, 1, 0]

foreach ($hourlyData as $row) {
    // Berechnung des Tagesindex basierend auf der Position im Array
    $dayIndex = $days[floor(count($heatmapData['nord']) / 24)];
    
    // Hinzufügen der Daten für Nord in das Heatmap-Array
    $heatmapData['nord'][] = [
        'day' => $dayIndex,
        'hour' => intval($row['hour_of_day']),
        'value' => floatval($row['avg_stau_nord'])
    ];
    
    // Hinzufügen der Daten für Süd in das Heatmap-Array
    $heatmapData['sued'][] = [
        'day' => $dayIndex,
        'hour' => intval($row['hour_of_day']),
        'value' => floatval($row['avg_stau_sued'])
    ];
}

// Setzen des Content-Type Headers und Ausgabe der Antwort als JSON
header('Content-Type: application/json');
echo json_encode($heatmapData);
?>