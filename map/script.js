new Clipboard("#copybutton");

var app = angular.module("app", ['leafcutter']);

var trunc = function(x) {
	if (x > 0) {
		return Math.floor(x);
	} else {
		return Math.ceil(x);
	}
};

app.service('geocodeservice', function($q, $http, $rootScope) {
    this.gazetteer = function(q) {
        var url = "http://www.marineregions.org/rest/getGazetteerRecordsByName.json/" + q + "/true/false/?callback=?";
        var deferred = $q.defer();
        var ajax = $.ajax({
            url: url,
            dataType: 'json',
            success: function (response) {
                deferred.resolve(response);
            }, error: function() {
            	deferred.resolve({});
            }
        });
        return deferred.promise;
    };
    this.area = function(layer, lon, lat) {
    	var url = "http://api.iobis.org/features?layer=" + layer + "&longitude=" + lon + "&latitude=" + lat;
        var deferred = $q.defer();
        var ajax = $.ajax({
            url: url,
            dataType: 'json',
            success: function (response) {
                deferred.resolve(response);
            }, error: function() {
            	deferred.resolve({});
            }
        });
        return deferred.promise;
    };
});

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

app.controller("mapcontroller", function($scope, $filter, leafcuttermaps, geocodeservice) {

	// wkt

	var color = "#E58129";
	var decimals = 5;
	$scope.wkt = "";
	var polygongroup = new L.layerGroup();
	var linegroup = new L.layerGroup();

	// map

	$scope.loading = false;
	$scope.locations = [];
	$scope.eez = null;
	$scope.iho = null;
	$scope.showeez = false;

	$scope.getwkt = function() {
		$scope.w = "";
		$scope.w = wkt();
		$('#modal').modal();
	};

	$scope.geocode = function() {
		$scope.gazetteer = {};
		$scope.loading = true;
		geocodeservice.gazetteer($scope.input).then(function(res) {
			$scope.gazetteer = res;
			$scope.loading = false;
			$scope.input = "";
		});
	};

	$scope.toggleeez = function() {
		leafcuttermaps.getMap("map").then(function(map) {
			if ($scope.eez == null) {
				$scope.eez = L.tileLayer.wms("http://iobis.org/geoserver/OBIS/wms?service=WMS&version=1.1.0&request=GetMap&layers=OBIS:eezs&styles=&srs=EPSG:4326", {
					layers: 'OBIS:eezs',
					format: 'image/png',
					transparent: true
				});
				$scope.eez.addTo(map.map);
			} else {
				map.map.removeLayer($scope.eez);
				$scope.eez = null;
			}
		});
	};

	$scope.toggleiho = function() {
		leafcuttermaps.getMap("map").then(function(map) {
			if ($scope.iho == null) {
				$scope.iho = L.tileLayer.wms("http://iobis.org/geoserver/OBIS/wms?service=WMS&version=1.1.0&request=GetMap&layers=OBIS:eezs&styles=&srs=EPSG:4326", {
					layers: 'OBIS:iho',
					format: 'image/png',
					transparent: true
				});
				$scope.iho.addTo(map.map);
			} else {
				map.map.removeLayer($scope.iho);
				$scope.iho = null;
			}
		});
	};

	$scope.add = function(lon, lat, name) {
		lon = $filter('number')(lon, 4);
		lat = $filter('number')(lat, 4);
		var marker = L.marker([lat, lon]);
		leafcuttermaps.getMap("map").then(function(map) {
			marker.addTo(map.map);
		});
		var entry = {lon: lon, lat: lat, marker: marker, type: "point"};
		if (name !== undefined) {
			entry.name = name;
		}
		$scope.locations.push(entry);
		geocodeservice.area("eez", lon, lat).then(function(res) {
			if (res.length > 0 && res[0].name) {
				entry.eez = res[0].name;
			}
		});
		geocodeservice.area("iho", lon, lat).then(function(res) {
			if (res.length > 0 && res[0].name) {
				entry.iho = res[0].name;
			}
		});
	};

	$scope.plot = function() {
		var coords = $scope.coord.split(/[ ,]+/);
		if (coords.length == 2) {
			var lon = coords[0];
			var lat = coords[1];
			$scope.add(lon, lat);
		}
	};

	$scope.del = function(location) {
		if (location.type == "polygon") {
			polygongroup.removeLayer(location.marker);
		} else if (location.type == "line") {
			linegroup.removeLayer(location.marker);
		} else {
			leafcuttermaps.getMap("map").then(function(map) {
				map.map.removeLayer(location.marker);
			});
		}
		var i = $scope.locations.indexOf(location);
		if (i != -1) {
			$scope.locations.splice(i, 1);
		}
	};

	$scope.clearcode = function() {
		$scope.input = "";
		$scope.gazetteer = [];
	};

	var wkt = function() {

		var wkt = "";
		var strings = [];

		// points

		var points = [];
		for (l in $scope.locations) {
			if ($scope.locations[l].type == "point") {
				points.push($filter('number')($scope.locations[l].lon, decimals) + " " + $filter('number')($scope.locations[l].lat, decimals));
			}
		}
		if (points.length > 1) {
			strings.push("MULTIPOINT (" + points.join(", ") + ")");
		} else if (points.length == 1) {
			strings.push(wkt = "POINT (" + points[0] + ")");
		}

		// polygons

		var polygons = [];
		var layers = polygongroup._layers;

		for (l in layers) {
			var points = [];
			for (ll in layers[l]._latlngs) {
				points.push($filter('number')(layers[l]._latlngs[ll].lng, decimals) + " " + $filter('number')(layers[l]._latlngs[ll].lat, decimals));
			}
			points.push($filter('number')(layers[l]._latlngs[0].lng, decimals) + " " + $filter('number')(layers[l]._latlngs[0].lat, decimals));
			polygons.push("((" + points.join(", ") + "))");
		}
		if (polygons.length > 1) {
			strings.push("MULTIPOLYGON (" + polygons.join(", ") + ")");
		} else if (polygons.length == 1) {
			strings.push(wkt = "POLYGON " + polygons[0]);
		}

		// lines

		var lines = [];
		var layers = linegroup._layers;

		for (l in layers) {
			var points = [];
			for (ll in layers[l]._latlngs) {
				points.push($filter('number')(layers[l]._latlngs[ll].lng, decimals) + " " + $filter('number')(layers[l]._latlngs[ll].lat, decimals));
			}
			lines.push("(" + points.join(", ") + ")");
		}
		if (lines.length > 1) {
			strings.push("MULTILINESTRING (" + lines.join(", ") + ")");
		} else if (lines.length == 1) {
			strings.push(wkt = "LINESTRING " + lines[0]);
		}

		// combine

		if (strings.length == 1) {
			wkt = strings[0];
		} else if (strings.length > 1) {
			wkt = "GEOMETRYCOLLECTION(" + strings.join(",") + ")";
		}
		return wkt;
	};

	var calculate = function(e) {
		var layer = e.layer;
		var radius = null;
		var lat = null;
		var lon = null;
		if (e.layerType == "polygon") {
			var allpoints = [];
			var polygons = [];
			var layers = polygongroup._layers;
			for (ll in layer._latlngs) {
				allpoints.push([layer._latlngs[ll].lng, layer._latlngs[ll].lat]);
			}
			if (allpoints.length > 0) {
				var m = geo.midpoint(allpoints);
				var r = geo.maxDistance(m, allpoints);
				lon = m[0];
				lat = m[1];
				radius = r;
			}
		} else {
			var allpoints = [];
			var lines = [];
			for (ll in layer._latlngs) {
				allpoints.push([layer._latlngs[ll].lng, layer._latlngs[ll].lat]);
			}
			if (allpoints.length > 0) {
				var m = geo.midpoint(allpoints);
				var r = geo.maxDistance(m, allpoints);
				lon = m[0];
				lat = m[1];
				radius = r;
			}
		}
		return [radius, lon, lat];
	};

	$scope.addPolygon = function(e) {
		var polygon = e.layer;
		polygon.addTo(polygongroup);
		var entry = {};
		var v = calculate(e);
		entry.radius = v[0];
		entry.lon = v[1];
		entry.lat = v[2];
		entry.type = "polygon";
		entry.marker = polygon;
		$scope.$apply(function() {
			$scope.locations.push(entry);
		});
	};

	$scope.addLine = function(e) {
		var line = e.layer;
		line.addTo(linegroup);
		var entry = {};
		var v = calculate(e);
		entry.radius = v[0];
		entry.lon = v[1];
		entry.lat = v[2];
		entry.type = "line";
		entry.marker = line;
		$scope.$apply(function() {
			$scope.locations.push(entry);
		});
	};

	leafcuttermaps.getMap("map").then(function(map) {
		map.zoomcontrol.setPosition("topright");
		polygongroup.addTo(map.map);
		linegroup.addTo(map.map);
		var drawControl = new L.Control.Draw({
			draw: {
				position: 'topleft',
				marker: false,
				polyline: true,
				circle: false,
				rectangle: false,
				polygon: {
					shapeOptions: {
				    	color: color
				    }
				}
			}
		});
		map.map.addControl(drawControl);
		map.map.on('draw:created', function (e) {
			if (e.layerType == "polygon") {
				$scope.addPolygon(e);
			} else {
				$scope.addLine(e);
			}
		});
		map.clicked = 0;
		map.map.on('click', function(e) {
			map.clicked = map.clicked + 1;
			setTimeout(function() {
				if (map.clicked == 1) {
					$scope.$apply(function() {
						$scope.add($filter('number')(e.latlng.lng, 4), $filter('number')(e.latlng.lat, 4));
					});
				}
				map.clicked = 0;
			}, 300);
		});
	});

});