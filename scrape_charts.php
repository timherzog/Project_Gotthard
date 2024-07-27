<?php
// Fehlerberichte aktivieren und alle Fehler anzeigen
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Asynchrone Web-Scraping-Funktion
function scrape_site_async($url_status, $xpath_queries) {
    $results = []; // Array zur Speicherung der Ergebnisse
    $mh = curl_multi_init(); // Initialisierung von cURL für mehrere Anfragen
    $curl_handles = []; // Array zur Speicherung der einzelnen cURL-Handles

    // Erstellen und Initialisieren der cURL-Handles
    foreach ($url_status as $key => $url) {
        $curl_handles[$key] = curl_init(); // cURL-Handle initialisieren
        curl_setopt($curl_handles[$key], CURLOPT_URL, $url); // URL setzen
        curl_setopt($curl_handles[$key], CURLOPT_RETURNTRANSFER, true); // Antwort als String zurückgeben
        curl_setopt($curl_handles[$key], CURLOPT_CONNECTTIMEOUT, 10); // Verbindungstimeout setzen
        curl_setopt($curl_handles[$key], CURLOPT_TIMEOUT, 30); // Timeout für die gesamte Anfrage setzen
        curl_multi_add_handle($mh, $curl_handles[$key]); // cURL-Handle zu multi-Handle hinzufügen
    }

    $running = null;
    do {
        curl_multi_exec($mh, $running); // Alle Handles ausführen
    } while ($running > 0); // Warten, bis alle Anfragen abgeschlossen sind

    // Ergebnisse der Anfragen verarbeiten
    foreach ($curl_handles as $key => $handle) {
        $html = curl_multi_getcontent($handle); // HTML-Inhalt der Anfrage holen
        $dom = new DOMDocument(); // Neues DOMDocument-Objekt erstellen

        // Fehler beim Laden des HTML-Dokuments behandeln
        libxml_use_internal_errors(true); // Fehlerbehandlung für libxml aktivieren
        $loadResult = $dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
        if (!$loadResult) {
            $errors = libxml_get_errors();
            // Hier Fehlerbehandlung einfügen oder loggen
            libxml_clear_errors();
            continue;
        }

        $xpath = new DOMXPath($dom); // Neues DOMXPath-Objekt erstellen

        // Durchführen der XPath-Abfragen
        foreach ($xpath_queries[$key] as $query_name => $query) {
            $elements = $xpath->query($query); // XPath-Abfrage ausführen
            if ($elements && $elements->length > 0) {
                $results[$key][$query_name] = trim($elements->item(0)->nodeValue); // Ergebnis speichern
            } else {
                $results[$key][$query_name] = null; // Kein Ergebnis gefunden
            }
        }

        curl_multi_remove_handle($mh, $handle); // cURL-Handle entfernen
        curl_close($handle); // cURL-Handle schließen
        unset($dom); // DOMDocument-Objekt löschen
    }

    curl_multi_close($mh); // Multi-Handle schliessen
    return $results; // Ergebnisse zurückgeben
}

// Nur km des Staus wird extrahiert, inklusive Kommastellen
function extractKilometers($text) {
    $noTrafficKeywords = ["kein Stau", "keinen Stau"];
    
    foreach ($noTrafficKeywords as $keyword) {
        if (stripos($text, $keyword) !== false) { // Überprüfen, ob der Text "kein Stau" enthält
            return 0; // Keine Kilometer, da kein Stau
        }
    }
    
    // Kilometerzahl mit optionalem Dezimalteil extrahieren
    if (preg_match('/(\d+(\.\d+)?)\s?km/i', $text, $matches)) {
        return floatval($matches[1]); // Gefundene Kilometerzahl zurückgeben
    } else {
        return null; // Keine Kilometer gefunden
    }
}

// URLs und XPath-Abfragen definieren
$url_status = [
    'gotthard' => 'https://www.gotthardtunnel-aktuell.ch/ords/verkehrsinfo/r/gotthard-strassentunnel/stau-meldungen',
    'tcs' => 'https://www.tcs.ch/de/tools/verkehrsinfo-verkehrslage/paesse-in-der-schweiz.php'
];

$xpath_queries = [
    'gotthard' => [
        'text_nord_1' => "//h3[contains(text(), 'Zwischen Altdorf und Göschenen')]/following-sibling::h3[1]",
        'text_sued_1' => "//h3[contains(text(), 'Zwischen Bellinzona und Airolo')]/following-sibling::h3[1]"
    ],
    'tcs' => [
        'status' => "//li[@data-search='gotthardpass']//p[contains(@class, 'status-additional-info')]",
        'last_update' => "//li[@data-search='gotthardpass']//span[contains(@class, 'last-update')]",
    ]
];

// Daten vom Scraping abrufen
$results = scrape_site_async($url_status, $xpath_queries);

$gotthard_status = null;
if (isset($results['tcs']['status']) && $results['tcs']['status'] !== null) {
    $gotthard_status_parts = explode('Zuletzt aktualisiert am:', $results['tcs']['status']); // Status-Text teilen
    $gotthard_status = trim($gotthard_status_parts[0]); // Status-Text bereinigen
}

// Gotthardpass Status "Offen" oder "Geschlossen"
$gotthard_pass_status = 'Keine Daten';
if (strpos(strtolower($gotthard_status), 'offen') !== false) {
    $gotthard_pass_status = 'offen';
} elseif (strpos(strtolower($gotthard_status), 'geschlossen') !== false || strpos(strtolower($gotthard_status), 'gesperrt') !== false) {
    $gotthard_pass_status = 'geschlossen';
}

// Ergebnisse aus dem Scraping verarbeiten
$text_nord_1 = isset($results['gotthard']['text_nord_1']) ? $results['gotthard']['text_nord_1'] : null;
$text_sued_1 = isset($results['gotthard']['text_sued_1']) ? $results['gotthard']['text_sued_1'] : null;

$gotthard_data = [
    'text_nord_1' => $text_nord_1,
    'text_sued_1' => $text_sued_1,
    'gotthard_status' => $gotthard_status,
    'gotthard_last_update' => isset($results['tcs']['last_update']) ? $results['tcs']['last_update'] : null,
    'gotthard_pass_status' => $gotthard_pass_status,
    'nord_km' => extractKilometers($text_nord_1),
    'sued_km' => extractKilometers($text_sued_1)
];

// Daten als JSON ausgeben
header('Content-Type: application/json');
echo json_encode($gotthard_data);

// Nach dem Scraping Daten zur Speicherung vorbereiten
$data = [
    'passstatus' => $gotthard_data['gotthard_pass_status'],
    'stau_nord' => $gotthard_data['nord_km'],
    'stau_sued' => $gotthard_data['sued_km'],
];

// load.php aufrufen, um die Daten zu speichern
require_once 'load.php';
storeScrapedData($data);
?>
