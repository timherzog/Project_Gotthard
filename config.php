<?php
// Datenbankverbindungsparameter
$host = 'localhost';
$dbname = '495228_16_1';
$username = '495228_16_1';
$password = '9rWDLB8ojhke';

// DSN (Datenquellenname) für PDO
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";

// Optionen für PDO
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Aktiviert die Ausnahmebehandlung für Datenbankfehler
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Legt den Standard-Abrufmodus auf assoziatives Array fest
    PDO::ATTR_EMULATE_PREPARES => false, // Deaktiviert die Emulation vorbereiteter Anweisungen, für bessere Leistung
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    die('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage());
}
?>
