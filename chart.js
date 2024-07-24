document.addEventListener("DOMContentLoaded", function() {
    window.createChart = function() {
        fetch('extract_chart_data.php')
            .then(response => response.json())
            .then(data => {
                // Kontext für das Chart-Element holen
                var ctx = document.getElementById('trafficChart').getContext('2d');
                var chart = new Chart(ctx, {
                    type: 'line', // Typ des Charts
                    data: {
                        labels: data.labels, // Labels für die x-Achse
                        datasets: [
                            {
                                label: 'Ø Staukilometer Nord',
                                data: data.nord, // Daten für den Norden
                                fill: false,
                                borderColor: 'rgb(76, 138, 226)', // Farbe der Linie
                                tension: 0.1 // Spannung der Linie
                            },
                            {
                                label: 'Ø Staukilometer Süd',
                                data: data.sued, // Daten für den Süden
                                fill: false,
                                borderColor: 'rgb(227, 147, 61)', // Farbe der Linie
                                tension: 0.1 // Spannung der Linie
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true, // Y-Achse beginnt bei null
                                title: {
                                    display: true,
                                    text: 'Staukilometer' // Titel der Y-Achse
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Uhrzeit' // Titel der X-Achse
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom' // Position der Legende
                            }
                        }
                    }
                });

                // Funktion zum Aktualisieren der Chart
                function updateChart() {
                    fetch('extract.php')
                        .then(response => response.json())
                        .then(data => {
                            chart.data.labels = data.labels;
                            chart.data.datasets[0].data = data.nord;
                            chart.data.datasets[1].data = data.sued;
                            chart.update();
                        });
                }

                // Funktion zur Planung des nächsten Updates
                function scheduleUpdate() {
                    var now = new Date();
                    var nextUpdate = new Date();

                    // Überprüfen, ob die nächste Aktualisierung in der nächsten Stunde stattfindet
                    if (now.getMinutes() >= 5) {
                        nextUpdate.setHours(now.getHours() + 1);
                    }
                    nextUpdate.setMinutes(5);
                    nextUpdate.setSeconds(0);

                    var timeout = nextUpdate - now;

                    setTimeout(function() {
                        updateChart();
                        setInterval(updateChart, 3600000);
                    }, timeout);
                }

                // Update-Planung starten
                scheduleUpdate();
            });
    };

    // Event-Listener für Klick auf das Daten-Icon
    document.getElementById('dataIcon').addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'block';
        document.body.classList.add('modal-open');
        createChart();
    });

    // Event-Listener zum Schließen des Modals
    document.getElementsByClassName('close')[0].addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'none';
        document.body.classList.remove('modal-open');
    });
});
