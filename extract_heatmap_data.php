<?php
require_once 'config.php';

// Funktion zum Abrufen der Daten der letzten 7 Tage
function getLast7DaysData() {
    global $pdo;
    
    $sql = "SELECT 
                hour,
                avg_stau_nord
            FROM hourly_averages
            WHERE hour >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY hour";
    
    try {
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database query error: " . $e->getMessage());
        return [];
    }
}

// Daten für die Heatmap abrufen und formatieren
$hourlyData = getLast7DaysData();
$heatmapData = [];

foreach ($hourlyData as $row) {
    $dateTime = new DateTime($row['hour']);
    $dayOfWeek = $dateTime->format('w'); // Wochentag (0=Sonntag, 6=Samstag)
    $hourOfDay = $dateTime->format('G'); // Stunde (0-23)
    $heatmapData[] = [
        'formatted_hour' => $row['hour'],
        'day' => $dayOfWeek,
        'hour' => $hourOfDay,
        'avg_stau_nord' => $row['avg_stau_nord']
    ];
}

header('Content-Type: application/json');
echo json_encode($heatmapData);
?>
