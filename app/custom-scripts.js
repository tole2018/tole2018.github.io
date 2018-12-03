// Loading all required dojo and esri modules used in index map
require([
	'dojo/topic',
	'dojo/_base/array',
	'dojo/dom-geometry',
	'esri/map',
	'esri/layers/CSVLayer',
	'esri/Color',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/renderers/UniqueValueRenderer',
], function(
	topic,
	array,
	domGeom,
	Map,
	CSVLayer,
	Color,
	SimpleMarkerSymbol,
	UniqueValueRenderer
) {
	// Custom Javascript to be executed while the application is initializing goes here

	// The application is ready
	topic.subscribe("tpl-ready", function(){

		// Custom Javascript to be executed when the application is ready goes here


		// CONFIGURATION VARIABLES START
		// Update the label fields for those used in your CSV file. Be sure that it matches
		// exactly (including case)
		var LabelField = 'Label';
		var StoryIndexField = 'StoryIndex';
		var ActiveField = 'Active';
		// Change the colors of the default and active symbols on the map.
		// Color documentation available here:
		// https://dojotoolkit.org/reference-guide/1.10/dojo/_base/Color.html
		var defaultMarkerColor = new Color([114, 100, 87, 0.7]);
		var activeMarkerColor = new Color([0, 105, 0, 0.9]);
		// The path to your csv file.
		var csvPath = 'resources/index-map/index-map-layer.csv';
		// CONFIGURATION VARIABLES END

		// variable stores currently selected graphic
		var selectedGraphic = false;

		// Removes the help text tooltip after the user first clicks on the map
		$('#index-map').click(function(){
			$('#index-map-helper').removeClass('active');
		});

		// Create the index map
		var indexMap = new Map('index-map',{
			// Change the following options to set the default view of your index map.
			// Option documentation is here:
			// https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
			basemap: 'gray',
			center: [-95,38],
			zoom: 3,
			minZoom: 1,
			maxZoom: 8,
			// You don't need to change these
			logo: false,
			showAttribution: false
		});

		// Load CSV File as point later
		var indexMapLayer = csv = new CSVLayer(csvPath);

		// Create simple point symbols
		var activeMarker =  new SimpleMarkerSymbol('solid', 15, null, activeMarkerColor);
		var defaultMarker = new SimpleMarkerSymbol('solid', 12, null, defaultMarkerColor);

		// Change the CSV Layer renderer to use the symbols we just created
		var renderer = new UniqueValueRenderer(defaultMarker,ActiveField);
		renderer.addValue('TRUE', activeMarker);
		indexMapLayer.setRenderer(renderer);

		// Add CSV layer to map
		indexMap.addLayer(indexMapLayer);

		// Select current section in index map on Loading
		setIconDisplay(app.data.getCurrentSectionIndex());

		// Add map events
		indexMapLayer.on('click',function(event){
			$('#index-map-helper').removeClass('active');
			hideIndexMapInfo();
			topic.publish('story-navigate-section', event.graphic.attributes[StoryIndexField]);
		});

		indexMapLayer.on('mouse-over',function(event){
			indexMap.setCursor('pointer');
			setIndexMapInfo(event.graphic);
		});

		indexMapLayer.on('mouse-out',function(){
			indexMap.setCursor('default');
			hideIndexMapInfo();
		});

		indexMap.on('extent-change',function(){
			indexMap.setCursor('default');
			hideIndexMapInfo();
			moveSelectedToFront();
		});

		topic.subscribe('story-load-section', setIconDisplay);

		// Select current section in index map (Update symbol color)
		function setIconDisplay(index){
			selectedGraphic = false;
			if (index !== null){
				array.forEach(indexMapLayer.graphics,function(g){
					if (g.attributes[StoryIndexField].toString() === index.toString()){
						g.attributes[ActiveField] = 'TRUE';
						if(g.getDojoShape()){
							selectedGraphic = g;
							g.getDojoShape().moveToFront();
						}
						indexMap.centerAt(g.geometry);
					}
					else{
						g.attributes[ActiveField] = 'FALSE';
					}
				});
				indexMapLayer.redraw();
			}
		}

		// Make sure selected point is on top.
		function moveSelectedToFront(){
			if (selectedGraphic) {
				selectedGraphic.getDojoShape().moveToFront();
			}
		}

		// Hide point tooltip
		function hideIndexMapInfo(){
			$('#index-map-info').hide();
		}

		// Show point tooltip
		function setIndexMapInfo(graphic){
			$('#index-map-info').html(graphic.attributes[LabelField]);
			if (graphic.getDojoShape()){
				graphic.getDojoShape().moveToFront();
			}
			positionIndexMapInfo(graphic);
		}

		// Move tooltip next to selected point
		function positionIndexMapInfo(graphic){
			var pos = domGeom.position(graphic.getNode());
			$('#index-map-info').css({
				'top': pos.y - (pos.h/2) - 3,
				'left': pos.x + pos.w
			}).show();
		}

	});
});