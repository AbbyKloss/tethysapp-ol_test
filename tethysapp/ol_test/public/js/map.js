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

  // input mechanisms at the bottom of the screen, from right to left
  var eslider = document.getElementById("exponential_slider");
  var number = document.getElementById('numberInput');
  var lslider = document.getElementById("linear_slider");

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


  // function for vecSource's features
  function dynamicStyle(feat) {
    area = feat.get('Lake_area');
    value = number.value;
    col = '#5118ad';
    if ((area != null) && (area < value)) col = '#b01944';
    else if ((area != null) && (area >= value)) col = '#73e69f';
    return new ol.style.Style({
      image: new ol.style.Circle({
        stroke: new ol.style.Stroke({
          color: '#000'
        }),
        fill: new ol.style.Fill({
          color: col
        }),
        radius: 5,
      }),
      text: new ol.style.Text({
        offsetY: 10,
        text: feat.getProperties()['Hylak_id'].toString(),
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
      console.log(selector.value);
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
        default:
          baseLayer.setSource(OSM);
      }
    }

    selector.addEventListener('change', changeMapSource, false);
    var element = document.createElement('div');
    element.className = 'select-bg ol-unselectable ol-control';
    element.setAttribute('id', 'background-select');
    element.append(selector);


    ol.control.Control.call(this, {
      element: element,
      target: options.target
    });
  };
  ol.inherits(app.selectControl, ol.control.Control);

  // var resetView = new ol.control.ZoomToExtent({
  //   // "extent": extent,
  //   "label": "R",  
  // })

  // classic map declaration
  // with a control twist
  var map = new ol.Map({
    layers: [baseLayer, vector, clusterVector],
    target: 'map',
    view: mainView,
    controls: ol.control.defaults().extend([
      new app.selectControl(),
      new ol.control.ScaleLine(),
      // resetView,
    ]),
    
  });

  // console.log(map.getControls());
  // console.log(map.getControls().item(5));
  


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

  // many many event listeners to update everything that needs to be
  eslider.addEventListener('input', function() {
    number.value = realSliderVal();
    lslider.value = number.value;
    vector.changed();
  });

  number.addEventListener('input', function() {
    eslider.value = numValtoSliderVal();
    lslider.value = number.value;
    vector.changed();
  });

  lslider.addEventListener('input', function() {
    number.value = lslider.value;
    eslider.value = numValtoSliderVal();
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
    layer: vector
  })

  var dragbox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly
  })
  
  map.addInteraction(select);
  map.addInteraction(trans);
  map.addInteraction(dragbox);

  function downloadPDF(Hylak_id) {
    map.once('postcompose', function(e) {
        var canvas = e.context.canvas;
        let url = canvas.toDataURL().replace("data:image/png;base64,", "");
        
        // document.getElementById("pdf-btn-text").innerText = " Loading..."
        $.ajax({
            url:'/apps/ol-test/pdf/ajax/',
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            data: {
                'hylak_id': Hylak_id,
                'map_blob': url,
            },
            success: function (data) {
                // document.getElementById("pdf-btn-text").innerText = " Done!"
                
                const blob = new Blob(data.split(""), {type: 'application/pdf'});
                const burl = URL.createObjectURL(blob);
                
                window.open(burl, '_blank');
                // setTimeout( function() {
                //     document.getElementById("pdf-btn-text").innerText = " Save .pdf"
                // }, 1500);
            },
            error: function() {
                console.log("Failure...");
            }
        });
    });
    map.renderSync();
}

  // bookkeeping for moving features
  const changed_ids = [];
  const changed_coords = [];
  
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

  // loading text functionality
  $('.loader').hide();
  $(document).ajaxSend(function() {
    $('.loader').show();
  });
  $(document).ajaxComplete(function() {
    $('.loader').hide();
  });

  function selectOne(e, feat=null, IDList=[]) {
    var selected_feature = null; // setup

    // if a feature is passed, use that
    if (feat)
      selected_feature = feat;
    else
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
    let popup_header = '';
    var popup_element = popup.getElement();
    let hylak_id = selected_feature.getProperties()['Hylak_id'];
    let area = selected_feature.get('Lake_area')
    let popup_content = '';

    // popup button initialization (setup)
    const editButton = document.createElement("button");
    const detailsButton = document.createElement("button");
    editButton.innerText = "Edit Point";
    detailsButton.innerText = "View Details"
    editButton.classList.add("btn", "btn-primary", "custom-close", "popup-button");
    detailsButton.classList.add("btn", "btn-primary", "custom-details", "popup-button")
    detailsButton.style.marginRight = "10px";
    const PDFButton = document.createElement("button");
    PDFButton.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span><span id="csv-btn-text" > Save .pdf</span>'
    PDFButton.classList.add("btn", "btn-primary", "custom-details", "popup-button")
    PDFButton.style.marginRight = "10px";
    detailsButton.addEventListener('click', function() {
      location.href = "/apps/ol-test/details/" + hylak_id + "/";
    });
    var selector = undefined;
    
    // selector if feature was picked from a selector
    if (IDList != []) {
      selector = document.createElement('select');
      selector.classList.add("popup-selector");
      // initializing the selector
      // var opt = document.createElement("option");
      // opt.setAttribute("value", "-1");
      // var tex = document.createTextNode("--");
      // opt.appendChild(tex);
      // selector.appendChild(opt);
  
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
    }

    // Save PDF Button on Popover
    PDFButton.addEventListener('click', function() {
      map.getView().setCenter(coordinates);
      let zoom = map.getView().getZoom();
      map.getView().setZoom(8.4);
      select.getFeatures().clear();
      setTimeout(function() {
        downloadPDF(hylak_id);
        select.getFeatures().push(selected_feature);
        map.getView().setZoom(zoom);
      }, 1000);
    })
    $("#graph-modal-details").on('click', function() {
      location.href = "/apps/ol-test/details/" + hylak_id + "/";
    })

    // display the ID and the area, if it exists, in the popup header
    if (area != null) {
      popup_header = 'ID: ' + hylak_id + " | Area: " + area;
      graph_header.innerHTML = 'ID: ' + hylak_id + " | Area: " + area;
    }
    else {
      popup_header = 'ID: ' + hylak_id;
      graph_header.innerHTML = 'ID: ' + hylak_id;
    }
      
    // placeholder text to show that the popup isn't broken, just taking a sec
    let loader = '<div class="loader">Loading...</div>'
    popup_content += loader + '<div id="plot-content"></div>';
    graph_body.innerHTML = loader + '<div id="graph-plot-content"></div>';

    // Clean up last popup and reinitialize
    $(popup_element).popover('destroy');

    // URLs to let the graphs load
    let url = "/apps/ol-test/hydrographs/ajax/";

    // show the popup with all its data
    setTimeout(function() {
      popup.setPosition(coordinates);
      
      $(popup_element).popover({
        'placement': 'top',
        'animation': true,
        'html': true,
        'title': popup_header,
        'content': popup_content
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
      $('#plot-content').load(url, popup_data);
      $('#graph-plot-content').load(url, graph_data);
      setTimeout( function() {
        window.dispatchEvent(new Event('resize'));
      }, 500);

      // adding the buttons to the popup header
      const bod = document.getElementsByClassName("popover-title")[0];
      bod.append(editButton);
      bod.append(detailsButton);
      bod.append(PDFButton);
      if (selector != undefined)
        bod.append(selector);
      
      function close(e) { // need to have a function to both add and remove it
        if (e.target.classList.contains('custom-close')) {
          $(popup.getElement()).popover('destroy');
          bod.removeEventListener('click', close);
        }
      }
      bod.addEventListener('click', close);
    }, 250); 
  }

  function selectMany(e, arr=[]) {
    // setup for a good many things
    var coordinates = [0,0]; // popup location
    var curFeat = null; // popup information
    let IDstring = "";
    var popup_element = popup.getElement();
    var graph_button = document.getElementById("graph-num"); // header button info
    var graph_header = document.getElementById("graph-modal-label");
    var graph_body = document.getElementById("graph-modal-body");
    
    // if a feature array was passed, use that, otherwise use the event
    if (arr.length == 0) 
      curFeat = e.selected[0].getProperties()['features'];
    else
      curFeat = arr;
    
    // put the popup in the middle of all the features
    var sum = [0, 0];
    for (let i = 0; i < curFeat.length; i++) {
      let coords = curFeat[i].getGeometry().getCoordinates();
      sum[0] += coords[0];
      sum[1] += coords[1];
    }
    coordinates[0] = sum[0] / curFeat.length;
    coordinates[1] = sum[1] / curFeat.length;
    
    // change the display of the graph header button
    if (curFeat.length > 9 )
      graph_button.innerHTML = " (9+)";
    else
      graph_button.innerHTML = " (" + curFeat.length + ")";

    const IDList = [];

    // display no more than 9 IDs
    for (let i = 0; i < curFeat.length; i++) {
      hylakID = curFeat[i].getProperties()['Hylak_id'];
      if (i < 9)
        IDstring += hylakID;
      if ((curFeat.length > 9) && (i == 8))
        IDstring += "...";
      else if ((i < curFeat.length - 1) && (i < 9))
        IDstring += ", ";
      IDList.push(Number(hylakID));
    }
    IDList.sort(function(a, b) {return (a-b)});

    // update headers
    graph_header.innerText = "ID(s): " + IDstring;
    graph_body.innerText = "Only one graph can be shown at a time. Please zoom in and reselect your point or select your point from the popup to display its graph.";
    let popup_title = 'Multiple Selected';
    let popup_content = '<div class="popover-multi-content"></div>'

    // Clean up last popup and reinitialize
    $(popup_element).popover('destroy');
    
    setTimeout(function() {
      popup.setPosition(coordinates);

      $(popup_element).popover({
        'placement': 'top',
        'animation': true,
        'html': true,
        'title': popup_title,
        'content': popup_content
      });

      if (PU) $(popup_element).popover('show');

      const bod = document.getElementsByClassName("popover-multi-content")[0];

      // initializing the selector
      var selector = document.createElement('select');
      var opt = document.createElement("option");
      opt.setAttribute("value", "-1");
      var tex = document.createTextNode("--");
      opt.appendChild(tex);
      selector.appendChild(opt);

      // putting the values in the selector
      for (let i = 0; i < IDList.length; i++) {
        var opt = document.createElement("option");
        opt.setAttribute("value", IDList[i]);
        var tex = document.createTextNode(IDList[i]);
        opt.appendChild(tex);
        selector.appendChild(opt);
      }
      selector.addEventListener('change', function() {
        selectFeatDD(selector.value, IDList);
      });
      bod.insertAdjacentElement('afterbegin', selector);
      
    }, 500);
  }

  function selectFeatDD(feat_id, IDList) {
    feat = vecSource.getFeatureById(feat_id);
    select.getFeatures().clear();
    select.getFeatures().push(feat);
    selectOne(null, feat, IDList);
  } 

  function cleanse() {
    select.getFeatures().clear();
    $(popup.getElement()).popover('destroy');
    $("#graph-modal-details").off();

    document.getElementById("graph-modal-label").innerHTML = 'ID: null';
    document.getElementById("graph-modal-body").innerHTML = 'Select a point to get data.';
    document.getElementById("graph-num").innerHTML = " (0)";
  }

  select.on('select', function(e) {
    if (e.selected.length > 0 )
      selectOne(e);
    else 
      cleanse();
  })

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
    if (e.features.item(0).getId() == undefined)
      return;
    changed_points++;
    let featID = e.features.item(0).getProperties()['Hylak_id'];
    let coords = ol.proj.toLonLat(e.coordinate);
    document.getElementById("save-num").innerHTML = " (" + changed_points + ")";

    // putting the changed point into a json
    var data = [];
    data.push({
      "Hylak_id": featID,
      "coordLon": coords[0],
      "coordLat": coords[1]
      });

    // post request, not entirely sure what it all does
    // when i tried to do my own thing i got an ASGIRequest in python
    // don't know how to use those
    fetch('/apps/ol-test/update_feats/', {
        method: "POST",
        credentials: 'same-origin',
        headers:{
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(data),
      });
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

});