<?php
require_once 'config.php';

function getLast24HoursData() {
    global $pdo;
    
    $sql = "SELECT 
                DATE_FORMAT(hour, '%H:00') as formatted_hour,
                avg_stau_nord,
                avg_stau_sued
            FROM hourly_averages
            WHERE hour >= DATE_SUB(NOW(), INTERVAL 25 HOUR)
            ORDER BY hour";
    
    try {
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Database query error: " . $e->getMessage());
        return [];
    }
}

$hourlyData = getLast24HoursData();

$chartData = [
    'labels' => [],
    'nord' => [],
    'sued' => []
];

foreach ($hourlyData as $row) {
    $chartData['labels'][] = $row['formatted_hour'];
    $chartData['nord'][] = round($row['avg_stau_nord'], 2);
    $chartData['sued'][] = round($row['avg_stau_sued'], 2);
}

header('Content-Type: application/json');
echo json_encode($chartData);
?>
