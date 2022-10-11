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

    // necessary for POST requests, or so i'm told
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

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
                headers: {'X-CSRFToken': csrftoken},
                data: {
                    'hylak_id': Hylak_id,
                    'map_blob': url,
                },
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
                    console.log("Failure...");
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
        if (tabId == "graph-normal" || tabId == "graph-yearly" || tabId == "graph-monthly" || tabId == "graph-daily" || tabId == "location")
          window.dispatchEvent(new Event('resize'));
        
    }
    

    // simple download csv function
    // mostly just asks the server for the file,
    // takes it, and forces the browser to download it
    function downloadCSV() {
        document.getElementById("csv-btn-text").innerText = " Loading..."
			$.ajax({
				url:'/apps/ol-test/download_station_csv/',
				method: 'POST',
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
				}
			})
    }

    // makes the tab buttons work
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    $(tablinks[0]).trigger('click'); // ensures one is selected by default
    graphHeight = document.querySelector("#location-content").clientHeight - 100; // the graphs are funky, they need a definite height to load in

    // graph loading setup
    let url = "/apps/ol-test/hydrographs/ajax/";
    let total_data = {
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "total",
    }
    let yearly_data = {
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "yearly",
    }
    let monthly_data = {
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "monthly",
    }
    let daily_data = {
        "hylak_id": Hylak_id,
        "height": graphHeight,
        "timespan": "daily",
    }
    // graph loading payoff (all of these load the graphs serially in each of their tabs)
    $('#graph-normal-plot').load(url, total_data, function() {
        $("#normal-loader").hide();
    });
    $('#graph-yearly-plot').load(url, yearly_data, function() {
        $("#yearly-loader").hide();
    });
    $('#graph-monthly-plot').load(url, monthly_data, function() {
        $("#monthly-loader").hide();
    });
    $('#graph-daily-plot').load(url, daily_data, function() {
        $("#daily-loader").hide();
    });

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