document.addEventListener("DOMContentLoaded", function() {
    window.createChart = function() {
        fetch('extract_chart_data.php')
            .then(response => response.json())
            .then(data => {
                var ctx = document.getElementById('trafficChart').getContext('2d');
                var chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [
                            {
                                label: 'Ø Staukilometer Nord',
                                data: data.nord,
                                fill: false,
                                borderColor: 'rgb(76, 138, 226)',
                                tension: 0.1
                            },
                            {
                                label: 'Ø Staukilometer Süd',
                                data: data.sued,
                                fill: false,
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
                                    text: 'Uhrzeit'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom'
                            }
                        }
                    }
                });

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

                function scheduleUpdate() {
                    var now = new Date();
                    var nextUpdate = new Date();

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

                scheduleUpdate();
            });
    };

    document.getElementById('dataIcon').addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'block';
        document.body.classList.add('modal-open');
        createChart();
    });

    document.getElementsByClassName('close')[0].addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'none';
        document.body.classList.remove('modal-open');
    });
});
