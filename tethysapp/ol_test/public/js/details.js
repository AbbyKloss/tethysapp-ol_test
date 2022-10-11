$(function() {
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
    console.log(latitude);
    console.log(longitude);
    const coords = [longitude, latitude];

    var osm = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    var vecSource = new ol.source.Vector({
        features: [new ol.Feature({
            'geometry': new ol.geom.Point(ol.proj.fromLonLat(coords)),
            }), ],
    });
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
        layers: [osm, vector],
        target: 'map',
        view: new ol.View({
            center: ol.proj.fromLonLat(coords),
            zoom: 8.4
        }),

        // view: new ol.View({
        //     // center: ol.proj.fromLonLat([longitude, latitude]),
        //     center: [0, 0],
        //     zoom: 11
        // }),
    });

    // console.log(document.getElementById("map"));
    // map.once('postcompose', function(e) {
    //     console.log(e);
    // });

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

    function downloadPDF() {
        map.once('postcompose', function(e) {
            var canvas = e.context.canvas;
            let url = canvas.toDataURL().replace("data:image/png;base64,", "");
            
            document.getElementById("pdf-btn-text").innerText = " Loading..."
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

    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener('click', openTab);
    }
    $(tablinks[0]).trigger('click');
    graphHeight = document.querySelector("#location-content").clientHeight - 100;

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
    let pdf_data = {
        "hylak_id": Hylak_id,
    }
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

    document.getElementById("download-pdf-btn").addEventListener('click', downloadPDF);
    document.getElementById("download-csv-btn").addEventListener('click', downloadCSV);
})