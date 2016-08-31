(function() {
    'use strict';
    L.Icon.Measurement = L.DivIcon.extend({
        initialize: function(measurement, options) {
            L.Icon.prototype.initialize.call(this, L.extend({
                className: 'leaflet-measure-path-measurement',
                html: measurement,
                iconSize: [30, 10]
            }));
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

    var baseSetLatLngs = L.Polyline.prototype.setLatLngs;
    var baseSpliceLatLngs = L.Polyline.prototype.spliceLatLngs;

    L.Polyline.include({
        showMeasurements: function(options) {
            if (!this._map || this._measurementLayer) return this;

            this._measurementOptions = L.extend({
                showOnHover: false,
                minPixelDistance: 30
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
            baseSetLatLngs.apply(this, arguments);
            this.updateMeasurements();
        },

        spliceLatLngs: function() {
            baseSpliceLatLngs.apply(this, arguments);
            this.updateMeasurements();
        },

        formatDistance: function(d) {
            var unit,
                yards;

            if (this._measurementOptions.imperial) {
                yards = d / 0.9144;
                if (yards > 1000) {
                    d = d / 1609.344;
                    unit = 'mi';
                } else {
                    d = yards;
                    unit = 'yd';
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
        },

        updateMeasurements: function() {
            var latLngs = this.getLatLngs(),
                formatter = this._measurementOptions.formatFn || L.bind(this.formatDistance, this),
                isPolygon = this instanceof L.Polygon,
                ll1,
                ll2,
                pixelDist,
                dist;

            this._measurementLayer.clearLayers();

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
    });

    L.Circle.include({
        showMeasurements: function(options) {
            if (!this._map) return;

            this._measurementLayer = L.layerGroup();
        },

        hideMeasurements: function() {
            if (!this._measurementLayer) return;
        }
    })    
})();

