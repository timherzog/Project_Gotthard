<?php
// Fehlerberichte aktivieren und auf alle Fehler anzeigen
error_reporting(E_ALL);
ini_set('display_errors', 1);

function scrape_site_async($url_status, $xpath_queries) {
    $results = [];
    $mh = curl_multi_init();
    $curl_handles = [];

    foreach ($url_status as $key => $url) {
        $curl_handles[$key] = curl_init();
        curl_setopt($curl_handles[$key], CURLOPT_URL, $url);
        curl_setopt($curl_handles[$key], CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl_handles[$key], CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($curl_handles[$key], CURLOPT_TIMEOUT, 30);
        curl_multi_add_handle($mh, $curl_handles[$key]);
    }

    $running = null;
    do {
        curl_multi_exec($mh, $running);
    } while ($running > 0);

    foreach ($curl_handles as $key => $handle) {
        $html = curl_multi_getcontent($handle);
        $dom = new DOMDocument();

        // Fehler beim Laden des HTML-Dokuments behandeln
        libxml_use_internal_errors(true);
        $loadResult = $dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
        if (!$loadResult) {
            $errors = libxml_get_errors();
            // Hier Fehlerbehandlung einfügen oder loggen
            libxml_clear_errors();
            continue;
        }

        $xpath = new DOMXPath($dom);

        foreach ($xpath_queries[$key] as $query_name => $query) {
            $elements = $xpath->query($query);
            if ($elements && $elements->length > 0) {
                $results[$key][$query_name] = trim($elements->item(0)->nodeValue);
            } else {
                $results[$key][$query_name] = null;
            }
        }

        curl_multi_remove_handle($mh, $handle);
        curl_close($handle);
        unset($dom);
    }

    curl_multi_close($mh);
    return $results;
}

//nur km des Staus wird extrahiert
function extractKilometers($text) {
    $noTrafficKeywords = ["kein Stau", "keinen Stau"];
    
    foreach ($noTrafficKeywords as $keyword) {
        if (stripos($text, $keyword) !== false) {
            return 0;
        }
    }
    
    if (preg_match('/(\d+(\.\d+)?)\s?km/i', $text, $matches)) {
        return floatval($matches[1]);
    } else {
        return null;
    }
}

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
        //'status_only' => "//li[@data-search='gotthardpass']//div[@class='intro-icon']/img/following-sibling::text()[1]",
        //'temperature' => "//li[@data-search='gotthardpass']//div[@class='intro-icon' and contains(text(), '°C')]"
    ]
];

$results = scrape_site_async($url_status, $xpath_queries);

$gotthard_status = null;
if (isset($results['tcs']['status']) && $results['tcs']['status'] !== null) {
    $gotthard_status_parts = explode('Zuletzt aktualisiert am:', $results['tcs']['status']);
    $gotthard_status = trim($gotthard_status_parts[0]);
}

// Gotthardpass Status "Offen" oder "Geschlossen"
$gotthard_pass_status = 'Keine Daten';
if (strpos(strtolower($gotthard_status), 'offen') !== false) {
    $gotthard_pass_status = 'offen';
} elseif (strpos(strtolower($gotthard_status), 'geschlossen') !== false || strpos(strtolower($gotthard_status), 'gesperrt') !== false) {
    $gotthard_pass_status = 'geschlossen';
}

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

header('Content-Type: application/json');
echo json_encode($gotthard_data);
?>
