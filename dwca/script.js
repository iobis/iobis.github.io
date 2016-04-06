var colour = function(str) {
	if (str) {
		for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
		for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));
		return colour;		
	} else {
		return "#cccccc";
	}
};

var app = angular.module("app", ['leafcutter', 'ui.bootstrap']);

app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                        scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

app.controller("mapcontroller", function($scope, $filter, leafcuttermaps) {

	$scope.idField = "id";
	$scope.colorField = "scientificName";
	$scope.lonField = "decimalLongitude";
	$scope.latField = "decimalLatitude";
	$scope.colorField = "scientificName";
	$scope.fields = ["test"];
	$scope.sep = "\t";
	$scope.csv = data;
	$scope.occurrences = [];
	var group = new L.featureGroup();

	var parse = function(str, sep) {
		$scope.fields = ["test"];
		var result = [];
		var lines = str.match(/[^\r\n]+/g);
		$scope.fields = lines[0].split(sep);
		for (var i = 1; i < lines.length; i++) {
			var values = lines[i].split(sep);
			var o = {};
			for (var j = 0; j < $scope.fields.length; j++) {
				o[$scope.fields[j]] = values[j];
			}
			result.push(o);
		}
		return result;
	};

	var add = function(occurrence) {

console.log(occurrence);

		var lat = parseFloat(occurrence[$scope.latField]);
		var lon = parseFloat(occurrence[$scope.lonField]);

		var marker = new L.CircleMarker([lat, lon], {
			radius: 4, 
			fillOpacity: 1,
			opacity: 1,
			color: "white",
			fillColor: colour(occurrence[$scope.colorField]),
			weight: 2,
			clickable: true
		});

		if (occurrence[$scope.idField]) {
			var content = "";
	        content = content + occurrence[$scope.idField];
			marker.bindPopup(content);
		}
	
		leafcuttermaps.getMap("map").then(function(map) {
			marker.addTo(group);
		});
	};

    $scope.clear = function() {
        group.clearLayers();
    };

	$scope.plot = function() {
		group.clearLayers();
		var occurrences = parse($scope.csv, $scope.sep);
		for (i in occurrences) {
			add(occurrences[i]);
		}
		leafcuttermaps.getMap("map").then(function(map) {
			map.map.fitBounds(group.getBounds());
		});
	};

	leafcuttermaps.getMap("map").then(function(map) {
		map.zoomcontrol.setPosition("topright");
		group.addTo(map.map);
	});

    $scope.plot();

});