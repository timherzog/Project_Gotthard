// Berechnung der durchschnittlichen Staukilometer pro Stunde
<?php
require_once 'config.php';

function getAverageStauKilometer() {
    global $pdo;
    
    $sql = "SELECT 
                HOUR(checked_at) as hour,
                AVG(stau_nord) as avg_stau_nord,
                AVG(stau_sued) as avg_stau_sued
            FROM scraped_data
            WHERE checked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY HOUR(checked_at)
            ORDER BY hour";
    
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}