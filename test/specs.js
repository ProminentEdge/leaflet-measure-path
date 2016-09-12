describe('leaflet-measure-path', function() {
    var div,
        map;

    beforeEach(function () {
        div = document.createElement('div');
        div.style.height = '100px';
        document.body.appendChild(div);

        map = L.map(div).setView([57.7, 11.9], 12);
    });

    afterEach(function () {
        map.remove();
        document.body.removeChild(div);
    });

    describe('Polyline', function() {
        describe('#setLatLngs', function() {
            it('should update latlngs without measurements', function() {
                var polygon = L.polygon([
                        [57.69, 11.89],
                        [57.697, 11.88],
                        [57.71, 11.89],
                    ])
                    .addTo(map);
                polygon.setLatLngs([
                    [57.69, 11.89],
                    [57.697, 11.88],
                    [57.71, 11.89],
                    [57.71, 11.91],
                    [57.69, 11.91]
                ]);
                expect(polygon.getLatLngs().length).to.be(5);
            })
        });

        it('should add measurements', function() {
                var polygon = L.polygon([
                        [57.69, 11.89],
                        [57.697, 11.88],
                        [57.71, 11.89],
                    ], {showMeasurements: true, measurementOptions: { minDistance: 0 }})
                    .addTo(map);

                expect(document.querySelectorAll('.leaflet-measure-path-measurement').length).to.be(4);
        });

        it('should remove measurements', function() {
                var polygon = L.polygon([
                        [57.69, 11.89],
                        [57.697, 11.88],
                        [57.71, 11.89],
                    ], {showMeasurements: true, measurementOptions: { minDistance: 0 }})
                    .addTo(map);

                map.removeLayer(polygon);
                expect(document.querySelectorAll('.leaflet-measure-path-measurement').length).to.be(0);
        });
    })

    describe('Circle', function() {
        describe('#setLatLng', function() {
            it('should update latlng without measurements', function() {
                var circle = L.circle([57.69, 11.89], 200)
                    .addTo(map);
                circle.setLatLng([57.69, 11.91]);
                expect(circle.getLatLng().lat).to.be(57.69);
                expect(circle.getLatLng().lng).to.be(11.91);
            })
        });
    })
});
