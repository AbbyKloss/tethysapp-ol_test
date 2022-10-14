$(function() {
  // setting up sources before the base layer
  // all except OSM used in app.selectControl
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
  })

  var stamen_watercolor_source = new ol.source.XYZ({
    attributions: [new ol.Attribution({
      html: `Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.
            Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.`
    })],
    url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    crossOrigin: 'anonymous',
    maxZoom:19
  })

  // function getCookie(name) {
  //   let cookieValue = null;
  //   if (document.cookie && document.cookie !== '') {
  //       const cookies = document.cookie.split(';');
  //       for (let i = 0; i < cookies.length; i++) {
  //           const cookie = cookies[i].trim();
  //           // Does this cookie string begin with the name we want?
  //           if (cookie.substring(0, name.length + 1) === (name + '=')) {
  //               cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
  //               break;
  //           }
  //       }
  //   }
  //   return cookieValue;
  // }
  // const csrftoken = getCookie('csrftoken');
  const xcsrftoken = document.getElementsByName("csrfmiddlewaretoken")[0].value
  // console.log(document.cookie)
  // console.log(csrftoken);
  console.log(xcsrftoken);

  // input mechanisms at the bottom of the screen, from right to left
  var eslider = document.getElementById("exponential_slider");
  var number = document.getElementById('numberInput');
  var lslider = document.getElementById("linear_slider");

  // function for vecSource's features
  function dynamicStyle(feat) {
    let area = feat.get('Lake_area');
    let type = feat.get('Lake_type');
    let size = feat.get('Vol_total');
    let value = number.value;
    let col = '#5118ad';
    let img = undefined;
    let radius = 5;

    // Color definition
    if ((area != null) && (area < value)) col = '#b01944';
    else if ((area != null) && (area >= value)) col = '#73e69f';

    // Size definition
    if (size != null) {
      radius = radius - (Math.log2(7.7) / 3) + (Math.log2(parseFloat(size) / 3));
      if (radius > 10)
        radius = 10;
    } else radius = 7.5;

    // Shape definition
    if (type == 1) {
      img = new ol.style.Circle({
        stroke: new ol.style.Stroke({
          color: '#000'
        }),
        fill: new ol.style.Fill({
          color: col
        }),
        radius: radius,
      });
    } else {
      img = new ol.style.RegularShape({
        stroke: new ol.style.Stroke({
          color: '#000'
        }),
        fill: new ol.style.Fill({
          color: col
        }),
        radius: radius,
        points: type + 1,
        rotation: ((type % 2) * (Math.PI / 4)) // if odd, rotate 45 degrees
      });
    }

    return new ol.style.Style({
      image: img,
      text: new ol.style.Text({
        offsetY: 10,
        text: feat.getProperties()['Hylak_id'].toString(),
        stroke: new ol.style.Stroke({
          color: '#000',
          width: 3,
        }),
        fill: new ol.style.Fill({
          color: '#fff'
        }),
      }),
    })
  }

  // centered on my screen's fit for all the features
  var mainView = new ol.View({
    center: [2200770, 500000],
    zoom: 3
  })

  // base layer declaration
  var baseLayer = new ol.layer.Tile({
    source: OSM,
  });

  // vector layer declaration, maxRes low because it'll have too many features soon
  var vector = new ol.layer.Vector({
    source: null,
    maxResolution: 1225,
    style: dynamicStyle,
  });

  var styleCache = {};
  var clusterVector = new ol.layer.Vector({
    minResolution: 1225,
    wrapX: false,
    style: function(feature) {
      var size = feature.get('features').length;
      var style = styleCache[size];
      if (!style) {
        style = new ol.style.Style({
          image: new ol.style.Circle({
            radius: 9.99+(size/100),
            stroke: new ol.style.Stroke({
              color: '#fff'
            }),
            fill: new ol.style.Fill({
              color: '#3399CC'
            })
          }),
          text: new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: '#fff'
            })
          })
        });
        styleCache[size] = style;
      }
      return style;
    }
  })
  
  window.app = {};
  var app = window.app;

  // we're making a control from scratch
  // switches the background map
  app.selectControl = function(opt_options) {
    var options = opt_options || {};

    var selector = document.createElement('select');
    // selector.setAttribute("id", "select-bg");
    // format: [[value, Name], [value, Name], ... ]
    const mapValue = [
      ["osm", "OpenStreetMap"],
      ["esri_source", "ESRI"],
      ["esri_terr", "ESRI Terrain"],
      ["usgs_imagery", "USGS Imagery"],
      ["usgs_imagery_labels", "USGS Imagery (Labels)"],
      ["esri_world", "ESRI World"],
      ["stamen_toner", "Stamen Toner"],
      ["stamen_watercolor", "Stamen Watercolor"],
    ];
    
    // iteratively adding options to the selector
    // easier to scale and do than putting them all in one by one
    for (let i = 0; i < mapValue.length; i++) {
      var opt = document.createElement("option");
      opt.setAttribute("value", mapValue[i][0]);
      var tex = document.createTextNode(mapValue[i][1]);
      opt.appendChild(tex);
      selector.appendChild(opt);
    }

    // switch statement based on the value of selector
    // the function that actually changes the source
    var changeMapSource = function() {
      switch(selector.value) {
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
    }

    selector.addEventListener('change', changeMapSource, false);
    var container = document.createElement('div');
    container.className = 'select-bg ol-unselectable ol-control';
    container.setAttribute('id', 'background-select');
    container.append(selector);
    container.append(document.createElement("br"));

    ol.control.Control.call(this, {
      element: container,
      target: options.target
    });
  };
  ol.inherits(app.selectControl, ol.control.Control);

  // a legend so you can tell what all the shapes and colors mean
  app.legend = function(opt_options) {
    var options = opt_options || {};

    var container = document.createElement("div");
    container.className = "ol-legend ol-unselectable ol-control";
    // overly complicated, but more flexible if i need to add things later
    let svg1 = `<svg width="25" height="25">
                    <circle cx="50%" cy="75%" r="5" fill="#73e69f" stroke="black"/>
                  </svg><span>- Lake Area ≥ </span><span class="slider-text">Slider</span><br>`;
    let svg2 = `<svg width="25" height="25">
                  <circle cx="50%" cy="75%" r="5" fill="#b01944" stroke="black"/>
                </svg><span>- Lake Area < </span><span class="slider-text">Slider</span><br>`;
    let svg3 = `<svg width="25" height="25">
                  <circle cx="50%" cy="75%" r="5" fill="#5118ad" stroke="black"/>
                </svg><span>- Lake Area = null</span><br>`;
    let svg4 = `<svg width="25" height="25">
                  <circle cx="50%" cy="75%" r="5" fill="#73e69f" stroke="black"/>
                </svg><span>- Lake Type = 1</span><br>`;
    let svg5 = `<svg width="25" height="25">
                  <polygon points="6,24 12.5,11, 20,24" fill="#73e69f" stroke="black"/>
                </svg><span>- Lake Type = 2</span><br>`;
    let svg6 = `<svg width="25" height="25">
                  <rect x="30%" y="50%" rx="2" width="10" height="10" fill="#73e69f" stroke="black"/>
                </svg><span>- Lake Type = 3</span><br>`;
    const svgList = [svg1, svg2, svg3, svg4, svg5, svg6];
    for (let i = 0; i < svgList.length; i++) {
      let SVGHolder = document.createElement("svg");
      SVGHolder.innerHTML = svgList[i];

      container.append(SVGHolder);
    }

    ol.control.Control.call(this, {
      element: container,
      target: options.target
    });
  };
  ol.inherits(app.legend, ol.control.Control);

  function controlPadding(coords) {
    return ol.coordinate.format(coords, '<div id="mouse-position-text">Lat:&nbsp;&nbsp;{y}<br>Lon:&nbsp;{x}</div>', 4);
  }

  // classic map declaration
  // with a control twist
  var map = new ol.Map({
    layers: [baseLayer, vector, clusterVector],
    target: 'map',
    view: mainView,
    controls: ol.control.defaults().extend([
      new app.selectControl(),
      new ol.control.ScaleLine(),
      new ol.control.MousePosition({
        projection: "EPSG:4326",
        coordinateFormat: controlPadding,
      }),
      new app.legend(),
    ]),
    
  });

  // setup for map screenshot for pdf
  // instantiating a second map offscreen to take screenshots from
  var glob_hylak_id = 1; 

  var vecSource2 = new ol.source.Vector();

  var vector2 = new ol.layer.Vector({
    source: vecSource2,
    style: dynamicStyle,
  });

  var map2 = new ol.Map({
    layers: [baseLayer, vector2],
    target: 'map2',
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 8.4
    }),
  });
  


  /** Returns the exponential slider's value as an exponent of its current step 
   * @param {number} num any number, float, int
   * @returns number
  */
  function realSliderVal(num=eslider.value) {
    return Math.round((10 - 1 + (1*124.5**(num/14))) * 100) / 100
  }

  /** Converts a numerical value to a step on the exponential slider
   * @param {number} num any number, float, int
   * @returns number
  */
  function numValtoSliderVal(num=number.value) {
    return 14 * (Math.log10(num-9) / Math.log10(124.5))
  }

  // initializing input values
  eslider.value = numValtoSliderVal(167.49);
  eslider.min = 0;
  eslider.max = 38;

  number.value = realSliderVal();
  lslider.value = number.value;
  var searchNumber = document.getElementById("search-number");

  var vecSource;
  var clstSource;

  // loading the geojson to the vector layer source features
  // updating many things based on that information, such as the reset view button and the lake area sliders
  $.getJSON( "load_GJSON", function(gjsn) {
    // console.log(gjsn);
    let col = '#5118ad';
    // vector layer declaration, for drawing and displaying points
    vecSource = new ol.source.Vector({
      wrapX: false,
      features: new ol.format.GeoJSON().readFeatures(gjsn, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      }),
    });

    clstSource = new ol.source.Cluster({
      projection: 'EPSG:3857',
      source: vecSource,
      wrapX: false,
    });
    

    var minarea = 0;
    var maxarea = 0;
    let minID = 0;
    let maxID = 0;

    // get the min/max areas and IDs
    // areas for the slider, IDs for the search function
    // this function is very intensive and very bad for anything more than this, i've learned
    vecSource.forEachFeature(function(e) {
      let id = e.getId();
      var area = e.get('Lake_area');

      if (minarea === 0){
        minarea = area;
        maxarea = area;
      }
      else if ((area != null) && (area < minarea)) {
        minarea = area;
      }
      else if ((area != null) && (area > maxarea)) {
        maxarea = area;
      }

      if (minID === 0){
        minID = id;
        maxID = id;
      }
      else if ((id != null) && (id < minID)) {
        minID = id;
      }
      else if ((id != null) && (id > maxID)) {
        maxID = id;
      }
    })
    
    // initialize all the things that need this data (many things)
    maxarea = Math.ceil(maxarea);
    minarea = Math.floor(minarea);
    searchNumber.min = minID;
    searchNumber.max = maxID;
    searchNumber.value = minID;

    number.step = 1;
    number.min = minarea;
    number.max = maxarea;
    number.value = realSliderVal();
    lslider.step = number.step;
    lslider.min = number.min;
    lslider.max = number.max;
    lslider.value = number.value;

    // update the sources with their features
    vector.setSource(vecSource);
    clusterVector.setSource(clstSource);
    let extent = vecSource.getExtent();
    mainView.fit(extent);
    map.addControl(new ol.control.ZoomToExtent({"extent": extent, "label": "R"}));
  });

  const sliderText = [...document.getElementsByClassName('slider-text')];
  sliderText.forEach(element => element.innerText = realSliderVal().toString());

  // many many event listeners to update everything that needs to be
  eslider.addEventListener('input', function() {
    number.value = realSliderVal();
    lslider.value = number.value;
    sliderText.forEach(element => element.innerText = number.value.toString());
    vector.changed();
  });

  number.addEventListener('input', function() {
    eslider.value = numValtoSliderVal();
    lslider.value = number.value;
    sliderText.forEach(element => element.innerText = number.value.toString());
    vector.changed();
  });

  lslider.addEventListener('input', function() {
    number.value = lslider.value;
    eslider.value = numValtoSliderVal();
    sliderText.forEach(element => element.innerText = number.value.toString());
    vector.changed();
  });

  // select and translate interactions,
  // for selecting and moving all the features
  var select = new ol.interaction.Select({
    condition: ol.events.condition.click,
    toggleCondition: ol.events.condition.never
  });

  var trans = new ol.interaction.Translate({
    features: select.getFeatures(),
    // layer: vector,
  })

  var dragbox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly
  })
  
  map.addInteraction(select);
  map.addInteraction(trans);
  map.addInteraction(dragbox);

  // download pdf functionality
  // relatively simple here, screenshots the offscreen map,
  // sends it to the server, asks for a pdf,
  // displays it in a new tab
  function downloadPDF() {
    map2.once('postcompose', function(e) {
      var canvas = e.context.canvas;
      let url = canvas.toDataURL().replace("data:image/png;base64,", "");
      
      // document.getElementById("pdf-btn-text").innerText = " Loading..."
      $.ajax({
          url:'/apps/ol-test/pdf/ajax/',
          method: 'POST',
          // headers: {"X-CSRFToken": csrftoken},
          // headers: {"X-CSRFToken": xcsrftoken},
          beforeSend: function (xhr) {
              xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
          },
          data: {
              'hylak_id': glob_hylak_id,
              'map_blob': url,
          },
          success: function (data) {
            let btntext = document.getElementById("pdf-btn-text");
            if (btntext != null)
              btntext.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span><span id="csv-btn-text" > Done!</span>'
            
            const blob = new Blob(data.split(""), {type: 'application/pdf'});
            const burl = URL.createObjectURL(blob);
            
            window.open(burl, '_blank');
            setTimeout( function() {
              if (btntext != null)
                btntext.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span><span id="csv-btn-text" > Save .pdf</span>'
            }, 1500);
          },
          error: function() {
              console.log("Failure...");
          }
      });
    });
    map2.renderSync();
}

  // map screenshot setup
  var loaded = 0;
  var loading = 0;
  var pdfON = 0;

  // checks if everything's loaded properly
  // if it is, and the download pdf button was pressed,
  // downloads the pdf
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
  
  // these functions check if things are loading and if everything that's loading has loaded
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

  // implementing all the above functions
  // .on() -> map2AddLoading/Loaded() -> map2Update() -> downloadPDF()
  // what a tangled web i weave
  let map2Layer = map2.getLayers().item(0)
  map2Layer.getSource().on("tileloadstart", function() {
    map2AddLoading();
  })
  map2Layer.getSource().on(["tileloadend", "tileloaderror"], function() {
    map2AddLoaded();
  })
  
  // bookkeeping for popups
  var PU = true;
  var enable_button = document.getElementById("popup-enable");
  
  // Create new Overlay with the #popup element
  var popup = new ol.Overlay({
    element: document.getElementById('popup')
  });
  
  map.addOverlay(popup);
  // console.log(popup.getElement());
  
  // Functionality for the Enable/Disable Popups button under the Graph menu
  enable_button.addEventListener('click', function() {
    let text = document.getElementById("enable-text");
    if (PU) {
      // a small amount of code to hide all popups and prevent more from appearing
      text.innerHTML = "Enable Popups";
      $(popup.getElement()).popover('hide');
    } else {
      // way too much code to show the popup again upon enabling them
      text.innerHTML = "Disable Popups";
      var url = '';
      var data = {};
      var element = select.getFeatures();
      var len = element.getArray().length;
      if (len == 1) {
        let hylak_id = element.item(0).getProperties()['Hylak_id'];
        url = "/apps/ol-test/hydrographs/" + hylak_id + "/300px/ajax";
        data = {
          "hylak_id": hylak_id,
          "height": 390,
          "width": "100%",
          "timespan": "total",
        };
      }
      $(popup.getElement()).popover('show');
      if (len == 1)
        $('#plot-content').load(url, data);
      setTimeout( function() {
        window.dispatchEvent(new Event('resize'));
      }, 500);
    }
    
    PU = !PU;
  })

  function selectOne(e, feat=null, IDList=[]) {
    var selected_feature = null; // setup
    trans.setActive(false);


    let editable = true;
    // if a feature is passed, use that
    // generally multiple things are selected in this case
    // i.e. a cluster, the dragbox
    if (feat) {
      selected_feature = feat;
      editable = false;
    } else
      selected_feature = e.selected[0];

    // if either nothing or a cluster holding more than one point is selected
    if ((selected_feature == undefined)){
      return null;
    } else if ((selected_feature.getProperties()['features']) && (selected_feature.getProperties()['features'].length > 1)) {
      return selectMany(e);
    }
    // if a cluster with one point is selected, just select its contained feature
    if (selected_feature.getId() == undefined)
      selected_feature = selected_feature.getProperties()['features'][0];

    // get location for popup
    var coordinates = selected_feature.getGeometry().getCoordinates();

    // unholy amounts of setup for all the things edited here
    // setup for the graph button display
    var graph_button = document.getElementById("graph-num");
    var graph_header = document.getElementById("graph-modal-label");
    var graph_body = document.getElementById("graph-modal-body");
    graph_button.innerHTML = " (1)";
    
    // popup setup
    var popup_element = popup.getElement();
    let hylak_id = selected_feature.getProperties()['Hylak_id'];
    let area = selected_feature.get('Lake_area')
    let popup_content = '';

    // popup button initialization (setup)
    // adds 3 buttons and two selectors
    // buttons:
    //  "Save .pdf", "View Details", "Edit Point"
    // selectors:
    //  ID Selector, Zoom Level Selector
    // all of these require so much boilerplate when setting up with javascript,
    // the main takeaway is:
    //  edit point hides the point so you can move it
    //  view details opens the details page for that point
    //  save .pdf saves the pdf of that point based on the zoom level slider and the current layer view
    //  the id selector changes what point is selected based on the id list passed (either just that one point's ID or a whole host of them, depending on how it was selected)
    //  zoom level slider changes the zoom level of the offscreen map for pdf downloads
    const editButton = document.createElement("button");
    const detailsButton = document.createElement("button");
    editButton.innerText = "Edit Point";
    detailsButton.innerText = "View Details"
    editButton.classList.add("btn", "btn-primary", "custom-close", "popup-button");
    editButton.style.marginLeft = "10px";
    editButton.addEventListener('click', function() {
      trans.setActive(true);
      $(popup.getElement()).popover('destroy');
    });
    detailsButton.classList.add("btn", "btn-primary", "custom-details", "popup-button")
    detailsButton.style.marginLeft = "10px";

    const PDFButton = document.createElement("button");
    PDFButton.setAttribute("id", "pdf-btn-text");
    PDFButton.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span><span id="csv-btn-text" > Save .pdf</span>'
    PDFButton.classList.add("btn", "btn-primary", "custom-details", "popup-button")
    detailsButton.addEventListener('click', function() {
      location.href = "/apps/ol-test/details/" + hylak_id + "/";
    });

    // initializing the selectors
    var selector = document.createElement('select');
    selector.classList.add("popup-selector");
    var zoomSel = document.createElement('select');
    zoomSel.classList.add("popup-selector");

    const zoomList = [["Closest", 13], ["Close", 12], ["Midrange", 10], ["Far", 8.4], ["Farthest", 7]]
    
    // selector if feature was picked from a selector
    if (IDList.length > 0) {
      // putting the values in the selector
      for (let i = 0; i < IDList.length; i++) {
        var opt = document.createElement("option");
        opt.setAttribute("value", IDList[i]);
        var tex = document.createTextNode(IDList[i]);
        opt.appendChild(tex);
        selector.appendChild(opt);
        if (IDList[i] == hylak_id)
          selector.selectedIndex = i;
      }
      selector.addEventListener('change', function() {
        selectFeatDD(selector.value, IDList);
      });
    } else {
      var opt = document.createElement("option");
        opt.setAttribute("value", hylak_id);
        var tex = document.createTextNode(hylak_id);
        opt.appendChild(tex);
        selector.appendChild(opt);
    }

    for (let i = 0; i < zoomList.length; i++) {
      var opt = document.createElement("option");
      opt.setAttribute("value", zoomList[i][1]);
      var tex = document.createTextNode(zoomList[i][0]);
      opt.appendChild(tex);
      zoomSel.appendChild(opt);
    }
    zoomSel.selectedIndex = Math.ceil(zoomList.length / 2) - 1;

    // console.log(selector.outerHTML);
    // console.log(selector.innerHTML);


    // Save PDF Button on Popover
    PDFButton.addEventListener('click', function() {
      PDFButton.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span><span id="csv-btn-text" > Loading...</span>'
      map2.getView().setCenter(coordinates);
      // let zoom = map.getView().getZoom(); // value of zoom selector
      map2.getView().setZoom(zoomSel.value); // set it as zoom
      vecSource2.clear();
      vecSource2.addFeature(selected_feature);
      glob_hylak_id = hylak_id;
      pdfON = 1;
      setTimeout(function() {
        if ((loading == loaded) && (pdfON)) {
          map2Update();
        }
      }, 100);
    })
    $("#graph-modal-details").on('click', function() {
      location.href = "/apps/ol-test/details/" + hylak_id + "/";
    })

    /****** end of button setup (kind of, actually putting them in the popup is later) ******/

    // display the ID and the area, if it exists, in the popup header
    // console.log(area);
    // console.log(typeof area)
    // if (area != null) {
    //   popup_header = `ID: ${hylak_id} | Area: ${area}`;
    //   graph_header.innerHTML = `ID: ${hylak_id} | Area: ${area}`;
    // }
    // else {
    //   popup_header = `ID: ${hylak_id}`;
    //   graph_header.innerHTML = `ID: ${hylak_id}`;
    // }

      
    // placeholder text to show that the popup isn't broken, just taking a sec, followed by the graphs
    popup_content += '<div class="popup-loader">Loading...</div><div id="plot-content"></div>';
    graph_body.innerHTML = '<div class="graph-loader">Loading...</div><div id="graph-plot-content"></div>';

    let template = `<div class="popover" role="tooltip">
                      <div class="arrow"></div>
                      <h3 class="popover-title"></h3>
                      <div class="popover-content"></div>
                      <h3 class="popover-footer"></h3>
                    </div>`

    // console.log(template);

    // Clean up last popup and reinitialize
    $(popup_element).popover('destroy');

    // URLs to let the graphs load
    let url = "/apps/ol-test/hydrographs/ajax/";

    // show the popup with all its data
    setTimeout(function() {
      popup.setPosition(coordinates);
      
      $(popup_element).popover({
        'placement': 'auto top',
        'animation': true,
        'html': true,
        'title': " ",
        'content': popup_content,
        'template': template
      });
      
      // making the popup appear and show data
      if (PU) $(popup_element).popover('show');
      let popup_data = {
        "hylak_id": hylak_id,
        "height": 390,
        "timespan": "total",
      }
      let graph_data = {
        "hylak_id": hylak_id,
        "height": Math.floor(window.innerHeight * .8),
        "timespan": "total",
      }

      $(".graph-loader").show();
      $(".popup-loader").show();
      $('#plot-content').load(url, popup_data, function() {
        $(".popup-loader").hide();
      });
      $('#graph-plot-content').load(url, graph_data, function() {
        $(".graph-loader").hide();
      });

      setTimeout( function() {
        window.dispatchEvent(new Event('resize'));
      }, 500);


      // putting the buttons and selectors in the popover
      // also changing the popover title to include all the data it needs, including selector
      const hed = document.getElementsByClassName("popover-title")[0];
      let span1 = document.createElement("span");
      let span2 = document.createElement("span");
      span1.innerText = "ID: ";
      hed.append(span1);
      hed.append(selector);
      if (area != null) {
        span2.innerText = ` | Area: ${area}`;
        hed.append(span2);
      }

      // adding the buttons to the popup footer
      const fut = document.getElementsByClassName("popover-footer")[0];
      if (editable) fut.append(editButton);
      fut.append(detailsButton);
      fut.append(PDFButton);

      let span3 = document.createElement("span");
      span3.innerText = "PDF Zoom Level: ";
      fut.append(span3)
      fut.append(zoomSel);
    }, 250); 
  }

  // originally just used to select a feature from the dropdowns
  // now it's used after selecting multiple features
  function selectFeatDD(feat_id, IDList) {
    feat = vecSource.getFeatureById(feat_id);
    select.getFeatures().clear();
    select.getFeatures().push(feat);
    selectOne(null, feat, IDList);
  } 

  // selects the feature with the lowest ID from many selected features
  // whether that be from the boxselect or selecting a cluster
  function selectMany(e, arr=[]) {
    // setup for a good many things
    var curFeat = null; // popup information
    var popup_element = popup.getElement();
    
    // if a feature array was passed, use that, otherwise use the event
    if (arr.length == 0) 
      curFeat = e.selected[0].getProperties()['features'];
    else
      curFeat = arr;

    const IDList = [];

    // display no more than 9 IDs
    for (let i = 0; i < curFeat.length; i++) {
      hylakID = curFeat[i].getProperties()['Hylak_id'];
      IDList.push(Number(hylakID));
    }
    IDList.sort(function(a, b) {return (a-b)});

    // Clean up last popup and reinitialize
    $(popup_element).popover('destroy');
    selectFeatDD(IDList[0], IDList);
  }

  // when removing anything from the selection, just remove everything
  function cleanse() {
    select.getFeatures().clear();
    $(popup.getElement()).popover('destroy');
    $("#graph-modal-details").off();

    document.getElementById("graph-modal-label").innerHTML = 'ID: null';
    document.getElementById("graph-modal-body").innerHTML = 'Select a point to get data.';
    document.getElementById("graph-num").innerHTML = " (0)";
  }

  // if you select one element, trigger selectOne()
  // (which can trigger selectMany() which can trigger selectOne() (my code is a mess sometimes))
  //   at least it can't trigger selectMany() after that second selectOne() call
  // if you select nothing, get rid of all elements
  select.on('select', function(e) {
    if (e.selected.length > 0 )
      selectOne(e);
    else 
      cleanse();
  })

  // if you select elements with the box selector, it adds them all to a list and passes that list
  // to either selectOne() or selectMany(), depending on how many elements were selected
  dragbox.on('boxend', function(e) {
    // features that intersect the box are added to an array for processing
    var extent = dragbox.getGeometry().getExtent();
    var curArr = [];
    vecSource.forEachFeatureIntersectingExtent(extent, function(feature) {
      curArr.push(feature);
    });
    // if the array is not empty
    if (curArr.length > 0) {
      // select it
      select.getFeatures().extend(curArr);
      // then either select one or many
      if (curArr.length == 1)
        selectOne(e, curArr[0]);
      else
        selectMany(e, curArr);
    }
  });

  // clear selection when drawing a new box and when clicking on the map
  dragbox.on('boxstart', function() {
    cleanse();
  });


  // called whenever a point is done being moved
  // saves Hylak_id and new coordinates to arrays
  // updates coordinates if Hylak_id is already in the ID array
  var changed_points = 0;
  trans.on("translateend", function(e) {
    // console.log(select.getFeatures().item(0));
    // console.log(e.features.item(0));
    let selected_feature = e.features.item(0);
    let clust = false;
    if (selected_feature.getId() == undefined) {
      selected_feature = selected_feature.getProperties()['features'][0];
      clust = true;
    }
    changed_points++;
    let featID = selected_feature.getProperties()['Hylak_id'];
    let coords = ol.proj.toLonLat(e.coordinate);
    document.getElementById("save-num").innerHTML = " (" + changed_points + ")";
    if (clust)
      vecSource.getFeatureById(featID).getGeometry().setCoordinates(ol.proj.fromLonLat(coords));

    // putting the changed point into a json
    var data = {
      "Hylak_id": featID,
      "coordLon": coords[0],
      "coordLat": coords[1]
      };
    
    console.log(data);
    
    $.ajax({
      url: '/apps/ol-test/update_feats/',
      method: "POST",
      // headers: {"X-CSRFToken": csrftoken},
      // headers: {"X-CSRFToken": xcsrftoken},
      beforeSend: function (xhr) {
          xhr.setRequestHeader("X-CSRFToken", xcsrftoken)
      },
      data: data,
    })
    cleanse();
  });

  // forces a resize event when the graph modal shows up
  // that way it isn't a square graph taking up the left half of the modal
  // but instead it takes up the full modal width
  $("#graph-modal").on('shown.bs.modal', function() {
    setTimeout( function() {
      window.dispatchEvent(new Event('resize'));
    });
  });

  var searchButton = document.getElementById("search-button");

  // when the search modal is hidden, reset it
  $("#search-modal").on('hidden.bs.modal', function() {
    document.getElementById("search-header").innerText = "Search for Station by ID";
    searchButton.classList.remove("btn-danger");
    searchButton.classList.add("btn-primary");
  });

  // functionality for the "Search by ID" feature
  searchButton.addEventListener('click', function() {
    srch_feat = vecSource.getFeatureById(searchNumber.value);
    // if the searched feature doesn't exist, let the user know to try again
    if (srch_feat == null) {
      document.getElementById("search-header").innerText = "Please Try Again";
      searchButton.classList.add("btn-danger");
      searchButton.classList.remove("btn-primary");
      return;
    }
    // if it does, pan to it and select it
    mainView.animate({
      center: srch_feat.getGeometry().getCoordinates(),
      duration: 1000,
      zoom: 8,
    });
    $(popup.getElement()).popover('destroy');
    setTimeout( function() {
      select.getFeatures().clear();
      select.getFeatures().push(srch_feat);
      selectOne(null, srch_feat);
    }, 1500);
    $('#search-modal').modal('hide');
  });

  searchNumber.addEventListener('keyup', function(e) {
    if ((e.code == "Enter") || (e.code == "NumpadEnter"))
      $(searchButton).trigger('click');
  })

  // commented out because i use this a lot for debugging
  // whenever the map view is changed, show the zoom level
  // mainView.on('change', function() {
  //   console.log(mainView.getZoom());
  // })

});