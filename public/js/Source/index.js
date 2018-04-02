var center = [118.922413, 32.120844];
var viewer = null;
var scene = null;
var canvas = null;
var clock = null;
var camera = null;

var material = null;

$(function() {
    var timer = null;
    material = new Cesium.Material.fromType('Grid', new Cesium.GridMaterialProperty({
        color: Cesium.Color.YELLOW,
        cellAlpha: 0,
        lineCount: new Cesium.Cartesian2(8, 8),
        lineThickness: new Cesium.Cartesian2(2.0, 2.0)
    }));

    $(document).ready(function() {
        initialGlobeView();
        initDrawHelper();
    });

    function initialGlobeView() {
        var terrainProvider = new Cesium.CesiumTerrainProvider({
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
            skyBox: false,
            skyAtmosphere: false,
            // imageryProvider: image_googleSource,
            // terrainProvider: terrainProvider //有时候访问不了高程数据，可暂时注释掉或者访问离线数据
        });
        viewer.scene.globe.enableLighting = false; //太阳光
        viewer._cesiumWidget._creditContainer.style.display = 'none';

        // image picker
        // var imageryViewModels = [
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
        // var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', {
        //     globe: viewer.scene.globe,
        //     imageryProviderViewModels: imageryViewModels
        // });

        // 图层管理
        var layers = viewer.imageryLayers;
        var label_googleSource = new Cesium.UrlTemplateImageryProvider({
            url: 'http://mt0.google.cn/vt/imgtp=png32&lyrs=h@365000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galil',
            credit: ''
        });
        layers.addImageryProvider(label_googleSource);


        scene = viewer.scene;
        canvas = viewer.canvas;
        clock = viewer.clock;
        camera = viewer.scene.camera;

        setTimeout(function() {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], 8000000),
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
        var drawHelper = new DrawHelper(viewer);
        var toolbar = drawHelper.addToolbar(document.getElementById("toolbar"), {
            buttons: ['polygon', 'circle', 'extent']
        });
        toolbar.addListener('markerCreated', function(event) {
            loggingMessage('Marker created at ' + event.position.toString());
            // create one common billboard collection for all billboards
            var b = new Cesium.BillboardCollection();
            scene.primitives.add(b);
            var billboard = b.add({
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
        toolbar.addListener('polylineCreated', function(event) {
            loggingMessage('Polyline created with ' + event.positions.length + ' points');
            var polyline = new DrawHelper.PolylinePrimitive({
                positions: event.positions,
                width: 5,
                geodesic: true
            });
            scene.primitives.add(polyline);
            polyline.setEditable();
            polyline.addListener('onEdited', function(event) {
                loggingMessage('Polyline edited, ' + event.positions.length + ' points');
            });

        });
        toolbar.addListener('polygonCreated', function(event) {
            loggingMessage('Polygon created with ' + event.positions.length + ' points');
            var polygon = new DrawHelper.PolygonPrimitive({
                positions: event.positions,
                material: material
            });
            scene.primitives.add(polygon);
            polygon.setEditable();
            polygon.addListener('onEdited', function(event) {
                loggingMessage('Polygon edited, ' + event.positions.length + ' points');
            });

        });
        toolbar.addListener('circleCreated', function(event) {
            loggingMessage('Circle created: center is ' + event.center.toString() + ' and radius is ' + event.radius.toFixed(1) + ' meters');
            var circle = new DrawHelper.CirclePrimitive({
                center: event.center,
                radius: event.radius,
                material: material
            });
            scene.primitives.add(circle);
            circle.setEditable();
            circle.addListener('onEdited', function(event) {
                loggingMessage('Circle edited: radius is ' + event.radius.toFixed(1) + ' meters');
            });
        });
        toolbar.addListener('extentCreated', function(event) {
            var extent = event.extent;
            loggingMessage('Extent created (N: ' + extent.north.toFixed(3) + ', E: ' + extent.east.toFixed(3) + ', S: ' + extent.south.toFixed(3) + ', W: ' + extent.west.toFixed(3) + ')');
            var extentPrimitive = new DrawHelper.ExtentPrimitive({
                extent: extent,
                material: material
            });
            scene.primitives.add(extentPrimitive);
            extentPrimitive.setEditable();
            extentPrimitive.addListener('onEdited', function(event) {
                loggingMessage('Extent edited: extent is (N: ' + event.extent.north.toFixed(3) + ', E: ' + event.extent.east.toFixed(3) + ', S: ' + event.extent.south.toFixed(3) + ', W: ' + event.extent.west.toFixed(3) + ')');
            });
        });

        var logging = document.getElementById('logging');

        function loggingMessage(message) {
            // logging.innerHTML = message;
            console.log(message);
        }
    }
});