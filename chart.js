document.addEventListener("DOMContentLoaded", function() {
    // Deklaration der Chart-Variablen
    let chart24h, chart2days, chart1week;

    // Funktion zur Überprüfung, ob der Bildschirm klein ist (Bruch gleich wie bei Heatmap)
    function isSmallScreen() {
        return window.innerWidth <= 732;
    }

    // Funktion zur Formatierung der X-Achsen-Beschriftung
    function formatLabelForAxis(value, chartId) {
        if (chartId === 'trafficChart2days') {
            const [datePart, timePart] = value.split(' ');
            if (timePart === '00:00') {
                const date = new Date(datePart + 'T' + timePart);
                const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
                return weekdays[date.getDay()] + ' ' + 
                       date.getDate().toString().padStart(2, '0') + '.' + 
                       (date.getMonth() + 1).toString().padStart(2, '0') + '.';
            }
            return '';
        }
        return value;
    }

    // Funktion zur Erstellung der Charts
    function createChart(chartId, data, labels) {
        const ctx = document.getElementById(chartId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ø Staukilometer Nord',
                        data: data.nord,
                        borderColor: 'rgb(76, 138, 226)',
                        tension: 0.1
                    },
                    {
                        label: 'Ø Staukilometer Süd',
                        data: data.sued,
                        borderColor: 'rgb(227, 147, 61)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Staukilometer'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Zeitpunkt'
                        },
                        ticks: {
                            callback: function(value, index, values) {
                                if (chartId === 'trafficChart' && isSmallScreen() && index % 2 !== 0) {
                                    return ''; // Nur für 24h-Chart auf kleinen Bildschirmen jede zweite Beschriftung ausblenden
                                }
                                return formatLabelForAxis(this.getLabelForValue(value), chartId);
                            },
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                // Spezielle Formatierung für Tooltip-Titel im 2-Tages-Chart
                                if (chartId === 'trafficChart2days') {
                                    const label = tooltipItems[0].label;
                                    const [datePart, timePart] = label.split(' ');
                                    const date = new Date(datePart + 'T' + timePart);
                                    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
                                    return weekdays[date.getDay()] + ' ' + 
                                           date.getDate().toString().padStart(2, '0') + '.' + 
                                           (date.getMonth() + 1).toString().padStart(2, '0') + '. ' + 
                                           date.getHours().toString().padStart(2, '0') + ':' + 
                                           date.getMinutes().toString().padStart(2, '0');
                                }
                                return tooltipItems[0].label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Funktion zur Aktualisierung der Charts durch Abrufen der Daten vom Server
    function updateCharts() {
        fetch('extract_chart_data.php')
            .then(response => response.json())
            .then(data => {
                // Charts erstellen mit den abgerufenen Daten
                chart24h = createChart('trafficChart', data.last24h, data.last24h.labels);
                chart2days = createChart('trafficChart2days', data.last2days, data.last2days.labels);
                chart1week = createChart('trafficChart1week', data.lastWeek, data.lastWeek.labels);
            });
    }

    // Funktion zum Wechseln zwischen den Charts
    function switchChart(chartId) {
        // Alle Chart-Container ausblenden
        document.querySelectorAll('.chart-container').forEach(container => {
            container.style.display = 'none';
        });
        // Den ausgewählten Chart-Container anzeigen
        document.getElementById(chartId).style.display = 'block';
        
        // Die aktive Schaltfläche visuell hervorheben
        document.querySelectorAll('.line-chart-buttons button').forEach(button => {
            button.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    // Event-Listener zum Wechseln zwischen den Charts
    document.getElementById('btn24h').addEventListener('click', () => switchChart('chart24h'));
    document.getElementById('btn2days').addEventListener('click', () => switchChart('chart2days'));
    document.getElementById('btn1week').addEventListener('click', () => switchChart('chart1week'));

    // Event-Listener für das Daten-Icon, um das Modal zu öffnen und die Charts zu aktualisieren
    document.getElementById('dataIcon').addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'block';
        document.body.classList.add('modal-open');
        updateCharts();
    });

    // Event-Listener zum Schließen des Modals
    document.getElementsByClassName('close')[0].addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    // Event-Listener zum Aktualisieren der Charts bei Resize
    window.addEventListener('resize', function() {
        if (chart24h) chart24h.update();
        if (chart2days) chart2days.update();
        if (chart1week) chart1week.update();
    });
});