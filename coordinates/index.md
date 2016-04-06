---
layout: page
---

# Coordinates

## Convert to decimal degrees

{% raw  %}

<div ng-app="app" ng-controller="coordcontroller">

<div class="row">
	<div class="col-md-3">
		<div class="form-group">
			<label for="input">Degrees/minutes/seconds</label>
			<input type="text" class="form-control" ng-model="input" id="input" ng-change="convert()">
		</div>
	</div>
	<div class="col-md-3">
		<div class="form-group">
			<label for="output">Decimal degrees</label>
			<input type="text" class="form-control" ng-model="output" id="output">
		</div>
	</div>
</div>

</div>

{% endraw %}

<script src="{{ site.baseurl }}/bower_components/angular/angular.js"></script>
<script src="{{ site.baseurl }}/geo.js"></script>
<script>

var app = angular.module('app', []);

app.controller('coordcontroller', function($scope, $filter) {

	$scope.input = "51°28'38\" N -101°16'56\" W";

	$scope.convert = function() {
		try {
			var d = geo.parseDms($scope.input);
			var output = "";
			if (d[0] != null) {
				output = output + $filter('number')(d[0], 6);
				if (d[1] != null) {
					output = output + " ";
				}
			}
			if (d[1] != null) {
				output = output + $filter('number')(d[1], 6);
			}
			$scope.output = output;
		}
		catch(err) {
			$scope.output = "";
		}
	};

	$scope.convert();

});

</script>