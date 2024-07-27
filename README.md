# Staudaten Gotthardtunnel – Semesterprojekt Interaktive Medien 4
In diesem Projekt werden die aktuellen Staudaten des Nord- und Südportals des Gotthardtunnels in verschiedenen Grafiken dargestellt. Die Daten werden laufend per Webscraping von einer Website geholt, da es keine freie API dafür gibt.
**Relevante Dateien für IM4:**
- index.html
- style.css
- config.php (nicht auf Github)
- scrape_charts.php
- load.php
- update_hourly_averages.php
- extract_chart_data.php
- chart.js
- extract_heatmap_data.php
- heatmap.js

## Datenaufbereitung

### scrape_charts.php – Scraping-Skript

Dieses PHP-Skript dient zum asynchronen Web-Scraping, um die Staukilometer vor dem Nord- und Südportals des Gotthard Tunnels und den Status vom Gotthardpass von verschiedenen Webseiten zu extrahieren und die Daten zu verarbeiten.

**Funktionsweise**

Das Skript verwendet die PHP cURL-Bibliothek, um mehrere Webseiten asynchron abzurufen und die benötigten Informationen mithilfe von XPath aus dem HTML-Code zu extrahieren.

**Aufbau des Skripts und Scraping-Prozess**

1. **Fehlerberichterstattung aktivieren**

    ```php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ```
    Diese Zeilen aktivieren die vollständige Fehlerberichterstattung und stellen sicher, dass alle Fehler angezeigt werden.

2. **Definition der `scrape_site_async` Funktion**

    Die Funktion `scrape_site_async` führt das asynchrone Web-Scraping durch. Sie ist für das Abrufen und Verarbeiten der HTML-Daten von den angegebenen URLs verantwortlich.

    ```php
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

            libxml_use_internal_errors(true);
            $loadResult = $dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
            if (!$loadResult) {
                $errors = libxml_get_errors();
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
    ```

3. **Definition der `extractKilometers` Funktion**

    Diese Funktion extrahiert die Kilometerangabe aus einem Text und überprüft, ob der Text "kein Stau" enthält:

    ```php
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
    ```

4. **Definition der URLs und XPath-Abfragen**

    Die Arrays `url_status` und `xpath_queries` enthalten die URLs der zu scrapenden Seiten und die entsprechenden XPath-Abfragen zur Extraktion der benötigten Informationen:

    ```php
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
    ```

5. **Scraping durchführen**

    Das Scraping wird durch den Aufruf der `scrape_site_async` Funktion durchgeführt:

    ```php
    $results = scrape_site_async($url_status, $xpath_queries);
    ```

6. **Ergebnisse verarbeiten und JSON-Ausgabe**

    Die extrahierten Daten werden verarbeitet und als JSON ausgegeben:

    ```php
    $gotthard_status = null;
    if (isset($results['tcs']['status']) && $results['tcs']['status'] !== null) {
        $gotthard_status_parts = explode('Zuletzt aktualisiert am:', $results['tcs']['status']);
        $gotthard_status = trim($gotthard_status_parts[0]);
    }

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
    ```

7. **Daten zur Speicherung vorbereiten und speichern**

    Die verarbeiteten Daten werden zur Speicherung vorbereitet und mithilfe der `storeScrapedData`-Funktion aus der `load.php`-Datei gespeichert:

    ```php
    $data = [
        'passstatus' => $gotthard_data['gotthard_pass_status'],
        'stau_nord' => $gotthard_data['nord_km'],
        'stau_sued' => $gotthard_data['sued_km'],
    ];

    require_once 'load.php';
    storeScrapedData($data);
    ```
### load.php – Einfügen in Datenbank

Diese Datei kümmert sich um die Datenbankverbindung und das Einfügen der gescrapten Daten in die Datenbank.

**Hauptfunktionalitäten**

- Datenbankverbindung:
    Die Verbindung zur Datenbank wird mithilfe von PDO hergestellt.
- Daten speichern:
    Die Funktion `storeScrapedData` speichert die gescrapten Daten in der Tabelle "scraped_data" in der Datenbank.

### update_hourly_averages.php – Durchschnitsswerte einfügen
Diese Datei aktualisiert die Tabelle der stündlichen Durchschnittswerte der Staukilometer.

**Hauptfunktionalität**
- Funktion zur Aktualisierung der stündlichen Durchschnittswerte:
    Die Funktion `updateHourlyAverages` berechnet den Durchschnitt der Staukilometer für die letzte vollständig vergangene Stunde und speichert diese Werte in der Tabelle hourly_averages. Falls bereits Einträge existieren, werden diese aktualisiert.

## Erstellung der Grafiken

