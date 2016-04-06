(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.geo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require("./util")

var convexHull = function(points) {
	points.sort(function(a, b) {
		return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
	});
	var lower = [];
	for (var i = 0; i < points.length; i++) {
		while (lower.length >= 2 && util.cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
			lower.pop();
		}
		lower.push(points[i]);
	}
	var upper = [];
	for (var i = points.length - 1; i >= 0; i--) {
		while (upper.length >= 2 && util.cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
			upper.pop();
		}
		upper.push(points[i]);
	}
	upper.pop();
	lower.pop();
	return lower.concat(upper);
};

module.exports = {
	convexHull: convexHull
};
},{"./util":6}],2:[function(require,module,exports){
var util = require("./util");

var distance = function(points) {
	var lon1 = util.rad(points[0][0]);
	var lat1 = util.rad(points[0][1]);
	var lon2 = util.rad(points[1][0]);
	var lat2 = util.rad(points[1][1]);
	var dlat = lat2 - lat1;
	var dlon = lon2 - lon1;
	var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = util.r * c;
	return d;
};

var maxDistance = function(point, points) {
	var max = 0;
	for (p in points) {
		var d = distance([point, points[p]]);
		if (d > max) {
			max = d;
		}
	}
	return max;
};

module.exports = {
	distance: distance,
	maxDistance: maxDistance
};
},{"./util":6}],3:[function(require,module,exports){
var convexhull = require("./convexhull");
var parsedms = require("./parsedms");
var distance = require("./distance");
var midpoint = require("./midpoint");

module.exports = {
	parseDms: parsedms.parseDms,
	convexHull: convexhull.convexHull,
	distance: distance.distance,
	maxDistance: distance.maxDistance,
	midpoint: midpoint.midpoint
};
},{"./convexhull":1,"./distance":2,"./midpoint":4,"./parsedms":5}],4:[function(require,module,exports){
var util = require("./util");

var midpoint = function(points) {
	var sx = 0;
	var sy = 0;
	var sz = 0;
	for (p in points) {
		var cart = util.cartesian(points[p]);
		sx = sx + cart[0];
		sy = sy + cart[1];
		sz = sz + cart[2];
	}
	var mean = [sx / points.length, sy / points.length, sz / points.length];
	var mid = util.fromCartesian(mean);
	return [util.fromRad(mid[0]), util.fromRad(mid[1])];
};

module.exports = {
	midpoint: midpoint
};
},{"./util":6}],5:[function(require,module,exports){
var util = require("./util");

var parseDms = function(input) {
	var result = [null, null];
	var re = /(-?\d+(?:\.\d+)?)\s*°\s*(?:(\d+(?:\.\d+)?)\s*[´`'ʹʻʼ′’]\s*(?:(\d+(?:\.\d+)?)\s*(?:″|ʺ|"|”|´´|``|''|ʹʹ|ʻʻ|ʼʼ|′′|’’)?)?)?\s*([NSEW])?/gi;
	var match = re.exec(input);
	while (match != null) {
		var d = parseFloat(match[1]);
		var m = parseFloat(match[2]);
		var s = parseFloat(match[3]);
		var h = match[4];
		if (!isNaN(d)) {
			var dd = Math.abs(d);
			if (!isNaN(m)) {
				dd = dd + m / 60.0;
				if (!isNaN(s)) {
					dd = dd + s / 3600.0;	
				} 
			}
			dd = util.sign(d) * dd;
			if (h .toLowerCase() == "n") {
				result[1] = dd;
			} else if (h .toLowerCase() == "e") {
				result[0] = dd;
			} else if (h .toLowerCase() == "s") {
				result[1] = -dd;
			} else if (h .toLowerCase() == "w") {
				result[0] = -dd;
			}			
		}
		match = re.exec(input);
	}
	return result;
};

module.exports = {
	parseDms: parseDms
};
},{"./util":6}],6:[function(require,module,exports){
var cross = function(o, a, b) {
   return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
};

var sign = function(x) {
	return typeof x === "number" ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
};

var rad = function(deg) {
	return deg * Math.PI / 180;
};

var fromRad = function(rad) {
	return rad * 180 / Math.PI;
};

var cartesian = function(point) {
	var x = r * Math.cos(rad(point[1])) * Math.cos(rad(point[0]));
	var y = r * Math.cos(rad(point[1])) * Math.sin(rad(point[0]));
	var z = r * Math.sin(rad(point[1]));
	return [x, y, z];
};

var fromCartesian = function(point) {
	var lon = Math.atan2(point[1], point[0]);
	var hyp = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
	var lat = Math.atan2(point[2], hyp);
	return [lon, lat];
};

var r = 6371000;

module.exports = {
	cartesian: cartesian,
	fromCartesian: fromCartesian,
	cross: cross,
	sign: sign,
	rad: rad,
	fromRad: fromRad,
	r: r
};
},{}]},{},[3])(3)
});