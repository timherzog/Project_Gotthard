document.addEventListener("DOMContentLoaded", function() {
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "fixed")
        .style("text-align", "left")
        .style("padding", "5px")
        .style("font-size", "12px")
        .style("background", "white")
        .style("border-radius", "5px")
        .style("pointer-events", "none") 
        .style("opacity", 0);

    function createHeatmap() {
        fetch('extract_heatmap_data.php')
            .then(response => response.json())
            .then(data => {
                var margin = {top: 30, right: 30, bottom: 100, left: 30},
                    width = 600 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;

                var svg = d3.select("#heatmap")
                    .html("") // Clear previous content
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("viewBox", "0 0 600 500") // Set a viewBox to scale appropriately
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
                var hours = d3.range(24);

                // Define color scale with domain and range
                var colorScale = d3.scaleThreshold()
                    .domain([0.1, 0.9, 1.9, 3.9, 5.9, 7.9, 9.9, 11.9, 14.9]) // Define the thresholds for the color scale
                    .range([
                        "#f7f7f7", // Color for 0
                        "#fee5d9", // Color for <=0.5
                        "#fcbba1", // Color for <=1
                        "#fc9272", // Color for <=4
                        "#fb6a4a", // Color for <=6
                        "#ef3b2c", // Color for <=8
                        "#cb181d", // Color for <=10
                        "#99000d", // Color for <=15
                        "#67000d"  // Color for >15 (Highest Value)
                    ]);

                // Prepare nested data for heatmap
                var nestedData = d3.rollup(data, 
                    v => d3.mean(v, d => d.avg_stau_nord),
                    d => d.day,
                    d => d.hour
                );

                var heatmapData = [];
                nestedData.forEach((hours, day) => {
                    hours.forEach((value, hour) => {
                        heatmapData.push({day: +day, hour: +hour, value: value});
                    });
                });

                // Add the heatmap rectangles
                svg.selectAll("rect")
                    .data(heatmapData, function(d) { return d.day + ':' + d.hour; })
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return d.hour * width / 24; })
                    .attr("y", function(d) { return d.day * height / 7; })
                    .attr("width", width / 24)
                    .attr("height", height / 7)
                    .style("fill", function(d) { return colorScale(d.value); })
                    .on("mouseover", function(event, d) {
                        var tooltipWidth = 150; // Geschätzte Breite des Tooltips
                        var tooltipOffset = 10; // Abstand des Tooltips zum Cursor
                        var screenWidth = window.innerWidth;
                        var screenHeight = window.innerHeight;
                        var mouseX = event.pageX;
                        var mouseY = event.pageY;
                        
                        // Berechne die Position des Tooltips
                        var tooltipX, tooltipY;
                    
                        // Bestimmen, ob das Tooltip rechts oder links vom Cursor erscheinen soll
                        if (mouseX + tooltipWidth + tooltipOffset > screenWidth) {
                            // Tooltip soll links erscheinen
                            tooltipX = mouseX - tooltipWidth - tooltipOffset;
                        } else {
                            // Tooltip soll rechts erscheinen
                            tooltipX = mouseX + tooltipOffset;
                        }
                    
                        // Berechne die Y-Position des Tooltips, um sicherzustellen, dass es nicht über den Bildschirmrand hinausgeht
                        if (mouseY - 40 < 0) {
                            // Wenn der Tooltip oben aus dem Sichtbereich ragt, positioniere ihn weiter nach unten
                            tooltipY = mouseY + 20;
                        } else {
                            tooltipY = mouseY - 40;
                        }
                    
                        tooltip.transition().duration(200).style("opacity", .9);
                        tooltip.html("Tag: " + days[d.day] + "<br>Uhrzeit: " + d.hour + ":00<br>Stau (Ø): " + d.value.toFixed(1) + "km")
                            .style("left", tooltipX + "px")
                            .style("top", tooltipY + "px");
                    })
                    
                    
                    .on("mouseout", function() {
                        tooltip.transition().duration(200).style("opacity", 0);
                    })
                    .on("touchstart", hideTooltip)
                    .on("touchmove", hideTooltip)
                    .on("touchend", hideTooltip);

                    // Define the number of hours in a day
                    const totalHours = 24;

                // Add x-axis labels
                var xLabels = svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .selectAll("text")
                .data(d3.range(0, totalHours))
                .enter()
                .append("text")
                .text(d => {
                    // Nur jede zweite Stunde auf Smartphones anzeigen
                    if (window.innerWidth <= 480) {
                        return d % 2 === 0 ? d.toString().padStart(2, '0') + ":00" : "";
                    }
                    return d.toString().padStart(2, '0') + ":00";
                })
                .attr("x", (d, i) => i * (width / totalHours))
                .attr("y", 20)
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .style("font-family", "Arial, sans-serif")
                .attr("transform", (d, i) => {
                    const xPos = i * (width / totalHours);
                    const yPos = 20;
                    return `rotate(-45, ${xPos}, ${yPos})`;
                });



                // Add y-axis labels
                var yLabels = svg.append("g")
                    .selectAll("text")
                    .data(days)
                    .enter()
                    .append("text")
                    .text(d => d)
                    .attr("x", -10)
                    .attr("y", (d, i) => i * height / 7 + height / 14)
                    .attr("dy", "0.35em")
                    .style("text-anchor", "end")
                    .style("font-size", "12px")
                    .style("font-family", "Arial, sans-serif");

                // Add legend
                var legendWidth = 300, legendHeight = 20;
                var legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(0," + (height + margin.bottom / 2) + ")");

                // Legend rectangles
                legend.selectAll("rect")
                    .data(colorScale.range())
                    .enter()
                    .append("rect")
                    .attr("x", function(d, i) { return i * (legendWidth / colorScale.range().length); })
                    .attr("y", 0)
                    .attr("width", legendWidth / colorScale.range().length)
                    .attr("height", legendHeight)
                    .style("fill", d => d);

                // Legend axis
                legend.append("g")
                    .attr("class", "legend-axis")
                    .attr("transform", "translate(0," + legendHeight + ")")
                    .call(d3.axisBottom(d3.scaleLinear().domain([0, 15]).range([0, legendWidth])));

                // Scroll event listener to hide tooltip on scroll
                function hideTooltip() {
                    tooltip.transition().duration(500).style("opacity", 0);
                }

                document.addEventListener('scroll', hideTooltip);
            });
    }

    function scheduleUpdate() {
        var now = new Date();
        var nextUpdate = new Date();

        nextUpdate.setDate(now.getDate() + 1);
        nextUpdate.setHours(0);
        nextUpdate.setMinutes(5);
        nextUpdate.setSeconds(0);

        var timeout = nextUpdate - now;

        setTimeout(function() {
            createHeatmap();
            setInterval(createHeatmap, 24 * 60 * 60 * 1000);
        }, timeout);
    }

    document.getElementById('dataIcon').addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'block';
        createChart();  // Ensure createChart is defined
        createHeatmap();
    });

    document.getElementsByClassName('close')[0].addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'none';
    });

    scheduleUpdate();
});
