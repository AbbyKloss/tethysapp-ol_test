$(function() {
    // layer setup for changing them
    // most of these seem to be down today?
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

    // function getCookie(name) {
    // let cookieValue = null;
    // if (document.cookie && document.cookie !== '') {
    //     const cookies = document.cookie.split(';');
    //     for (let i = 0; i < cookies.length; i++) {
    //         const cookie = cookies[i].trim();
    //         // Does this cookie string begin with the name we want?
    //         if (cookie.substring(0, name.length + 1) === (name + '=')) {
    //             cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //             break;
    //         }
    //     }
    // }
    // return cookieValue;
    // }
    // const csrftoken = getCookie('csrftoken');
    const xcsrftoken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    $("input[name='csrfmiddlewaretoken']").remove();

    let urlArray = window.location.href.split("/").filter(n => n);
    let Hylak_id = parseInt(urlArray[urlArray.length - 1]);
    let graphHeight = 1000;

    let tablinks = document.getElementsByClassName("tablinks");

    // loading text functionality
    // $('.loader').hide();
    // $(document).ajaxSend(function() {
    //     $('.loader').show();
    // });
    // $(document).ajaxComplete(function() {
    //     $('.loader').hide();
    // });
    // console.log(document.getElementById("location-content"));
    let latitude = parseFloat(document.getElementById("location-set-Latitude").innerText);
    let longitude = parseFloat(document.getElementById("location-set-Longitude").innerText);
    // console.log(latitude);
    // console.log(longitude);
    const coords = [longitude, latitude];


    var zoomSel = document.getElementById("zoom-selector");
    var zoomVal = parseFloat(document.getElementById("zoom-selector").value);


    // map setup
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

    // vector layer with a style
    // each point is green with a black outline
    // has text below, white with black outline
    var vector = new ol.layer.Vector({
        source: vecSource,
        style: new ol.style.Style({
            image: new ol.style.Circle({
              stroke: new ol.style.Stroke({
                color: '#000'
              }),
              fill: new ol.style.Fill({
                color: '#73e69f'
              }),
              radius: 5,
            }),
            text: new ol.style.Text({
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
          })
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
            default:
              baseLayer.setSource(OSM);
          }
    })

    // function that downloads pdfs
    // screenshots the offscreen map div, sends it to server
    // asks server for a pdf
    function downloadPDF() {
        map.once('postcompose', function(e) {
            var canvas = e.context.canvas;
            let url = canvas.toDataURL().replace("data:image/png;base64,", "");
            $.ajax({
                url:'/apps/ol-test/pdf/ajax/',
                method: 'POST',
                // headers: {"X-CSRFToken": csrftoken},
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
                success: function (data) {
                    document.getElementById("pdf-btn-text").innerText = " Done!"
                    
                    const blob = new Blob(data.split(""), {type: 'application/pdf'});
                    const burl = URL.createObjectURL(blob);
                    
                    window.open(burl, '_blank');
                    setTimeout( function() {
                        document.getElementById("pdf-btn-text").innerText = " Save .pdf"
                    }, 1500);
                },
                error: function() {
                    document.getElementById("pdf-btn-text").innerText = " Failed...";
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
        // console.log(`${loaded} | ${loading}`);
        loaded = 0;
        loading = 0;
        if (pdfON) {
            // console.log(`PDF Downloading, ${pdfON}`);
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
    function openTab(e) {
        let tablinks = document.getElementsByClassName("tablinks");
        let tabcontent = document.getElementsByClassName("tabcontent");
        let tabId = e.target.getAttribute("id");
        // console.log(e);
        // console.log(className);
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        for (let i = 0; i < tablinks.length; i++) {
            $(tablinks[i]).removeClass("active");
        }
        document.getElementById(tabId + "-content").style.display = "block";
        $(e.currentTarget).addClass("active");
        if (tabId == "graph-full" || tabId == "graph-yearly" || tabId == "graph-monthly" || tabId == "graph-daily" || tabId == "location")
          window.dispatchEvent(new Event('resize'));
        
    }
    

    // simple download csv function
    // mostly just asks the server for the file,
    // takes it, and forces the browser to download it
    function downloadCSV() {
        document.getElementById("csv-btn-text").innerText = " Loading..."
			$.ajax({
				url:'/apps/ol-test/download_station_csv/',
				method: 'GET',
                data: { "hylak_id": Hylak_id },
				success: function (data) {
                    document.getElementById("csv-btn-text").innerText = " Done!"
					let element = document.createElement('a');
					let filename = Hylak_id + ".csv"
					element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
					element.setAttribute('download', filename);

					element.style.display = 'none';
					document.body.appendChild(element);

					element.click();

					document.body.removeChild(element);
                    setTimeout( function() {
                        document.getElementById("csv-btn-text").innerText = " Save .csv"
                    }, 1500);
				},
				error: function() {
					console.log("Failure...");
                    document.getElementById("csv-btn-text").innerText = " Failed...";
                    setTimeout( function() {
                        document.getElementById("csv-btn-text").innerText = " Save .csv";
                    }, 1500);
				}
			})
    }

    // makes the tab buttons work
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    $(tablinks[0]).trigger('click'); // ensures one is selected by default
    graphHeight = document.querySelector("#location-content").clientHeight - 124; // the graphs are funky, they need a definite height to load in
    graphWidth = document.querySelector("#location-content").clientWidth - 24; // the graphs are funky, they need a definite height to load in

    // graph loading setup
    let url = "/apps/ol-test/hydrographs/ajax/";
    let full_data = {
        'csrfmiddlewaretoken': xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "total",
        "mode": 0,
    }
    let yearly_data = {
        'csrfmiddlewaretoken': xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "yearly",
        "mode": 0,
    }
    let monthly_data = {
        'csrfmiddlewaretoken': xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "monthly",
        "mode": 0,
    }
    let daily_data = {
        'csrfmiddlewaretoken': xcsrftoken,
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "daily",
        "mode": 0,
    }
    // graph loading payoff (all of these load the graphs serially in each of their tabs)
    // $('#graph-normal-plot').load(url, total_data, function() {
    //     $("#normal-loader").hide();
    // });
    // $('#graph-yearly-plot').load(url, yearly_data, function() {
    //     $("#yearly-loader").hide();
    // });
    // $('#graph-monthly-plot').load(url, monthly_data, function() {
    //     $("#monthly-loader").hide();
    // });
    // var retstr;
    // $('#graph-daily-plot').load(url, daily_data, function(strong) {
    //     $("#daily-loader").hide();
    //     // retstr = strong;
    //     console.log(strong);
    // });

    // useful for two functions, would rather have them easily editable in one spot rather than 2
    let meanColor = '#005fa5' // '#003f5c' // '#0080ff'
    let stdDevColor = '#ffa600'
    let extremesColor = '#bc5090'
    
    function processGraphData(inList) {
        var traces = [];
        for (let i = inList.length-1; i >= 0; i--) {
            let lineColor = meanColor;
            let fillColor = "none";
            let fillType = "none";
            let name = inList[i][0];

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
            fillColor += "80";

            let trace = {
                name: inList[i][0], // I'd just put name here but i really like how this looks
                x: inList[i][1][0],
                y: inList[i][1][1],
                mode: 'lines',
                type: 'scatter',
                fill: fillType,
                fillcolor: fillColor,
                line: {
                    color: lineColor,
                    width: 4,
                },
                visible: true,
            }
            traces.push(trace);
        }
        return traces;
    }

    /* names: 
    "max"
    "+σ"
    "mean"
    "-σ"
    "min"
    */

    function legendClick(data, divID) {
        console.log(data);
        let index = data.curveNumber;
        let json = {"min": {}};
        for (let i = 0; i < data.data.length; i++) {
            let curveName = String(data.data[i]["name"]);
            let vis = String(data.data[i]["visible"]);
            json[curveName] = {"visible": "yes", "index": 0};
            json[curveName]["visible"] = vis;
            json[curveName]["index"] = i;
            if (i == index) {
                if (vis == "true")
                    json[curveName]["visible"] = "legendonly";
                else
                    json[curveName]["visible"] = "true";
                
            }
        }
        // console.log(json);
        data.data[0]["fill"] = "tonexty";

        // max visibility:
        // if every other thing is not visible, make max's fill "none"
        if ((json["+σ"].visible == "legendonly") && (json["mean"].visible == "legendonly") && (json["-σ"].visible == "legendonly") && (json["min"].visible == "legendonly"))
            data.data[json["max"].index].fill = "none";
        else // otherwise, default
            data.data[json["max"].index].fill = "tonexty";
        
        // +std's visibility
        // if everything below "+σ" is invisible, turn off fill as well
        if ((json["mean"].visible == "legendonly") && (json["-σ"].visible == "legendonly") && (json["min"].visible == "legendonly"))
            data.data[json["+σ"].index].fill = "none";
        else // otherwise, default
            data.data[json["+σ"].index].fill = "tonexty";

        // mean visibility:
        // if -std not visible but min is, change mean's fill color to extremesColor
        if ((json["-σ"].visible == "legendonly") && (json["min"].visible == "true")){
            data.data[json["mean"].index].fillcolor = extremesColor + "80";
            data.data[json["mean"].index].fill = "tonexty";
        }
        // if -std is visible, change mean's fill color to stdDevColor
        else if (json["-σ"].visible == "true"){
            data.data[json["mean"].index].fillcolor = stdDevColor + "80";
            data.data[json["mean"].index].fill = "tonexty";
        }
        // if they're both invisible, make mean's fill "none"
        else if ((json["-σ"].visible == "legendonly") && (json["min"].visible == "legendonly"))
            data.data[json["mean"].index].fill = "none";
        
        // console.log(data.data[json["mean"].index].fillColor);

        // -std's visibility
        // if min not visible, fill = none. else, fill = tonexty
        if (json["min"].visible != "true")
            data.data[json["-σ"].index].fill = "none";
        else
            data.data[json["-σ"].index].fill = "tonexty";

        // min doesn't have any of this
        data.data[json["min"].index].fill = "none";
    }


    var config = {responsive: true};
    var graphMargin = {
        l: 100,
        r: 100,
        b: 50,
        t: 50,
        pad: 4,
    }

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
                title: `Full Hydrograph for ${Hylak_id}`,
                xaxis: {
                    tickformat: '%b-%d-%Y',
                    // tick0: '2001-01-01',
                    tickangle: 15,
                    dtick: "M12",
                },
            };
            Plotly.newPlot('graph-full-plot', processGraphData(data['data']), layout, config);
            $("#full-loader").hide();
            var myPlot = document.getElementById('graph-full-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data, 'graph-full-plot')
                return false
            });
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
                title: `Yearly Hydrograph for ${Hylak_id}`,
            };
            Plotly.newPlot('graph-yearly-plot', processGraphData(data['data']), layout, config);
            $("#yearly-loader").hide();
            var myPlot = document.getElementById('graph-yearly-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data, 'graph-yearly-plot')
            });
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
                title: `Monthly Hydrograph for ${Hylak_id}`,
                xaxis: {
                    tickformat: '%b'
                },
            };
            Plotly.newPlot('graph-monthly-plot', processGraphData(data['data']), layout, config);
            $("#monthly-loader").hide();
            var myPlot = document.getElementById('graph-monthly-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data, 'graph-monthly-plot')
            });
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
                title: `Daily Hydrograph for ${Hylak_id}`,
                xaxis: {
                    tickformat: '%b-%d'
                }
            };
            // console.log(processGraphData(data['data']));
            Plotly.newPlot('graph-daily-plot', processGraphData(data['data']), layout, config);
            $("#daily-loader").hide();
            var myPlot = document.getElementById('graph-daily-plot');
            myPlot.on('plotly_legendclick', function(data) {
                legendClick(data, 'graph-daily-plot')
            });
        }
    });

    // console.log(retstr);

    // var trace1 = {
    //     x: [1, 2, 3, 4],
    //     y: [10, 15, 13, 17],
    //     mode: 'markers',
    //     type: 'scatter'
    // };
    
    // var trace2 = {
    //     x: [2, 3, 4, 5],
    //     y: [16, 5, 11, 9],
    //     mode: 'lines',
    //     type: 'scatter'
    // };
    
    // var trace3 = {
    //     x: [1, 2, 3, 4],
    //     y: [12, 9, 15, 12],
    //     mode: 'lines+markers',
    //     type: 'scatter'
    // };
      
    // var data = [trace1, trace2, trace3];
    // Plotly.newPlot('examplePlot', data);
    // Plotly.newPlot('myDiv', data);

    // simple functionality for the download buttons
    document.getElementById("download-pdf-btn").addEventListener('click', function() {
        document.getElementById("pdf-btn-text").innerText = " Loading..."
        pdfON = 1;
        setTimeout(function() {
            if (loading == loaded) {
                map2Update();
            }
        }, 100);
    });
    document.getElementById("download-csv-btn").addEventListener('click', downloadCSV);
})