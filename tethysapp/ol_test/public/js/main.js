// $(function() {
//     // setting up sources before the base layer
//     // reducing repeating code
//     var OSM = new ol.source.OSM();
//     var ArcGIS = new ol.source.XYZ({
//       url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//       maxZoom: 19
//     });
//     var vecSource = new ol.source.Vector({ wrapX: true });

//     // base layer declaration
//     var baseLayer = new ol.layer.Tile({
//       source: OSM
//     });

//     var vector = new ol.layer.Vector({
//       source: vecSource
//     });

//     var map = new ol.Map({
//       layers: [baseLayer, vector],
//       target: document.getElementById('map'),
//       view: new ol.View({
//         center: ol.proj.fromLonLat([-90.8, 37.2]),
//         zoom: 4
//       })
//     })

// })