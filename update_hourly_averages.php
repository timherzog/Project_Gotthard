<?php
// Konfigurationsdatei einbinden, um die Datenbankverbindungsparameter zu laden
require_once 'config.php';

// Funktion zur Aktualisierung der stündlichen Durchschnittswerte
function updateHourlyAverages() {
    // Zugriff auf die globale PDO-Instanz für die Datenbankverbindung
    global $pdo;
    
    // SQL-Abfrage zum Einfügen oder Aktualisieren der durchschnittlichen Staukilometer für die letzte vollständig vergangene Stunde
    $sql = "INSERT INTO hourly_averages (hour, avg_stau_nord, avg_stau_sued)
        SELECT 
            DATE_FORMAT(checked_at, '%Y-%m-%d %H:00:00') as hour,
            ROUND(AVG(stau_nord), 1) as avg_stau_nord,
            ROUND(AVG(stau_sued), 1) as avg_stau_sued
        FROM scraped_data
        WHERE checked_at >= DATE_FORMAT(NOW() - INTERVAL 1 HOUR, '%Y-%m-%d %H:00:00')
            AND checked_at < DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00')
        GROUP BY DATE_FORMAT(checked_at, '%Y-%m-%d %H:00:00')
        ON DUPLICATE KEY UPDATE
            avg_stau_nord = ROUND(VALUES(avg_stau_nord), 1),
            avg_stau_sued = ROUND(VALUES(avg_stau_sued), 1)";
    
    // Ausführen der SQL-Abfrage
    $pdo->exec($sql);
}

// Aufrufen der Funktion zur Aktualisierung der stündlichen Durchschnittswerte
updateHourlyAverages();
?>
