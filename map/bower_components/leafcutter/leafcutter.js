var leafcutter = angular.module("leafcutter", []);

leafcutter.directive("leaflet", function(leafcuttermaps) {
	return {
		restrict: "EA",
		scope: {
			name: "="
		},
		link: function(scope, element, attrs) {
			scope.layers = {};
			scope.map = L.map(element[0], {
				attributionControl: false,
				zoomControl: false
			}).setView([30, 20], 2);
			var baselayer = L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}", {}).addTo(scope.map);
			var zoom = L.control.zoom({position: "topleft"}).addTo(scope.map);
			leafcuttermaps.setMap(attrs.map, {
				map: scope.map,
				zoomcontrol: zoom,
				addLayer: function(name, layer) {
					layer.addTo(scope.map);
					scope.layers[name] = layer;
				},
				removeLayer: function(name) {
					if (scope.layers.hasOwnProperty(name)) {
						scope.map.removeLayer(scope.layers[name]);
						delete scope.layers[name];	
					}
				},
				reset: function() {
					for (var layer in scope.layers) {
						if (scope.layers.hasOwnProperty(layer)) {
							scope.map.removeLayer(scope.layers[layer]);
						}
					}
					scope.layers = {};
				}
			});
			scope.$on("$destroy", function () {
				leafcuttermaps.reset();
			});
		}
	};
});

leafcutter.service("leafcuttermaps", function($q) {
	var maps = {};
	this.setMap  = function(id, map) {
		if (maps.hasOwnProperty(id)) {
			maps[id].resolve(map);
		} else {
			maps[id] = $q.defer().resolve(map);
		}
	};
	this.getMap = function(id) {
		if (!maps.hasOwnProperty(id)) {
			maps[id] = $q.defer();
		}
		return maps[id].promise;
	};
	this.reset = function() {
		maps = {};
	};
});