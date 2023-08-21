$(function() {
    // layer setup for changing them
    // i've had issues with ESRI layers recently, not sure what's happening there
    var OSM = new ol.source.OSM({
        crossOrigin:'anonymous',
      });
    
    var esri_terr_source = new ol.source.XYZ({
    attributions: [new ol.Attribution({
        html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/' +
            'rest/services/World_Terrain_Base/MapServer">ArcGIS</a>'
    })],
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
        crossOrigin:'anonymous'
    });

    var usgs_imagery_source = new ol.source.XYZ({
    attributions: [new ol.Attribution({
        html: 'Tiles &copy; <a href="https://basemap.nationalmap.gov/arcgis/' +
            'rest/services/World_Imagery/MapServer">ArcGIS</a>'
    })],
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/' +
        'USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
        crossOrigin:'anonymous'
    });

    var usgs_imagery_labels_source = new ol.source.XYZ({
    attributions: [new ol.Attribution({
        html: 'Tiles &copy; <a href="https://basemap.nationalmap.gov/arcgis/' +
            'rest/services/World_Imagery/MapServer">ArcGIS</a>'
    })],
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/' +
        'USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
        crossOrigin:'anonymous'
    });

    var esri_source = new ol.source.XYZ({
    attributions: [new ol.Attribution({
        html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/' +
            'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
    })],
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        crossOrigin:'anonymous'
    });

    var esri_world_source = new ol.source.XYZ({
    attributions: [new ol.Attribution({
        html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/' +
            'rest/services/World_Imagery/MapServer">ArcGIS</a>'
    })],
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Imagery/MapServer/tile/{z}/{y}/{x}',
        crossOrigin:'anonymous',
    maxZoom:19});

    var stamen_toner_source = new ol.source.XYZ({
      attributions: [new ol.Attribution({
        html: `Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. 
              Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.`
      })],
      url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
      crossOrigin: 'anonymous',
      maxZoom:19
    });
  
    var stamen_watercolor_source = new ol.source.XYZ({
      attributions: [new ol.Attribution({
        html: `Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.
              Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.`
      })],
      url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
      crossOrigin: 'anonymous',
      maxZoom:19
    });

    // need this for POST requests with some tethys versions
    const xcsrftoken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    $("input[name='csrfmiddlewaretoken']").remove();

    // get the hylak_ID from the URL, not any other way to get that on load currently
    let urlArray = window.location.href.split("/").filter(n => n);
    let Hylak_id = parseInt(urlArray[urlArray.length - 1]);
    document.title = `OL Test | Details - ${Hylak_id}`

    let tablinks = document.getElementsByClassName("tablinks");

    // get latlon from the table, used for PDF generation
    let latitude = parseFloat(document.getElementById("location-set-Latitude").innerText);
    let longitude = parseFloat(document.getElementById("location-set-Longitude").innerText);
    const coords = [longitude, latitude];

    // PDF zoom selector
    var zoomSel = document.getElementById("zoom-selector");
    var zoomVal = parseFloat(document.getElementById("zoom-selector").value);


    // map setup for PDF generation
    // setting up layer like this allows us to easily change it later
    var baseLayer = new ol.layer.Tile({
        source: OSM
    });

    // takes the feature from the information given from the server in the html
    var vecSource = new ol.source.Vector({
        features: [new ol.Feature({
            'geometry': new ol.geom.Point(ol.proj.fromLonLat(coords)),
            }), ],
    });

    // each point is green (possibly purple) with a black outline
    // has text below, white with black outline
    function dynamicStyle() { // ported from map.js
        let lakeType = parseInt(document.getElementById("misc-set-Lake Type").innerText);
        let lakeVol = parseFloat(document.getElementById("size-set-Total Volume").innerText);
        let lakeArea = parseFloat(document.getElementById("size-set-Lake Area").innerText);
        let col = '#73e69f'; // green
        let radius = 7.5;
        let img = undefined;

        if (!isNaN(lakeVol)) {
            radius = 5 - (Math.log2(7.7) / 3) + (Math.log2(lakeVol) / 3)
            if (radius > 10) radius = 10;
        }

        if (isNaN(lakeArea)) col = '#5118ad'; // purple

        if (lakeType == 1) { // 1: circle
            img = new ol.style.Circle({
                stroke: new ol.style.Stroke({
                  color: '#000'
                }),
                fill: new ol.style.Fill({
                  color: '#73e69f'
                }),
                radius: radius,
              })
        } else { // 2: triangle, 3: square. if continued: 4: pentagon, 5: hexagon, etc.
            img = new ol.style.RegularShape({
                stroke: new ol.style.Stroke({
                    color: '#000'
                }),
                fill: new ol.style.Fill({
                    color: col
                }),
                radius: radius,
                points: lakeType + 1,
                rotation: ((lakeType % 2) * (Math.PI / 4)) // if odd, rotate 45 degrees (RADIANS! so weird.)
            });
        }
        let text = new ol.style.Text({
            offsetY: 10,
            text: Hylak_id.toString(),
            stroke: new ol.style.Stroke({
              color: '#000',
              width: 3,
            }),
            fill: new ol.style.Fill({
              color: '#fff'
            }),
          })

        return new ol.style.Style ({
            image: img,
            text: text,
        })
    }

    // vector layer with a style function
    var vector = new ol.layer.Vector({
        source: vecSource,
        style: dynamicStyle,
    });

    var map = new ol.Map({
        layers: [baseLayer, vector],
        target: 'map',
        view: new ol.View({
            center: ol.proj.fromLonLat(coords),
            zoom: zoomVal
        }),
    });
    
    // functionality for zoom selector
    zoomSel.addEventListener('change', function() {
        zoomVal = parseFloat(document.getElementById("zoom-selector").value);
        map.getView().setZoom(zoomVal);
    })

    // functionality for layer selector
    // very simple, albeit long, switch case statement
    // easily expandable though
    document.getElementById("layer-selector").addEventListener('change', function() {
        switch(document.getElementById("layer-selector").value) {
            case "arcgis":
              baseLayer.setSource(ArcGIS);
              break;
            case "esri_terr":
              baseLayer.setSource(esri_terr_source);
              break;
            case "usgs_imagery":
              baseLayer.setSource(usgs_imagery_source);
              break;
            case "usgs_imagery_labels":
              baseLayer.setSource(usgs_imagery_labels_source);
              break;
            case "esri_source":
              baseLayer.setSource(esri_source);
              break;
            case "esri_world":
                baseLayer.setSource(esri_world_source);
                break;
            case "stamen_toner":
                baseLayer.setSource(stamen_toner_source)
                break;
            case "stamen_watercolor":
                baseLayer.setSource(stamen_watercolor_source);
                break;
            default:
                baseLayer.setSource(OSM);
        }
    })

    // function that downloads pdfs
    // screenshots the offscreen map container, sends it to server
    // asks server for a pdf
    function downloadPDF() {
        map.once('postcompose', function(e) {
            // screenshot, converts the map to base64 and removes the header
            var canvas = e.context.canvas;
            let url = canvas.toDataURL().replace("data:image/png;base64,", "");
            $.ajax({
                url:'/apps/ol-test/pdf/ajax/',
                method: 'POST',
                headers: {"X-CSRFToken": xcsrftoken},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
                },
                data: {
                    'csrfmiddlewaretoken': xcsrftoken,
                    'hylak_id': Hylak_id,
                    'map_blob': url,
                },
                dataType: "text",
                success: function(data) {
                    // changes the button text to signal completion
                    document.getElementById("pdf-btn-text").innerText = " Done!"
                    
                    // takes the data given, converts it to a Blob object,
                    // then creates a URL for it so we can access the memory object (PDF)
                    const blob = new Blob(data.split(""), {type: 'application/pdf'});
                    const burl = URL.createObjectURL(blob);
                    
                    // opens the PDF in a new tab
                    window.open(burl, '_blank');

                    // reset the button text after 1.5s
                    setTimeout( function() {
                        document.getElementById("pdf-btn-text").innerText = " Save .pdf"
                    }, 1500);
                },
                error: function() {
                    // changes the button text to signal an error
                    document.getElementById("pdf-btn-text").innerText = " Failed...";
                    // reset the button text after 1.5s
                    setTimeout( function() {
                        document.getElementById("pdf-btn-text").innerText = " Save .pdf";
                    }, 1500);
                }
            });
        });
        map.renderSync();
    }

    // setup to make sure map loaded before asking for pdf
    var loaded = 0;
    var loading = 0;
    var pdfON = 0;

    // ensures map loaded, then if the pdf button is clicked, download the pdf
    // if not, neat, the map's updated anyways
    function map2Update() {
        if (loading == loaded) {
        loaded = 0;
        loading = 0;
        if (pdfON) {
            pdfON = 0;
            setTimeout(function() {
                downloadPDF();
            }, 500);
        }
        }
    }
    
    // these two functions just make sure the map is regularly updated,
    // it checks for the pdf button regularly, and nothing happens until
    // everything that should be loaded is
    function map2AddLoading() {
        loading++;
        map2Update();
    }

    function map2AddLoaded() {
        setTimeout(function() {
        loaded++;
        map2Update();
        })
    }

    // implementing the functions added
    let mapLayer = map.getLayers().item(0)
    mapLayer.getSource().on("tileloadstart", function() {
        map2AddLoading();
    })
    mapLayer.getSource().on(["tileloadend", "tileloaderror"], function() {
        map2AddLoaded();
    })

    // functionality for switching tabs in the header
    // basically just shows and hides elements based on what header button is clicked
    const resizeList = [1, 1, 1, 1];
    function openTab(e) {
        // get all tab links and content
        let tablinks = document.getElementsByClassName("tablinks");
        let tabcontent = document.getElementsByClassName("tabcontent");

        // get the id of the tab that was just clicked
        let tabId = e.target.getAttribute("id");

        // make every single thing inactive
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        for (let i = 0; i < tablinks.length; i++) {
            $(tablinks[i]).removeClass("active");
        }

        // make the tab and tab content that was just clicked on active
        document.getElementById(tabId + "-content").style.display = "block";
        $(e.currentTarget).addClass("active");


        // i'm overengineering this
        // if a graph was clicked on, resize the window so it will fill the page
        // but only do it the first time that tab was clicked on,
        // otherwise it has marginally worse runtime every time the tab is clicked
        // basically it stutters for half a second and that got on my nerves
        const graphList = ["graph-full",
                        "graph-yearly",
                        "graph-monthly",
                        "graph-daily"]

        let index = graphList.indexOf(tabId);
        if ((index >= 0) && resizeList[index]){
            resizeList[index] = 0;
            window.dispatchEvent(new Event('resize'));
        }
    }
    

    // simple download csv function
    // mostly just asks the server for the file,
    // takes it, and forces the browser to download it
    function downloadCSV() {
        // change button text to be responsive
        document.getElementById("csv-btn-text").innerText = " Loading..."
			$.ajax({
				url:'/apps/ol-test/download_station_csv/',
				method: 'GET',
                data: { "hylak_id": Hylak_id },
				success: function (data) {
                    // change button text again
                    document.getElementById("csv-btn-text").innerText = " Done!"

                    // all of this forces the browser to download the csv
                    // it creates an element that you can click to download it, clicks it, then deletes it
					let element = document.createElement('a');
					let filename = Hylak_id + ".csv"
					element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
					element.setAttribute('download', filename);

					element.style.display = 'none';
					document.body.appendChild(element);

					element.click();

					document.body.removeChild(element);
                    setTimeout( function() {
                        // reset the button text
                        document.getElementById("csv-btn-text").innerText = " Save .csv"
                    }, 1500);
				},
				error: function() {
                    // change button text to be responsive
                    document.getElementById("csv-btn-text").innerText = " Failed...";
                    setTimeout( function() {
                        // reset button text
                        document.getElementById("csv-btn-text").innerText = " Save .csv";
                    }, 1500);
				}
			})
    }

    function downloadExcel() {
        // change button text to be responsive
        document.getElementById("excel-btn-text").innerText = " Loading..."
			$.ajax({
				url:'/apps/ol-test/download_station_xlsx/',
				method: 'GET',
                data: { "hylak_id": Hylak_id },
                // headers: {"responseType": 'arraybuffer'},
                responseType: 'arraybuffer',
                // dataType: 
				success: function (data) {
                    // change button text again
                    document.getElementById("excel-btn-text").innerText = " Done!"

                    // all of this forces the browser to download the xlsx
                    // it creates an element that you can click to download it, clicks it, then deletes it
					let element = document.createElement('a');
					let filename = Hylak_id + ".xlsx"

                    // set up the element to contain the data and show nothing
                    element.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + data;
                    element.download = filename;
					element.style.display = 'none';

                    // make it exist, activate it, then destroy it
					document.body.appendChild(element);
					element.click();
					document.body.removeChild(element);

                    setTimeout( function() {
                        // reset the button text
                        document.getElementById("excel-btn-text").innerText = " Save .xlsx"
                    }, 1500);
				},
				error: function() {
                    // change button text to be responsive
                    document.getElementById("excel-btn-text").innerText = " Failed...";
                    setTimeout( function() {
                        // reset button text
                        document.getElementById("excel-btn-text").innerText = " Save .xlsx";
                    }, 1500);
				}
			})
    }

    // makes the tab buttons work
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    $(tablinks[0]).trigger('click'); // ensures one is selected by default

    // the graphs are funky, they need a definite height or they'll take up about half the space they can
    // this is adjusted for padding
    let graphHeight = document.querySelector("#location-content").clientHeight - 124;
    let graphWidth = document.querySelector(`#location-content`).clientWidth - 22;

    // graph loading setup
    // all the exact same but with different timespans
    let url = "/apps/ol-test/hydrographs/ajax/";
    let full_data = {
        "csrfmiddlewaretoken": xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "width": graphWidth,
        "timespan": "total",
        "mode": 0,
    }
    let yearly_data = {
        "csrfmiddlewaretoken": xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "width": graphWidth,
        "timespan": "yearly",
        "mode": 0,
    }
    let monthly_data = {
        "csrfmiddlewaretoken": xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "width": graphWidth,
        "timespan": "monthly",
        "mode": 0,
    }
    let daily_data = {
        "csrfmiddlewaretoken": xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "width": graphWidth,
        "timespan": "daily",
        "mode": 0,
    }

    // useful for two functions, would rather have them easily editable in one spot rather than 2
    let meanColor = '#005fa5' // '#003f5c' // '#0080ff'
    let stdDevColor = '#ffa600'
    let extremesColor = '#bc5090'
    
    function processGraphData(inList) {
        var traces = [];
        // for some reason it likes to build itself backwards relative to how i want it
        // so i just reverse it
        for (let i = inList.length-1; i >= 0; i--) {
            // set defaults
            let lineColor = meanColor;
            let fillColor = "none";
            let fillType = "none";
            let name = inList[i][0];

            // change defaults if needed
            if ((name == "max")) {
                lineColor = extremesColor;
                fillType = "tonexty";
                fillColor = lineColor;
            }
            else if (name == "+σ") { // lowercase Sigma
                lineColor = stdDevColor;
                fillType = "tonexty";
                fillColor = lineColor;
            }
            // if mean is the only one, then there's no reason to change the defaults
            else if ((name == "mean") && (inList.length > 1)) {
                fillType = "tonexty";
                fillColor = stdDevColor;
            }
            else if (name == "-σ") { // lowercase Sigma
                lineColor = stdDevColor;
                fillType = "tonexty";
                fillColor = extremesColor
            }
            else if (name == "min") {
                lineColor = extremesColor;
                fillType = "none";
                fillColor = lineColor;
            }
            fillColor += "80"; // adds transparency to the fill colors, 80 corresponds to half

            // create the trace for the plot based on the data we just created and the data that was passed
            let trace = {
                name: inList[i][0], // I'd just put name here but i really like how this looks
                x: inList[i][1][0],
                y: inList[i][1][1],
                mode: 'lines',
                type: 'scatter',
                fill: fillType,
                fillcolor: fillColor,
                line: {
                    shape: 'spline',
                    'smoothing': 0.75,
                    color: lineColor,
                    width: 4,
                },
                visible: true,
            }
            traces.push(trace);
        }
        return traces;
    }

    // very complex functionality to make sure the graphs don't ever look dumb
    // i'm about 95% sure this works properly for every permutation of active traces
    // there's 120 permutations though so i doubt i've tested them all
    function legendClick(data) {
        // get the index of the trace that was just clicked
        let index = data.curveNumber;
        // create a default object to hold some data
        let json = {"min": {}};

        // fill that object full of important data
        for (let i = 0; i < data.data.length; i++) {
            // get needed data from passed data object
            let curveName = String(data.data[i]["name"]);
            let vis = String(data.data[i]["visible"]);

            // put it in our own data object
            json[curveName] = {"visible": vis, "index": i};

            // the visibility of what you just clicked only updates after this function is ran
            // so we have to update our object to reflect that ahead of time
            if (i == index) {
                if (vis == "true")
                    json[curveName]["visible"] = "legendonly";
                else
                    json[curveName]["visible"] = "true";
            }
        }
        
        // complicated logic time

        // max's visibility:
        // if every other thing is not visible, make max's fill "none"
        if ((json["+σ"].visible == "legendonly") && (json["mean"].visible == "legendonly") && (json["-σ"].visible == "legendonly") && (json["min"].visible == "legendonly"))
            data.data[json["max"].index].fill = "none";
        else // otherwise, default
            data.data[json["max"].index].fill = "tonexty";
        
        // +std's visibility
        // if everything below "+σ" is invisible, turn off fill as well
        // except if min is visible, then turn the fillcolor to extremesColor
        data.data[json["+σ"].index].fillcolor = stdDevColor + "80";
        data.data[json["+σ"].index].fill = "tonexty";
        if ((json["mean"].visible == "legendonly") && (json["-σ"].visible == "legendonly") && (json["min"].visible == "legendonly"))
            data.data[json["+σ"].index].fill = "none";
        else if ((json["mean"].visible == "legendonly") && (json["-σ"].visible == "legendonly") && (json["min"].visible == "true"))
            data.data[json["+σ"].index].fillcolor = extremesColor + "80";

        // mean's visibility:
        // generally going to be active, this activates it if it's not
        data.data[json["mean"].index].fill = "tonexty";
        // if -std not visible but min is, change mean's fill color to extremesColor
        if ((json["-σ"].visible == "legendonly") && (json["min"].visible == "true")){
            data.data[json["mean"].index].fillcolor = extremesColor + "80";
        }
        // if -std is visible, change mean's fill color to stdDevColor
        else if (json["-σ"].visible == "true"){
            data.data[json["mean"].index].fillcolor = stdDevColor + "80";
        }
        // if they're both invisible, make mean's fill "none"
        else if ((json["-σ"].visible == "legendonly") && (json["min"].visible == "legendonly"))
            data.data[json["mean"].index].fill = "none";

        // -std's visibility
        // if min not visible, fill = none. else, fill = tonexty
        if (json["min"].visible != "true")
            data.data[json["-σ"].index].fill = "none";
        else
            data.data[json["-σ"].index].fill = "tonexty";

        // min doesn't have any of this
        // if min's fill is ever anything other than "none" there's an issue
        data.data[json["min"].index].fill = "none";
    }

    // resizes all graphs on a resize event
    function plotResize() {
        // setup
        const graphDivs = [
            'graph-full-plot',
            'graph-yearly-plot',
            'graph-monthly-plot',
            'graph-daily-plot',
        ]
        let newGraphHeight = 0;
        let newGraphWidth = 0;
        
        // get all the tablinks
        let tablinks = document.getElementsByClassName("tablinks");

        // figure out which tablink is active
        // when found, get its height and width (minus padding), then break
        for (let i = 0; i < tablinks.length; i++) {
            if (tablinks[i].classList.value.includes("active")) {
                newGraphHeight = document.querySelector(`#${tablinks[i].id}-content`).clientHeight - 124;
                newGraphWidth = document.querySelector(`#${tablinks[i].id}-content`).clientWidth - 22;
                break;
            }
        }

        // set each graph's dimensions to these new values
        for (let i = 0; i < graphDivs.length; i++) {
            let update = {
                height: newGraphHeight,
                width: newGraphWidth
            }
            Plotly.relayout(graphDivs[i], update);
        }
    }

    // make plotResize actually happen on a resize event
    window.addEventListener('resize', plotResize)

    // constants through the ajax calls
    var config = {showTips: false};
    var graphMargin = {
        l: 100,
        r: 100,
        b: 50,
        t: 50,
        pad: 4,
    }

    // all of the ajax calls should look about the same, with ust a few minor differences
    // those differences are the title name and things to do with the x-axis,
    // the data it's retrieving, and where it goes

    // also all of these disable the functionality with the graphs where you can
    // double-click a trace in the legend and only show that one
    // it causes some weird bugs with my legendClick() logic that i do not want to
    // fix or create another function for

    $.ajax(url, {
        method: 'POST',
        headers: {"X-CSRFToken": xcsrftoken},
        beforeSend: function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
        },
        data: full_data,
        dataType: "json",
        success: function (data) {
            var layout = {
                height: graphHeight,
                margin: graphMargin,
                title: `Historical Surface Area for ${Hylak_id}`,
                xaxis:  {'title': 'Time (date)'},
                yaxis:  {'title': 'Surface Area (km²)'},
                xaxis: {
                    tickformat: '%b-%d-%Y',
                    tickangle: 15,
                    dtick: "M12",
                },
                hovermode: "x unified",
            };
            Plotly.newPlot('graph-full-plot', processGraphData(data['data']), layout, config);
            $("#full-loader").hide();
            var myPlot = document.getElementById('graph-full-plot');
            myPlot.on('plotly_legendclick', () => false);
            myPlot.on('plotly_legenddoubleclick', () => false);
        }
    });

    $.ajax(url, {
        method: 'POST',
        headers: {"X-CSRFToken": xcsrftoken},
        beforeSend: function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
        },
        data: yearly_data,
        dataType: "json",
        success: function (data) {
            var layout = {
                height: graphHeight,
                margin: graphMargin,
                title: `Yearly Surface Area for ${Hylak_id}`,
                xaxis:  {'title': 'Time (date)'},
                yaxis:  {'title': 'Surface Area (km²)'},
                hovermode: "x unified",
            };
            Plotly.newPlot('graph-yearly-plot', processGraphData(data['data']), layout, config);
            $("#yearly-loader").hide();
            var myPlot = document.getElementById('graph-yearly-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data)
            });
            myPlot.on('plotly_legenddoubleclick', () => false);
        }
    });

    $.ajax(url, {
        method: 'POST',
        headers: {"X-CSRFToken": xcsrftoken},
        beforeSend: function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
        },
        data: monthly_data,
        dataType: "json",
        success: function (data) {
            var layout = {
                height: graphHeight,
                margin: graphMargin,
                title: `Monthly Surface Area for ${Hylak_id}`,
                xaxis:  {'title': 'Time (date)'},
                yaxis:  {'title': 'Surface Area (km²)'},
                xaxis: {
                    tickformat: '%b'
                },
                hovermode: "x unified",
            };
            Plotly.newPlot('graph-monthly-plot', processGraphData(data['data']), layout, config);
            $("#monthly-loader").hide();
            var myPlot = document.getElementById('graph-monthly-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data)
            });
            myPlot.on('plotly_legenddoubleclick', () => false);
        }
    });

    $.ajax(url, {
        method: 'POST',
        headers: {"X-CSRFToken": xcsrftoken},
        beforeSend: function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
        },
        data: daily_data,
        dataType: "json",
        success: function (data) {
            var layout = {
                height: graphHeight,
                margin: graphMargin,
                title: `Daily Surface Area for ${Hylak_id}`,
                xaxis:  {'title': 'Time (date)'},
                yaxis:  {'title': 'Surface Area (km²)'},
                xaxis: {
                    tickformat: '%b-%d'
                },
                hovermode: "x unified",
            };
            Plotly.newPlot('graph-daily-plot', processGraphData(data['data']), layout, config);
            $("#daily-loader").hide();
            var myPlot = document.getElementById('graph-daily-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data)
            });
            myPlot.on('plotly_legenddoubleclick', () => false);
        }
    });

    // simple functionality for the download buttons
    document.getElementById("download-pdf-btn").addEventListener('click', function() {
        document.getElementById("pdf-btn-text").innerText = " Loading..."
        pdfON = 1;
        setTimeout(function() {
            if (loading == loaded) { // if it isn't called soon, call the update function ourselves
                map2Update();
            }
        }, 100);
    });
    document.getElementById("download-csv-btn").addEventListener('click', downloadCSV);
    document.getElementById("download-excel-btn").addEventListener('click', downloadExcel);
})