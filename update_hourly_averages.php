<?php
require_once 'config.php';

function updateHourlyAverages() {
    global $pdo;
    
    // Berechne den Durchschnitt für die letzte Stunde
    $sql = "INSERT INTO hourly_averages (hour, avg_stau_nord, avg_stau_sued)
        SELECT 
            DATE_FORMAT(checked_at, '%Y-%m-%d %H:00:00') as hour,
            ROUND(AVG(stau_nord), 1) as avg_stau_nord,
            ROUND(AVG(stau_sued), 1) as avg_stau_sued
        FROM scraped_data
        WHERE checked_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY DATE_FORMAT(checked_at, '%Y-%m-%d %H:00:00')
        ON DUPLICATE KEY UPDATE
            avg_stau_nord = ROUND(VALUES(avg_stau_nord), 1),
            avg_stau_sued = ROUND(VALUES(avg_stau_sued), 1)";
    
    $pdo->exec($sql);
}

updateHourlyAverages();
?>