### extract_heatmap_data.php/extract_chart_data.php – Extrahieren der Daten für die Grafiken
Diese PHP-Skripts dienen zur Abrufung und Formatierung der Staudaten aus der Datenbank. Die Daten werden für verschiedene Zeitintervalle (letzte 24 Stunden, letzte 2 Tage, letzte Woche) abgerufen und in einem für die Darstellung in Diagrammen geeigneten Format zurückgegeben.

**Hauptfunktionalitäten**

- Abruf von stündlichen Durchschnittsstaudaten für verschiedene Zeitintervalle:
    `getChartData($interval)`: Diese Funktion ruft die stündlichen Durchschnittsstaudaten für das angegebene Zeitintervall aus der Datenbank ab. Für das 2-Tage-Intervall wird eine spezielle Berechnung gemacht.
    
- Abruf von wöchentlichen Durchschnittsstaudaten:
    `getWeeklyAverages()`: Diese Funktion berechnet die durchschnittlichen Staudaten für jede Woche, indem sie die Daten von Montag bis Sonntag aggregiert.

- Formatierung der Datumswerte für wöchentliche Daten:
    - `formatWeeklyDate($date)`: Diese Funktion formatiert Datumswerte für die Anzeige der wöchentlichen Daten mit dem entsprechenden Wochentag.

- Formatierung der Chart-Daten:
    `formatChartData($data, $isWeekly = false)`: Diese Funktion formatiert die abgerufenen Daten für die Darstellung in den Liniengrafiken, je nach Intervall (wöchentlich oder stündlich).

- Formatierung eines Datumsstrings mit Wochentag:
    `formatDateWithDay($dateString)`: Diese Funktion formatiert einen Datumsstring, sodass der Wochentag angezeigt wird.

### heatmap.js – Darstellung der Daten für die Heatmaps
Dieses JavaScript-Skript erstellt eine Heatmap-Darstellung von Verkehrsdaten des Nord- und Südportals des Gotthards, die von einem PHP-Backend abgerufen werden. Die Grafik wird mit D3.js erstellt.

**Hauptfunktionalitäten**
- Tooltip-Erstellung und Stil:
  Ein Tooltip-Element wird erstellt und gestylt, das bei Mouseover-Ereignissen angezeigt wird.

- Erstellen der Heatmap:
  `createHeatmap()`: Diese Funktion ruft die Verkehrsdaten vom PHP-Backend ab und erstellt Heatmaps für das Nord- und Südportal.

- Erstellen der Heatmap für ein bestimmtes Portal:
  `createHeatmapForPortal(portal, data, selector)`: Diese Funktion erstellt eine Heatmap für ein angegebenes Portal und fügt Tooltip-Ereignisse hinzu.

- Aktualisieren der X-Achsenbeschriftungen**:
  `updateXLabels()`: Diese Funktion aktualisiert die X-Achsenbeschriftungen basierend auf der Fensterbreite und fügt sie zur SVG-Grafik hinzu.

- Planen der Heatmap-Aktualisierung**:
  `scheduleUpdate()`: Diese Funktion plant die Aktualisierung der Heatmap um Mitternacht und setzt einen Intervall-Timer zur täglichen Aktualisierung.

- Ereignislistener für das Öffnen und Schlissen des Datenmodals:
  Das Öffnen und Schliessen des Modals zur Anzeige der Heatmap wird durch Klick-Ereignisse gesteuert.

- Schaltflächen zum Umschalten zwischen Heatmaps**:
  Ereignislistener zum Umschalten zwischen den Heatmaps des Nord- und Südportals.

### chart.js – Darstellung der Daten für die Liniengrafiken
Dieses JavaScript-Skript erstellt verschiedene Linengrafiken, um die Verkehrsdaten für unterschiedliche Zeitintervalle (24 Stunden, 2 Tage, 1 Woche) darzustellen. Die Daten werden vom PHP-Backend abgerufen und in interaktiven Charts angezeigt. Die Grafiken werden mit chart.js erstellt.

**Hauptfunktionalitäten**
- Deklaration der Chart-Variablen**
  `let chart24h, chart2days, chart1week;`: Variablen zur Speicherung der Chart-Instanzen.

- Formatierung der X-Achsen-Beschriftung
  `formatLabelForAxis(value, chartId)`: Formatiert die X-Achsen-Beschriftungen, speziell für den 2-Tages-Chart.

- Aktualisierung der Charts
  `updateCharts()`: Ruft die Daten vom Server ab und erstellt die Charts für 24 Stunden, 2 Tage und 1 Woche.

- Wechseln zwischen den Charts
  - `switchChart(chartId)`: Wechselt zwischen den verschiedenen Charts und hebt die aktive Schaltfläche visuell hervor.