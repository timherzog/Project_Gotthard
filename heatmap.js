document.addEventListener("DOMContentLoaded", function() {
    // Tooltip-Element erstellen und Stil festlegen
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "fixed")
        .style("text-align", "left")
        .style("padding", "5px")
        .style("font-size", "12px")
        .style("background", "white")
        .style("border-radius", "5px")
        .style("pointer-events", "none") 
        .style("opacity", 0)
        .style("fill", "red");

    // Funktion zum Erstellen der Heatmap
    function createHeatmap() {
        fetch('extract_heatmap_data.php')
            .then(response => response.json())
            .then(data => {
                createHeatmapForPortal('Nord', data.nord, '#heatmapNord');
                createHeatmapForPortal('Süd', data.sued, '#heatmapSued');
            });
    }

    // Funktion zum Erstellen der Heatmap für ein bestimmtes Portal
    function createHeatmapForPortal(portal, data, selector) {
        const margin = {top: 0, right: 15, bottom: 30, left: 75};
        const width = 600 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        // SVG-Element erstellen
        const svg = d3.select(selector)
            .html("") 
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 600 500")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const days = ["Gestern", "Vorgestern", "Vor 3 Tagen", "Vor 4 Tagen", "Vor 5 Tagen", "Vor 6 Tagen", "Vor 7 Tagen"];
        const hours = d3.range(24);

        // Farbbereich für die Heatmap definieren
        const colorScale = d3.scaleThreshold()
            .domain([0.1, 0.9, 1.9, 3.9, 5.9, 7.9, 9.9, 11.9, 14.9])
            .range([
                "#f7f7f7", "#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", 
                "#ef3b2c", "#cb181d", "#99000d", "#67000d"
            ]);
        
        // Rechtecke für die Heatmap erstellen und Tooltip-Ereignisse hinzufügen
        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => d.hour * width / 24)
            .attr("y", d => d.day * height / 7)
            .attr("width", width / 24)
            .attr("height", height / 7)
            .style("fill", d => colorScale(d.value))
            .on("mouseover", function(event, d) {
                // Tooltip-Position und Inhalt festlegen
                const tooltipWidth = 150;
                const tooltipOffset = 10;
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const mouseX = event.pageX;
                const mouseY = event.pageY;
                
                let tooltipX = mouseX + tooltipOffset > screenWidth ? mouseX - tooltipWidth - tooltipOffset : mouseX + tooltipOffset;
                let tooltipY = mouseY - 40 < 0 ? mouseY + 20 : mouseY - 40;
            
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`Tag: ${days[d.day]}<br>Uhrzeit: ${d.hour}:00<br>Stau (Ø): ${d.value.toFixed(1)}km`)
                    .style("left", tooltipX + "px")
                    .style("top", tooltipY + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(200).style("opacity", 0);
            });
        // Funktion zum Aktualisieren der X-Achsenbeschriftungen
        function updateXLabels() {
            svg.selectAll(".x-label").remove();

            const xLabelInterval = window.innerWidth <= 732 ? 2 : 1;

            svg.append("g")
                .selectAll("text")
                .data(hours.filter((h, i) => i % xLabelInterval === 0))
                .enter()
                .append("text")
                .text(d => (d < 10 ? "0" : "") + d + ":00")
                .attr("x", d => d * width / 24 + width / 48)
                .attr("y", height + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("font-family", "Arial, sans-serif")
                .style("fill", "rgb(102, 102, 102)")
                .attr("transform", (d, i) => {
                    const xPos = d * (width / 24) + width / 48;
                    const yPos = height + 20;
                    return `rotate(-45, ${xPos}, ${yPos})`;
                })
                .attr("class", "x-label");
        }

        updateXLabels();
        window.addEventListener('resize', updateXLabels);

        // Y-Achsenbeschriftungen hinzufügen
        svg.append("g")
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
            .style("font-family", "Arial, sans-serif")
            .style("fill", "rgb(102, 102, 102)");

        // Legende hinzufügen (auskommentierter da in html/css erstellt)
        // const legendWidth = 300;
        // const legendHeight = 20;
        // const legend = svg.append("g")
        //     .attr("class", "legend")
        //     .attr("transform", "translate(0," + (height + margin.bottom / 2) + ")");

        // legend.selectAll("rect")
        //     .data(colorScale.range())
        //     .enter()
        //     .append("rect")
        //     .attr("x", (d, i) => i * (legendWidth / colorScale.range().length))
        //     .attr("y", 0)
        //     .attr("width", legendWidth / colorScale.range().length)
        //     .attr("height", legendHeight)
        //     .style("fill", d => d);

        // legend.append("g")
        //     .attr("class", "legend-axis")
        //     .attr("transform", "translate(0," + legendHeight + ")")
        //     .call(d3.axisBottom(d3.scaleLinear().domain([0, 15]).range([0, legendWidth])));
    }

    // Funktion zum Planen der Heatmap-Aktualisierung
    function scheduleUpdate() {
        const now = new Date();
        const nextUpdate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 5, 0, 0);
        const timeout = nextUpdate - now;

        setTimeout(function() {
            createHeatmap();
            setInterval(createHeatmap, 24 * 60 * 60 * 1000);
        }, timeout);
    }

    // Ereignislistener für das Öffnen des Datenmodals
    document.getElementById('dataIcon').addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'block';
        createHeatmap();
    });

    // Ereignislistener für das Schließen des Datenmodals
    document.getElementsByClassName('close')[0].addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'none';
    });

    // Schaltflächen zum Umschalten zwischen Heatmaps
    const heatmapButtons = document.querySelectorAll('.heatmap-buttons button');
    
    // Initialer Zustand der Heatmap-Schaltflächen
    function setInitialHeatmapButtonState() {
        heatmapButtons[0].classList.add('heatmap-active');
        document.getElementById('heatmapNord').style.display = 'block';
        document.getElementById('heatmapSued').style.display = 'none';
    }

    // Ereignislistener für das Umschalten der Heatmaps
    heatmapButtons.forEach(button => {
        button.addEventListener('click', function() {
            heatmapButtons.forEach(btn => btn.classList.remove('heatmap-active'));
            this.classList.add('heatmap-active');
            
            const portal = this.textContent.trim();
            document.getElementById('heatmapNord').style.display = portal === 'Nordportal' ? 'block' : 'none';
            document.getElementById('heatmapSued').style.display = portal === 'Südportal' ? 'block' : 'none';
        });
    });

    // Aktualisierung planen und initialen Zustand festlegen
    document.getElementById('dataIcon').addEventListener('click', function() {
        document.getElementById('dataModal').style.display = 'block';
        createHeatmap();
        setInitialHeatmapButtonState(); // Setze den initialen Zustand beim Öffnen des Modals
    });

    // Heatmap-Aktualisierung planen
    scheduleUpdate();
});