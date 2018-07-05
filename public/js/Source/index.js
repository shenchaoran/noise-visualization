define(function (require) {
    let $ = require('jquery');
    require('gritter');
    let Cesium = require('Cesium');
    let _ = require('lodash');
    let LayerSwitcher = require('layer-switch');
    let LoadDefault = require('load-default');
    let DrawHelper = require('DrawHelper');

    let center = [118.734733,32.010769];
    let viewer = null;
    let scene = null;
    let canvas = null;
    let clock = null;
    let camera = null;

    let material = null;
    let Lay

    $(function () {
        let timer = null;
        material = new Cesium.Material.fromType('Grid', new Cesium.GridMaterialProperty({
            color: Cesium.Color.YELLOW,
            cellAlpha: 0,
            lineCount: new Cesium.Cartesian2(8, 8),
            lineThickness: new Cesium.Cartesian2(2.0, 2.0)
        }));

        $(document).ready(function () {
            initialGlobeView();
            initDrawHelper();

            let layerSwitcher = LayerSwitcher(viewer);
            // bindUpload(layerSwitcher);
            layerSwitcher.addLayerSwitcher();

            LoadDefault(viewer);

            allowFly();
        });

        function bindUpload(layerSwitcher) {
            $('input[type="file"]').on('change', (e) => {
                layerSwitcher.uploadFile(e.currentTarget)
                    .catch(e => {
                        console.log(e);
                        $.gritter.add({
                            title: 'Warning',
                            text: typeof e === 'object' ? JSON.stringify(e) : e,
                            sticky: false,
                            time: 1000
                        })
                    })
            })
        }

        function initialGlobeView() {
            let terrainProvider = new Cesium.CesiumTerrainProvider({
                url: 'https://assets.agi.com/stk-terrain/world',
                requestVertexNormals: true,
            });

            viewer = new Cesium.Viewer('cesiumContainer', {
                // geocoder: false,
                homeButton: true,
                sceneModePicker: true,
                fullscreenButton: false,
                vrButton: false,
                baseLayerPicker: true,
                animation: false,
                infoBox: false,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                mapProjection: new Cesium.WebMercatorProjection(),
                // imageryProvider: image_googleSource,
                // terrainProvider: terrainProvider //有时候�?�问不了高程数据，可暂时注释掉或者�?�问离线数据
            });
            viewer.scene.globe.enableLighting = false; //�?阳光
            viewer._cesiumWidget._creditContainer.style.display = 'none';

            // image picker
            // let imageryViewModels = [
            //     new Cesium.ProviderViewModel({
            //         name: 'Open\u00adStreet\u00adMap',
            //         iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
            //         tooltip: 'OpenStreetMap (OSM) is a collaborative project to create a free editable map of the world.\nhttp://www.openstreetmap.org',
            //         creationFunction: function() {
            //             return Cesium.createOpenStreetMapImageryProvider({
            //                 url: 'https://a.tile.openstreetmap.org/'
            //             });
            //         }
            //     }),
            //     new Cesium.ProviderViewModel({
            //         name: 'Earth at Night',
            //         iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/blackMarble.png'),
            //         tooltip: 'The lights of cities and villages trace the outlines of civilization in this global view of the Earth at night as seen by NASA/NOAA\'s Suomi NPP satellite.',
            //         creationFunction: function() {
            //             return new Cesium.IonImageryProvider({ assetId: 3812 });
            //         }
            //     }),
            //     new Cesium.ProviderViewModel({
            //         name: 'Natural Earth\u00a0II',
            //         iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/naturalEarthII.png'),
            //         tooltip: 'Natural Earth II, darkened for contrast.\nhttp://www.naturalearthdata.com/',
            //         creationFunction: function() {
            //             return Cesium.createTileMapServiceImageryProvider({
            //                 url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            //             });
            //         }
            //     })
            // ];
            // let baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', {
            //     globe: viewer.scene.globe,
            //     imageryProviderViewModels: imageryViewModels
            // });

            scene = viewer.scene;
            canvas = viewer.canvas;
            clock = viewer.clock;
            camera = viewer.scene.camera;
        }

        function allowFly() {
            setTimeout(function () {
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], 10000),
                    duration: 1.5,
                    orientation: {
                        heading: Cesium.Math.toRadians(0.0),
                        pitch: Cesium.Math.toRadians(-90.0),
                        roll: 0.0
                    }
                });
            }, 3000);
        }

        function initDrawHelper() {
            let drawHelper = new DrawHelper(viewer);
            let toolbar = drawHelper.addToolbar(document.getElementById("toolbar"), {
                buttons: ['polygon', 'circle', 'extent']
            });
            toolbar.addListener('markerCreated', function (event) {
                loggingMessage('Marker created at ' + event.position.toString());
                // create one common billboard collection for all billboards
                let b = new Cesium.BillboardCollection();
                scene.primitives.add(b);
                let billboard = b.add({
                    show: true,
                    position: event.position,
                    pixelOffset: new Cesium.Cartesian2(0, 0),
                    eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    scale: 1.0,
                    image: '/images/toolbar/glyphicons_242_google_maps.png',
                    color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
                });
                billboard.setEditable();
            });
            toolbar.addListener('polylineCreated', function (event) {
                loggingMessage('Polyline created with ' + event.positions.length + ' points');
                let polyline = new DrawHelper.PolylinePrimitive({
                    positions: event.positions,
                    width: 5,
                    geodesic: true
                });
                scene.primitives.add(polyline);
                polyline.setEditable();
                polyline.addListener('onEdited', function (event) {
                    loggingMessage('Polyline edited, ' + event.positions.length + ' points');
                });

            });
            toolbar.addListener('polygonCreated', function (event) {
                loggingMessage('Polygon created with ' + event.positions.length + ' points');
                let polygon = new DrawHelper.PolygonPrimitive({
                    positions: event.positions,
                    material: material
                });
                scene.primitives.add(polygon);
                polygon.setEditable();
                polygon.addListener('onEdited', function (event) {
                    loggingMessage('Polygon edited, ' + event.positions.length + ' points');
                });

            });
            toolbar.addListener('circleCreated', function (event) {
                loggingMessage('Circle created: center is ' + event.center.toString() + ' and radius is ' + event.radius.toFixed(1) + ' meters');
                let circle = new DrawHelper.CirclePrimitive({
                    center: event.center,
                    radius: event.radius,
                    material: material
                });
                scene.primitives.add(circle);
                circle.setEditable();
                circle.addListener('onEdited', function (event) {
                    loggingMessage('Circle edited: radius is ' + event.radius.toFixed(1) + ' meters');
                });
            });
            toolbar.addListener('extentCreated', function (event) {
                let extent = event.extent;
                loggingMessage('Extent created (N: ' + extent.north.toFixed(3) + ', E: ' + extent.east.toFixed(3) + ', S: ' + extent.south.toFixed(3) + ', W: ' + extent.west.toFixed(3) + ')');
                let extentPrimitive = new DrawHelper.ExtentPrimitive({
                    extent: extent,
                    material: material
                });
                scene.primitives.add(extentPrimitive);
                extentPrimitive.setEditable();
                extentPrimitive.addListener('onEdited', function (event) {
                    loggingMessage('Extent edited: extent is (N: ' + event.extent.north.toFixed(3) + ', E: ' + event.extent.east.toFixed(3) + ', S: ' + event.extent.south.toFixed(3) + ', W: ' + event.extent.west.toFixed(3) + ')');
                });
            });

            let logging = document.getElementById('logging');

            function loggingMessage(message) {
                // logging.innerHTML = message;
                console.log(message);
            }
        }
    });
})