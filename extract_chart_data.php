<?php
require_once 'config.php';

// Funktion zur Abrufung der Chart-Daten für ein bestimmtes Intervall
function getChartData($interval) {
    global $pdo;
    
    // Spezielle Behandlung für das 2-Tage-Intervall
    if ($interval === '2 days') {
        // Berechne den Start des vorletzten Tages und das Ende des gestrigen Tages
        $startDate = date('Y-m-d 00:00:00', strtotime('-2 days'));
        $endDate = date('Y-m-d 23:59:59', strtotime('-1 day'));
        
        // SQL-Abfrage für das 2-Tage-Intervall
        $sql = "SELECT 
                    DATE_FORMAT(hour, '%Y-%m-%d %H:%i') as formatted_hour,
                    avg_stau_nord,
                    avg_stau_sued
                FROM hourly_averages
                WHERE hour >= :startDate AND hour <= :endDate
                ORDER BY hour";
        
        // Vorbereitung und Ausführung der SQL-Abfrage
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':startDate' => $startDate, ':endDate' => $endDate]);
    } else {
        // Bestehende Logik für andere Intervalle
        $sql = "SELECT 
                    DATE_FORMAT(hour, '%H:%i') as formatted_hour,
                    avg_stau_nord,
                    avg_stau_sued
                FROM hourly_averages
                WHERE hour >= DATE_SUB(NOW(), INTERVAL $interval)
                ORDER BY hour";
        
        // Direkte Ausführung der SQL-Abfrage
        $stmt = $pdo->query($sql);
    }
    
    // Rückgabe der abgerufenen Daten
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Funktion zur Abrufung der wöchentlichen Durchschnittswerte
function getWeeklyAverages() {
    global $pdo;
    
    // Berechne den letzten Montag und den nächsten Montag nach dem letzten Sonntag
    $lastMonday = date('Y-m-d', strtotime('last monday', strtotime('-1 week')));
    $lastSunday = date('Y-m-d', strtotime('last sunday'));
    
    // SQL-Abfrage für die wöchentlichen Durchschnittswerte
    $sql = "SELECT 
                DATE(hour) as date,
                ROUND(AVG(avg_stau_nord), 2) as avg_nord,
                ROUND(AVG(avg_stau_sued), 2) as avg_sued
            FROM hourly_averages
            WHERE hour >= :lastMonday AND hour < :nextMonday
            GROUP BY DATE(hour)
            ORDER BY date";
    
    try {
        // Vorbereitung und Ausführung der SQL-Abfrage
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':lastMonday' => $lastMonday,
            ':nextMonday' => date('Y-m-d', strtotime('+1 day', strtotime($lastSunday)))
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Fehlerbehandlung und Loggen des Fehlers
        error_log("Database query error: " . $e->getMessage());
        return [];
    }
}

// Funktion zur Formatierung eines Datums für wöchentliche Daten
function formatWeeklyDate($date) {
    $timestamp = strtotime($date);
    $weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    return $weekdays[date('N', $timestamp) - 1] . ' ' . date('d.m.', $timestamp);
}

// Funktion zur Formatierung der Chart-Daten
function formatChartData($data, $isWeekly = false) {
    $chartData = [
        'labels' => [],
        'nord' => [],
        'sued' => []
    ];

    // Formatierung der Labels und Datenwerte je nach Intervall (wöchentlich oder stündlich)
    foreach ($data as $row) {
        if ($isWeekly) {
            // Formatierung der Labels für wöchentliche Daten
            $chartData['labels'][] = formatWeeklyDate($row['date']);
        } else {
            // Formatierung der Labels für stündliche Daten
            $chartData['labels'][] = $row['formatted_hour'];
        }
        // Hinzufügen der Werte für Nord- und Südstau
        $chartData['nord'][] = round($isWeekly ? $row['avg_nord'] : $row['avg_stau_nord'], 2);
        $chartData['sued'][] = round($isWeekly ? $row['avg_sued'] : $row['avg_stau_sued'], 2);
    }

    return $chartData;
}

// Funktion zur Formatierung eines Datumsstrings mit Wochentag
function formatDateWithDay($dateString) {
    $timestamp = strtotime($dateString);
    $weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return $weekdays[date('w', $timestamp)] . ' ' . date('d.m.', $timestamp);
}

// Abruf der Chart-Daten für verschiedene Intervalle
$last24h = getChartData('25 HOUR');
$last2days = getChartData('2 days');
$lastWeek = getWeeklyAverages();

// Vorbereitung der Antwortdaten
$response = [
    'last24h' => formatChartData($last24h),
    'last2days' => formatChartData($last2days),
    'lastWeek' => formatChartData($lastWeek, true)
];

// Setzen des Content-Type Headers und Ausgabe der Antwort als JSON
header('Content-Type: application/json');
echo json_encode($response);
?>
