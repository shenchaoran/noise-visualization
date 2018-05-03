let LayerSwitcher = (viewer) => {

    var imageryLayers = viewer.imageryLayers;
    var dataSources = viewer.dataSources;
    var layers = [];

    function setupLayers() {
        // Create all the base layers that this example will support.
        // These base layers aren't really special.  It's possible to have multiple of them
        // enabled at once, just like the other layers, but it doesn't make much sense because
        // all of these layers cover the entire globe and are opaque.
        addBaseLayerOption(
            'Bing Maps Aerial',
            undefined); // the current base layer
        addBaseLayerOption(
            'Bing Maps Road',
            new Cesium.BingMapsImageryProvider({
                url: 'https://dev.virtualearth.net',
                mapStyle: Cesium.BingMapsStyle.ROAD
            }));
        addBaseLayerOption(
            'ArcGIS World Street Maps',
            new Cesium.ArcGisMapServerImageryProvider({
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
            }));
        addBaseLayerOption(
            'OpenStreetMaps',
            Cesium.createOpenStreetMapImageryProvider());
        addBaseLayerOption(
            'MapQuest OpenStreetMaps',
            Cesium.createOpenStreetMapImageryProvider({
                url: 'https://otile1-s.mqcdn.com/tiles/1.0.0/osm/'
            }));
        addBaseLayerOption(
            'Stamen Maps',
            Cesium.createOpenStreetMapImageryProvider({
                url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/',
                fileExtension: 'jpg',
                credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
            }));
        addBaseLayerOption(
            'Natural Earth II (local)',
            Cesium.createTileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            }));
        addBaseLayerOption(
            'USGS Shaded Relief (via WMTS)',
            new Cesium.WebMapTileServiceImageryProvider({
                url: 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
                layer: 'USGSShadedReliefOnly',
                style: 'default',
                format: 'image/jpeg',
                tileMatrixSetID: 'default028mm',
                maximumLevel: 19,
                credit: 'U. S. Geological Survey'
            }));
        // addAdditionalLayerOption(
        //     'Label',
        //     new Cesium.UrlTemplateImageryProvider({
        //         url: 'http://mt0.google.cn/vt/imgtp=png32&lyrs=h@365000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galil',
        //         credit: ''
        //     })
        // );
        addAdditionalLayerOption(
            'Label',
            new Cesium.WebMapTileServiceImageryProvider({
                url: "http://t0.tianditu.com/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
                layer: "tdtAnnoLayer",
                style: "default",
                format: "image/jpeg",
                tileMatrixSetID: "GoogleMapsCompatible",
                show: false
            })
        )
    }

    function addBaseLayerOption(name, imageryProvider) {
        var layer;
        if (typeof imageryProvider === 'undefined') {
            layer = imageryLayers.get(0);
            viewModel.selectedLayer = layer;
        } else {
            layer = new Cesium.ImageryLayer(imageryProvider);
        }

        layer.myType = 'base';
        layer.name = name;
        baseLayers.push(layer);
    }

    function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
        var layer = imageryLayers.addImageryProvider(imageryProvider);
        layer.alpha = Cesium.defaultValue(alpha, 1);
        layer.show = Cesium.defaultValue(show, true);
        layer.name = name;
        layer.myType = 'image';
        Cesium.knockout.track(layer, ['alpha', 'show', 'name']);

        // layers.unshift(layer);
    }

    function addGeojsonLayerOption(name, geojsonObj) {
        let promise = Cesium.GeoJsonDataSource.load(geojsonObj, {
                stroke: Cesium.Color.fromRandom({
                    alpha: 1.0
                }),
                fill: Cesium.Color.fromRandom({
                    alpha: 1.0
                }),
                strokeWidth: 4,
                markerSize: 1
            })
            .then(dataSource => {
                dataSource.name = name;
                dataSource.myType = 'geojson';
                dataSources.add(dataSource);

                // let entities = dataSource.entities.values;
                // var colorHash = {};
                // for (var i = 0; i < entities.length; i++) {
                //     var entity = entities[i];
                //     var name = entity.name;
                //     var color = colorHash[name];
                //     if (!color) {
                //         color = Cesium.Color.fromRandom({
                //             alpha: 1.0
                //         });
                //         colorHash[name] = color;
                //     }
                //     entity.polygon.material = color;
                //     entity.polygon.outline = false;
                //     entity.polygon.extrudedHeight = 5000.0;
                // }

            });

        viewer.zoomTo(promise);

        // layers.unshift(dataSource);
    }

    function updateLayerList() {
        var numLayers = imageryLayers.length;
        viewModel.layers.splice(0, viewModel.layers.length);
        for (var i = numLayers - 1; i >= 0; --i) {
            viewModel.layers.push(imageryLayers.get(i));
        }
    }

    let viewModel = {
        layers: layers,
        geojsonLayers: [],
        baseLayers: [],
        selectedLayer: null,
        isSelectableLayer: function (layer) {
            return this.baseLayers.indexOf(layer) >= 0;
        },
        raise: function (layer, index) {
            if (layer.myType === 'geojson') {

            } else if (layer.myType === 'image' || layer.myType === 'base') {
                imageryLayers.raise(layer);
            }

            // let temp = layers[index + 1];
            // layers[index + 1] = layer;
            // layers[index] = temp;
            updateLayerList();
        },
        lower: function (layer, index) {
            if (layer.myType === 'geojson') {

            } else if (layer.myType === 'image' || layer.myType === 'base') {
                imageryLayers.lower(layer);
            }

            // let temp = layers[index + 1];
            // layers[index + 1] = layer;
            // layers[index] = temp;
            updateLayerList();
        },
        canRaise: function (layer, layerIndex) {
            return layerIndex > 0;
        },
        canLower: function (layer, layerIndex) {
            return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
        }
    }
    var baseLayers = viewModel.baseLayers;

    return {
        viewModel: viewModel,

        uploadFile: (target) => {
            return new Promise((resolve, reject) => {
                    if (target.files.length) {
                        let toUpload = target.files[0];
                        let name = toUpload.name;
                        let formData = new FormData();
                        formData.append('myfile', toUpload);
                        formData.append('from', 'shp');
                        formData.append('to', 'geojson');
                        if (/\.zip$/.test(name)) {
                            $.ajax({
                                    type: 'POST',
                                    url: '/data/convert',
                                    contentType: false,
                                    processData: false,
                                    cache: false,
                                    data: formData,
                                    dataType: 'json'
                                })
                                .success(res => {
                                    if (res.err) {
                                        return reject(res.err);
                                    } else {
                                        return resolve(res.data);
                                    }
                                })
                                .error(e => {
                                    return reject(e);
                                });
                        } else {
                            target.value = ''
                            return reject('invalid file format!');
                        }
                    } else {
                        return reject('no file selected!');
                    }
                })
                .then(geojson => {
                    try {
                        let layerName = target.files[0].name;
                        let geojsonObj = JSON.parse(geojson);
                        addGeojsonLayerOption(layerName, geojsonObj);
                        updateLayerList();
                        return Promise.resolve();
                    } catch (e) {
                        return Promise.reject(new Error('invalid GeoJSON!'));
                    }
                });
        },

        addLayerSwitcher: () => {

            Cesium.knockout.track(viewModel);

            setupLayers();
            updateLayerList();

            //Bind the viewModel to the DOM elements of the UI that call for it.
            var toolbar = document.getElementById('switcher');
            Cesium.knockout.applyBindings(viewModel, toolbar);

            Cesium.knockout.getObservable(viewModel, 'selectedLayer').subscribe(function (baseLayer) {
                // Handle changes to the drop-down base layer selector.
                var activeLayerIndex = 0;
                var numLayers = viewModel.layers.length;
                for (var i = 0; i < numLayers; ++i) {
                    if (viewModel.isSelectableLayer(viewModel.layers[i])) {
                        activeLayerIndex = i;
                        break;
                    }
                }
                var activeLayer = viewModel.layers[activeLayerIndex];
                var show = activeLayer.show;
                var alpha = activeLayer.alpha;
                imageryLayers.remove(activeLayer, false);
                imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
                baseLayer.show = show;
                baseLayer.alpha = alpha;
                updateLayerList();
            });
        },

        addLayer: (name, imageryProvider) => {
            addAdditionalLayerOption(name, imageryProvider, 1.0, true);
        }
    }
}