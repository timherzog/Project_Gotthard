<?php
// config.php Datei einbinden, um die Datenbankverbindungsparameter zu laden
require_once 'config.php';

try {
    // PDO-Instanz erstellen
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    echo 'Verbindung fehlgeschlagen: ' . $e->getMessage();
    exit;
}

function storeScrapedData($data) {
    global $pdo;

    // SQL-Abfrage zum Einfügen der Daten vorbereiten
    $sql = "INSERT INTO scraped_data (passstatus, stau_nord, stau_sued, checked_at)
            VALUES (:passstatus, :stau_nord, :stau_sued, NOW())";
    
    $stmt = $pdo->prepare($sql);

    // Daten binden und einfügen
    $stmt->bindParam(':passstatus', $data['passstatus']);
    $stmt->bindParam(':stau_nord', $data['stau_nord']);
    $stmt->bindParam(':stau_sued', $data['stau_sued']);

    try {
        $stmt->execute();
        echo "Daten erfolgreich eingefügt.";
    } catch (PDOException $e) {
        echo "Fehler beim Einfügen der Daten: " . $e->getMessage();
    }
}
?>
