define(function (require) {
    let $ = require('jquery');
    require('gritter');
    let Cesium = require('Cesium');
    let _ = require('lodash');
    let Vertex = require(['Plugins/Vertex']);
    let Triangle = require('Plugins/Triangle');
    let MultiColorTriangleGeometry = require('MultiColorTriangle/MultiColorTriangleGeometry');
    let MultiColorTriangleAppearance = require('MultiColorTriangle/MultiColorTriangleAppearance');
    let Brush = require('draw-ascii');
    let turf = require('turf');

    return LoadDefault = (viewer) => {
        let primitives = viewer.scene.primitives;
        let dataSources = viewer.dataSources;
        let colors = {
            '1st green.json': 'rgba(115,219,89, 0.996)',
            '2nd green.json': 'rgba(115,178,115, 0.996)',
            '1st road.json': 'rgba(155,157,157, 0.8)',
            '2nd road.json': 'rgba(169,162,162, 0.8)',
            '1st water.json': 'rgba(9,138,181, 0.8)',
            '4th water.json': 'rgba(16,202,233, 0.996)',
            'block.json': 'rgba(225,196,139, 0.3)',
            'bridge.json': 'rgba(214,133,137, 0.996)',
            'building.json': 'rgba(255,255,255, 0.999)',
            'noise region.json': 'rgba(246,197,103, 0.996)',
            'road center.json': 'rgba(255,127,127, 0.996)',
        };

        let hasLoadResult = false;
        let roadCenter;

        // let pickedEntities = new Cesium.EntityCollection();
        // let pickColor = Cesium.Color.YELLOW.withAlpha(0.5);

        let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(function (e) {
            // // get an array of all primitives at the mouse position
            // let pickedObjects = viewer.scene.drillPick(movement.endPosition);
            // if (Cesium.defined(pickedObjects)) {
            //     //Update the collection of picked entities.
            //     pickedEntities.removeAll();
            //     for (let i = 0; i < pickedObjects.length; ++i) {
            //         let entity = pickedObjects[i].id;
            //         pickedEntities.add(entity);
            //     }
            // }

            if (Cesium.defined(viewer.scene.pick(e.position))) {
                let entity = viewer.scene.pick(e.position).id;
                if (Cesium.defined(entity)) {
                    if (entity.entityCollection.owner.name === 'N_result.json') {
                        if (entity.hadSelected) {
                            entity.hadSelected = false;
                            entity.point.color._value = Cesium.Color.fromCssColorString('#fff').withAlpha(0.996);
                        } else {
                            // draw intersection
                            let cart = Cesium.Cartographic.fromCartesian(entity.position._value);
                            let pt = [cart.longitude * 180 / Math.PI, cart.latitude * 180 / Math.PI];
                            selectMBR(pt);
                            entity.hadSelected = true;
                            entity.point.color._value = Cesium.Color.RED.withAlpha(0.996);
                        }
                    }
                }
            }


            // let entity = pickEntity();
            // if(defined(entity)) {

            // }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        function load(fname) {
            return new Promise((resolve, reject) => {
                $.ajax({
                        url: `/default-data/${fname}`,
                        method: 'GET',
                        dataType: 'json'
                    })
                    .success(json => {
                        return resolve({
                            geojson: json,
                            fname: fname
                        });
                    })
                    .error(e => {
                        return reject(e);
                    });
            });
        };

        function drawGeojson(json, pts, center, type) {
            if (type === 'rays') {
                function MyDataSource(name) {
                    //All public configuration is defined as ES5 properties
                    //These are just the "private" variables and their defaults.
                    this._name = name;
                    this._changed = new Cesium.Event();
                    this._error = new Cesium.Event();
                    this._isLoading = false;
                    this._loading = new Cesium.Event();
                    this._entityCollection = new Cesium.EntityCollection();
                    this._seriesNames = [];
                    this._seriesToDisplay = undefined;
                    this._heightScale = 10000000;
                    this._entityCluster = new Cesium.EntityCluster();
                }
                Object.defineProperties(MyDataSource.prototype, {
                    //The below properties must be implemented by all DataSource instances

                    /**
                     * Gets a human-readable name for this instance.
                     * @memberof MyDataSource.prototype
                     * @type {String}
                     */
                    name: {
                        get: function () {
                            return this._name;
                        }
                    },
                    /**
                     * Since WebGL Globe JSON is not time-dynamic, this property is always undefined.
                     * @memberof MyDataSource.prototype
                     * @type {DataSourceClock}
                     */
                    clock: {
                        value: undefined,
                        writable: false
                    },
                    /**
                     * Gets the collection of Entity instances.
                     * @memberof MyDataSource.prototype
                     * @type {EntityCollection}
                     */
                    entities: {
                        get: function () {
                            return this._entityCollection;
                        }
                    },
                    /**
                     * Gets a value indicating if the data source is currently loading data.
                     * @memberof MyDataSource.prototype
                     * @type {Boolean}
                     */
                    isLoading: {
                        get: function () {
                            return this._isLoading;
                        }
                    },
                    /**
                     * Gets an event that will be raised when the underlying data changes.
                     * @memberof MyDataSource.prototype
                     * @type {Event}
                     */
                    changedEvent: {
                        get: function () {
                            return this._changed;
                        }
                    },
                    /**
                     * Gets an event that will be raised if an error is encountered during
                     * processing.
                     * @memberof MyDataSource.prototype
                     * @type {Event}
                     */
                    errorEvent: {
                        get: function () {
                            return this._error;
                        }
                    },
                    /**
                     * Gets an event that will be raised when the data source either starts or
                     * stops loading.
                     * @memberof MyDataSource.prototype
                     * @type {Event}
                     */
                    loadingEvent: {
                        get: function () {
                            return this._loading;
                        }
                    },

                    //These properties are specific to this DataSource.

                    /**
                     * Gets the array of series names.
                     * @memberof MyDataSource.prototype
                     * @type {String[]}
                     */
                    seriesNames: {
                        get: function () {
                            return this._seriesNames;
                        }
                    },
                    /**
                     * Gets or sets the name of the series to display.  WebGL JSON is designed
                     * so that only one series is viewed at a time.  Valid values are defined
                     * in the seriesNames property.
                     * @memberof MyDataSource.prototype
                     * @type {String}
                     */
                    seriesToDisplay: {
                        get: function () {
                            return this._seriesToDisplay;
                        },
                        set: function (value) {
                            this._seriesToDisplay = value;

                            //Iterate over all entities and set their show property
                            //to true only if they are part of the current series.
                            let collection = this._entityCollection;
                            let entities = collection.values;
                            collection.suspendEvents();
                            for (let i = 0; i < entities.length; i++) {
                                let entity = entities[i];
                                entity.show = value === entity.seriesName;
                            }
                            collection.resumeEvents();
                        }
                    },
                    /**
                     * Gets or sets the scale factor applied to the height of each line.
                     * @memberof MyDataSource.prototype
                     * @type {Number}
                     */
                    heightScale: {
                        get: function () {
                            return this._heightScale;
                        },
                        set: function (value) {
                            if (value > 0) {
                                throw new Cesium.DeveloperError('value must be greater than 0');
                            }
                            this._heightScale = value;
                        }
                    },
                    /**
                     * Gets whether or not this data source should be displayed.
                     * @memberof MyDataSource.prototype
                     * @type {Boolean}
                     */
                    show: {
                        get: function () {
                            return this._entityCollection;
                        },
                        set: function (value) {
                            this._entityCollection = value;
                        }
                    },
                    /**
                     * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
                     * @memberof MyDataSource.prototype
                     * @type {EntityCluster}
                     */
                    clustering: {
                        get: function () {
                            return this._entityCluster;
                        },
                        set: function (value) {
                            if (!Cesium.defined(value)) {
                                throw new Cesium.DeveloperError('value must be defined.');
                            }
                            this._entityCluster = value;
                        }
                    }
                });
                MyDataSource.prototype._setLoading = function (isLoading) {
                    if (this._isLoading !== isLoading) {
                        this._isLoading = isLoading;
                        this._loading.raiseEvent(this, isLoading);
                    }
                };


                let dataSource = new MyDataSource('rays');
                dataSource._setLoading(true);
                // let entities = new Cesium.EntityCollection(dataSource);
                let entities = viewer.entities;

                // positions = [];
                // for (i = 0; i < 40; ++i) {
                //     positions.push(Cesium.Cartesian3.fromDegrees(-100.0 + i, 15.0));
                // }
                // entities.add({
                //     polyline: {
                //         positions: positions,
                //         width: 10.0,
                //         material: new Cesium.PolylineGlowMaterialProperty({
                //             color: Cesium.Color.DEEPSKYBLUE,
                //             glowPower: 0.25
                //         })
                //     }
                // });
                let from = Cesium.Cartesian3.fromDegrees(center[0], center[1], 0);
                _.map(pts, pt => {
                    let to = Cesium.Cartesian3.fromDegrees(pt[0], pt[1], 0);
                    let polyline = {
                        positions : new Cesium.ConstantProperty([from, to]),
                        material : new Cesium.PolylineGlowMaterialProperty({
                            color : Cesium.Color.RED
                        }),
                        width : new Cesium.ConstantProperty(5)
                    }
                    let entity = new Cesium.Entity({
                        polyline: polyline
                    });
                    entities.add(entity);
                });

                // let color = Cesium.Color.fromCssColorString('#fff');
                // _.map(json.geojson.features, f => {
                //     let pos = f.geometry.coordinates;
                //     let polyline = new Cesium.PolylineGraphics();
                //     let color = Cesium.Color.fromRandom();
                //     // let color = Cesium.Color.fromHsl(f.properties.NoiseData * 0.01, 1.0, 0.5);
                //     let surfacePosition = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 0);
                //     let heightPosition = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], f.properties.NoiseData * 30000000000);

                //     polyline.material = new Cesium.ColorMaterialProperty(color);
                //     polyline.width = new Cesium.ConstantProperty(5);
                //     polyline.followSurface = new Cesium.ConstantProperty(false);
                //     polyline.positions = new Cesium.ConstantProperty([surfacePosition, heightPosition]);

                //     let entity = new Cesium.Entity({
                //         polyline: polyline,
                //         billboard: undefined
                //     });
                //     entities.add(entity);
                // });
                // dataSource._setLoading(false);
                // dataSource._seriesNames.push('asdfasdf');
                // dataSource.seriesToDisplay = 'asdfasdf';

                // let ftype = _.get(json, 'geojson.features[0].geometry.type');
                // dataSource.ftype = 'Point';
                // dataSource.name = 'rays';
                // dataSources.add(dataSource);
                // updateLayerList();
                // viewer.zoomTo(dataSource);
                return Promise.resolve();
            } else {
                return Cesium.GeoJsonDataSource.load(json.geojson)
                    .then(dataSource => {
                        let ftype = _.get(json, 'geojson.features[0].geometry.type');
                        if (json.fname === 'N_result.json') {
                            dataSource.show = false;
                        }
                        dataSource.ftype = ftype;
                        dataSource.name = json.fname;
                        dataSources.add(dataSource);
                        updateLayerList();
                        let color = colors[json.fname] ? Cesium.Color.fromCssColorString(colors[json.fname]) : Cesium.Color.fromCssColorString('#fff');

                        let polyType = dataSource.ftype === 'LineString' ? 'polyline' :
                            dataSource.ftype === 'MultiPolygon' || dataSource.ftype === 'Polygon' ? 'polygon' :
                            dataSource.ftype === 'MultiPoint' || dataSource.ftype === 'Point' ? 'point' :
                            '';

                        let entities = dataSource.entities.values;
                        _.map(entities, entity => {
                            let name = entity.name;
                            if (polyType === 'point') {
                                entity.billboard = undefined;
                                if (json.fname === 'N_result.json') {
                                    entity.point = new Cesium.PointGraphics({
                                        color: color.withAlpha(0.996),
                                        pixelSize: 5
                                    });
                                } else {
                                    entity[polyType] = new Cesium.PointGraphics({
                                        color: color,
                                        pixelSize: 5
                                    });
                                }
                            } else if (polyType === 'polyline') {
                                entity[polyType].material = color;
                                entity[polyType].width = 2;
                            } else if (polyType === 'polygon') {
                                entity[polyType].material = color;
                                entity[polyType].outline = false;
                                if (json.fname === 'building.json') {
                                    entity.polygon.extrudedHeight = entity.properties.STOREY_COU * 4.5;
                                }
                            }
                        });

                        return Promise.resolve();
                    });
            }

        };

        function updateLayerList() {
            let numLayers = dataSources.length;
            viewModel.geojsonLayers.splice(0, viewModel.geojsonLayers.length);
            for (let i = numLayers - 1; i >= 0; --i) {
                viewModel.geojsonLayers.push(dataSources.get(i));
            }
        }

        function loadDefault() {
            let files = [
                'block.json',
                'bridge.json',
                '1st green.json',
                '2nd green.json',
                '1st road.json',
                '2nd road.json',
                '1st water.json',
                '4th water.json',
                'building.json',
                'road center.json',
                // 'noise region.json',
            ];
            Promise.all(_.map(
                    files,
                    file => {
                        return load(file)
                            .then(drawGeojson)
                            .catch(e => {
                                console.log(e);
                                return Promise.resolve();
                            });
                    }
                ))
                .then(rsts => {
                    if (dataSources.length) {
                        viewer.zoomTo(dataSources.get(0));
                    }
                });
        };

        function selectMBR(pt) {
            let promise;
            if (roadCenter) {
                promise = Promise.resolve();
            } else {
                promise = load('road center.json')
                    .then(json => {
                        roadCenter = json.geojson;
                        return drawGeojson(json);
                    });
            }
            promise.then(() => {
                    let lines = _
                        .chain(roadCenter.features)
                        .map(f => {
                            let line = turf.lineString(f.geometry.coordinates);
                            return line;
                        })
                        .filter(line => {
                            let rst = turf.nearestPointOnLine(line, pt, {
                                units: 'miles'
                            });
                            let ptsOnLine = line.geometry.coordinates;
                            let index = _.indexOf(ptsOnLine, rst.geometry.coordinates);
                            // return ;
                            let segNum = rst.properties.index;
                            return segNum > 1 && segNum < ptsOnLine.length - 2 && (index === -1 || (index !== 0 && index !== (ptsOnLine.length - 1)));
                        })
                        .value();
                    console.log(lines.length);

                    let DISTANCE = 0.01;
                    let toPts = [];
                    _.map(lines, line => {
                        let ptsOnLine = line.geometry.coordinates;
                        toPts.push(ptsOnLine[0]);
                        let length = turf.length(line);
                        let num = parseInt(length / DISTANCE);
                        for (let i = 1; i < num; i++) {
                            let sliced = turf.lineSliceAlong(line, 0, i * DISTANCE);
                            toPts.push(sliced.geometry.coordinates[1]);
                        }
                    });
                    return drawGeojson(undefined, toPts, pt, 'rays');

                    // let multiLine = turf.featureCollection(lines);
                    // let polygons = turf.lineToPolygon(multiLine);
                    // let polygons = turf.polygonize(roadCenter);

                })
                .catch(e => {
                    console.log(e);
                    $.gritter.add({
                        title: 'Warning',
                        text: typeof e === 'object' ? JSON.stringify(e) : e,
                        sticky: false,
                        time: 1000
                    })
                });
        }


        let primitivesVM = {
            layers: []
        };
        let viewModel = {
            geojsonLayers: [],
            selectedDataSource: null,
            raise: (layer, index) => {
                dataSources.raise(layer);
                updateLayerList();
            },
            lower: (layer, index) => {
                dataSources.lower(layer);
                updateLayerList();
            },
            canRaise: (layer, index) => {
                return index > 0;
            },
            canLower: (layer, index) => {
                return index >= 0 && index < dataSources.length - 1;
            },
            // onRightClick: function (dataSource, event) {
            //     this.selectedDataSource = dataSource;
            //     console.log(this, event);

            //     $('#context-menu').css({
            //         top: event.offsetY,
            //         left: event.offsetX
            //     })
            //     $('#context-menu').show();
            // }
        };

        // $('html').click((event) => {
        //     if (event.button === 0) {
        //         $('#context-menu').hide();
        //     }
        // })

        $('#change-color').click(event => {
            let dataSource = viewModel.selectedDataSource;
            let entities = _.get(dataSource, 'entities.values');
            if (entities) {
                let color = Cesium.Color.fromRandom({
                    alpha: .996
                });
                let polyType = dataSource.ftype === 'LineString' ? 'polyline' :
                    dataSource.ftype === 'MultiPolygon' || dataSource.ftype === 'Polygon' ? 'polygon' :
                    dataSource.ftype === 'MultiPoint' || dataSource.ftype === 'Point' ? 'point' :
                    '';
                if (polyType !== '') {
                    _.map(entities, entity => {
                        let name = entity.name;
                        if (polyType === 'point') {
                            entity.billboard = undefined;
                            entity.point = new Cesium.PointGraphics({
                                color: color,
                                pixelSize: 10
                            });
                        } else if (polyType === 'polygon') {
                            entity.polygon.material = color;
                            entity.polygon.outline = false;
                        } else if (polyType === 'polyline') {
                            entity.polyline.material = color;
                            entity.polyline.width = 5;
                        }
                    });
                }
            }

        });

        $('#load-default').click(e => {
            loadDefault();
        });

        $('#load-result').click(e => {
            if (hasLoadResult) {
                return;
            }
            load('N_result.json')
                .then(json => {
                    let brush = new Brush(json.geojson);

                    function addPrimitiveLayer(level) {
                        let primitive = brush.paint(level);
                        primitive.name = 'N_' + level;
                        primitives.add(primitive);

                        // function updatePrimitiveLayers() {
                        let numLayers = primitives.length;
                        primitivesVM.layers.splice(0, primitivesVM.layers.length);
                        for (let i = numLayers - 1; i >= 0; --i) {
                            let tempPrimitive = primitives.get(i);
                            tempPrimitive.name === undefined ? tempPrimitive.name = '' : '';
                            // console.log(tempPrimitive.name);
                            primitivesVM.layers.push(tempPrimitive);
                        }
                        // }
                        // updatePrimitiveLayers();
                    }
                    addPrimitiveLayer(5);
                    addPrimitiveLayer(10);
                    addPrimitiveLayer(20);

                    hasLoadResult = true;
                    return Promise.resolve(json);
                })
                .then(drawGeojson)
                .then(() => {
                    if (dataSources.length) {
                        viewer.zoomTo(dataSources.get(0));
                    }
                })
                .catch(e => {
                    $.gritter.add({
                        title: 'Warning',
                        text: typeof e === 'object' ? JSON.stringify(e) : e,
                        sticky: false,
                        time: 1000
                    })
                })
        });

        Cesium.knockout.track(primitivesVM);
        Cesium.knockout.applyBindings(primitivesVM, $('#primitive-layers')[0])
        Cesium.knockout.track(viewModel);
        Cesium.knockout.applyBindings(viewModel, $('#geojson-layers')[0]);
    }
})