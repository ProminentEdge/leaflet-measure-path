(function() {
    'use strict';
    L.Icon.Measurement = L.DivIcon.extend({
        initialize: function(measurement, options) {
            L.Icon.prototype.initialize.call(this, L.extend({
                className: 'leaflet-measure-path-measurement',
                html: measurement,
                iconSize: [36, 10]
            }, options));
        }
    });

    L.icon.measurement = function(measurement, options) {
        return new L.Icon.Measurement(measurement, options);
    };

    L.Marker.Measurement = L.Marker.extend({
        initialize: function(latLng, measurement, options) {
            var icon = L.icon.measurement(measurement, options);
            L.Marker.prototype.initialize.call(this, latLng, L.extend({
                icon: icon
            }, options));
        }
    });

    L.marker.measurement = function(latLng, measurement, options) {
        return new L.Marker.Measurement(latLng, measurement, options);
    };

    var formatDistance = function(d) {
        var unit,
            feet;

        if (this._measurementOptions.imperial) {
            feet = d / 0.3048;
            if (feet > 3000) {
                d = d / 1609.344;
                unit = 'mi';
            } else {
                d = feet;
                unit = 'ft';
            }
        } else {
            if (d > 1000) {
                d = d / 1000;
                unit = 'km';
            } else {
                unit = 'm';
            }
        }

        if (d < 100) {
            return d.toFixed(1) + ' ' + unit;
        } else {
            return Math.round(d) + ' ' + unit;
        }
    }

    var formatArea = function(a) {
        var unit,
            sqfeet;

        if (this._measurementOptions.imperial) {
            sqfeet = a / 0.09290304;
            if (sqfeet > 100000) {
                a = a / 2589988.11;
                unit = 'mi<sup>2</sup>';
            } else {
                a = sqfeet;
                unit = 'ft<sup>2</sup>';
            }
        } else {
            if (a > 100000) {
                a = a / 100000;
                unit = 'km<sup>2</sup>';
            } else {
                unit = 'm<sup>2</sup>';
            }
        }

        if (a < 100) {
            return a.toFixed(1) + ' ' + unit;
        } else {
            return Math.round(a) + ' ' + unit;
        }
    }

    var RADIUS = 6378137;
    // ringArea function copied from geojson-area
    // (https://github.com/mapbox/geojson-area)
    // This function is distributed under a separate license,
    // see LICENSE.md.
    var ringArea = function ringArea(coords) {
        var rad = function rad(_) {
            return _ * Math.PI / 180;
        };
        var p1, p2, p3, lowerIndex, middleIndex, upperIndex,
        area = 0,
        coordsLength = coords.length;

        if (coordsLength > 2) {
            for (var i = 0; i < coordsLength; i++) {
                if (i === coordsLength - 2) {// i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength -1;
                    upperIndex = 0;
                } else if (i === coordsLength - 1) {// i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else { // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i+1;
                    upperIndex = i+2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];
                area += ( rad(p3.lng) - rad(p1.lng) ) * Math.sin( rad(p2.lat));
            }

            area = area * RADIUS * RADIUS / 2;
        }

        return area;
    };

    var circleArea = function circleArea(d) {
        var rho = d / RADIUS;
        return 2 * Math.PI * RADIUS * RADIUS * (1 - Math.cos(rho));
    };

    var polylineSetLatLngs = L.Polyline.prototype.setLatLngs;
    var polylineSpliceLatLngs = L.Polyline.prototype.spliceLatLngs;

    L.Polyline.include({
        showMeasurements: function(options) {
            if (!this._map || this._measurementLayer) return this;

            this._measurementOptions = L.extend({
                showOnHover: false,
                minPixelDistance: 30,
                showDistances: true,
                showArea: true
            }, options || {});

            this._measurementLayer = L.layerGroup().addTo(this._map);
            this.updateMeasurements();

            this._map.on('zoomend', this.updateMeasurements, this);

            return this;
        },

        hideMeasurements: function() {
            this._map.on('zoomend', this.updateMeasurements, this);

            if (!this._measurementLayer) return this;
            this._map.removeLayer(this._measurementLayer);
            this._measurementLayer = null;

            return this;
        },

        setLatLngs: function() {
            polylineSetLatLngs.apply(this, arguments);
            this.updateMeasurements();
        },

        spliceLatLngs: function() {
            polylineSpliceLatLngs.apply(this, arguments);
            this.updateMeasurements();
        },

        formatDistance: formatDistance,
        formatArea: formatArea,

        updateMeasurements: function() {
            var latLngs = this.getLatLngs(),
                isPolygon = this instanceof L.Polygon,
                formatter,
                ll1,
                ll2,
                pixelDist,
                dist;

            this._measurementLayer.clearLayers();

            if (this._measurementOptions.showDistances) {
                formatter = this._measurementOptions.formatDistance || L.bind(this.formatDistance, this);

                for (var i = 1, len = latLngs.length; (isPolygon && i <= len) || i < len; i++) {
                    ll1 = latLngs[i - 1];
                    ll2 = latLngs[i % len];
                    pixelDist = this._map.latLngToLayerPoint(ll1).distanceTo(this._map.latLngToLayerPoint(ll2));

                    if (pixelDist >= this._measurementOptions.minPixelDistance) {
                        dist = ll1.distanceTo(ll2);
                        L.marker.measurement([(ll1.lat + ll2.lat) / 2, (ll1.lng + ll2.lng) / 2], formatter(dist))
                            .addTo(this._measurementLayer);
                    }
                }
            }

            if (isPolygon && this._measurementOptions.showArea) {
                formatter = this._measurementOptions.formatArea || L.bind(this.formatArea, this);
                var area = ringArea(latLngs);
                L.marker.measurement(this.getBounds().getCenter(), formatter(area))
                    .addTo(this._measurementLayer);
            }
        }
    });

    var circleSetLatLng = L.Circle.prototype.setLatLng;
    var circleSetRadius = L.Circle.prototype.setRadius;


    L.Circle.include({
        showMeasurements: function(options) {
            if (!this._map || this._measurementLayer) return this;

            this._measurementOptions = L.extend({
                showOnHover: false,
                showArea: true
            }, options || {});

            this._measurementLayer = L.layerGroup().addTo(this._map);
            this.updateMeasurements();

            this._map.on('zoomend', this.updateMeasurements, this);

            return this;
        },

        hideMeasurements: function() {
            this._map.on('zoomend', this.updateMeasurements, this);

            if (!this._measurementLayer) return this;
            this._map.removeLayer(this._measurementLayer);
            this._measurementLayer = null;

            return this;
        },

        setLatLng: function() {
            circleSetLatLng.apply(this, arguments);
            this.updateMeasurements();
        },

        setRadius: function() {
            circleSetRadius.apply(this, arguments);
            this.updateMeasurements();
        },

        formatArea: formatArea,

        updateMeasurements: function() {
            var latLng = this.getLatLng(),
                formatter = this._measurementOptions.formatDistance || L.bind(this.formatDistance, this);

            this._measurementLayer.clearLayers();

            if (this._measurementOptions.showArea) {
                formatter = this._measurementOptions.formatArea || L.bind(this.formatArea, this);
                var area = circleArea(this.getRadius());
                L.marker.measurement(latLng, formatter(area))
                    .addTo(this._measurementLayer);
            }
        }
    })    
})();

