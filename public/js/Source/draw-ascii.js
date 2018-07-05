define(function(require) {
    let $ = require('jquery');
    require(['jquery.csv']);
    let Cesium = require('Cesium');
    let _ = require('lodash');

    let Vertex = require('Plugins/Vertex');
    let Triangle = require('Plugins/Triangle');
    let MultiColorTriangleGeometry = require('MultiColorTriangle/MultiColorTriangleGeometry');
    let MultiColorTriangleAppearance = require('MultiColorTriangle/MultiColorTriangleAppearance');
    let Util = require('Util/Util');
    let ColorScheme = require('Core/ColorScheme');
    let SchemeType = require('Core/SchemeType');
    let proj4js = require('Core/Projection');
    let Projection = new proj4js({
        projectionString: "ESRI:102696"
    });

    function generateCesiumTriangles(matrix, level) {
        let triangles = [];
        let verticesHashTable = {};
        let pName = 'N_' + level;
        let pts = _.flatten(matrix);
        let ptsF = _.filter(pts, pt => pt[pName] !== 0);
        let min = _.minBy(ptsF, pName)[pName];
        let max = _.maxBy(ptsF, pName)[pName];

        let west = _.minBy(ptsF, 'x').x;
        let south = _.minBy(ptsF, 'y').y;
        let east = _.maxBy(ptsF, 'x').x;
        let north = _.maxBy(ptsF, 'y').y;
        let extent = Cesium.Rectangle.fromDegrees(west, south, east, north);
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;
        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

        let ribbon = new ColorRibbon({
            min: min,
            max: max,
            colors: [
                Cesium.Color.fromCssColorString('#48ee4c'),
                Cesium.Color.fromCssColorString('#48eed8'),
                Cesium.Color.fromCssColorString('#48a2ee'),
                Cesium.Color.fromCssColorString('#5748ee'),
                Cesium.Color.fromCssColorString('#b548ee'),
                Cesium.Color.fromCssColorString('#ee48c5'),
                Cesium.Color.fromCssColorString('#ff0000'),
            ],
            noDataV: 0,
            noDataColor: Cesium.Color.fromCssColorString('#48ee4c')
        });

        _.map(matrix, (row, i) => {
            _.map(row, (td, j) => {
                if(matrix[i][j][pName] !== 0 && i< matrix.length-1 && j< matrix[0].length-1) {
                    let UL = new Cesium.Cartesian3(matrix[i][j].x, matrix[i][j].y, parseInt(level));
                    let LL = new Cesium.Cartesian3(matrix[i+1][j].x, matrix[i+1][j].y, parseInt(level));
                    let UR = new Cesium.Cartesian3(matrix[i][j+1].x, matrix[i][j+1].y, parseInt(level));
                    let LR = new Cesium.Cartesian3(matrix[i+1][j+1].x, matrix[i+1][j+1].y, parseInt(level));

                    let vertUL = getVertex(verticesHashTable, matrix, j, i, UL, ribbon, level);
                    let vertUR = getVertex(verticesHashTable, matrix, j + 1, i, UR, ribbon, level);
                    let vertLL = getVertex(verticesHashTable, matrix, j, i + 1, LL, ribbon, level);
                    let vertLR = getVertex(verticesHashTable, matrix, j + 1, i + 1, LR, ribbon, level);
                    
                    triangles.push(new Triangle({
                        vertices: [vertUL, vertLL, vertLR]
                    }));

                    triangles.push(new Triangle({
                        vertices: [vertUL, vertLR, vertUR]
                    }));
                }
            });
        })

        return new Cesium.Primitive({
            geometryInstances : new Cesium.GeometryInstance({
                geometry : MultiColorTriangleGeometry.createGeometry(new MultiColorTriangleGeometry({
                    triangles : triangles
                }))
            }),
            appearance : new MultiColorTriangleAppearance()
        });
    }

    // put vertex in a hash table
    function getVertex(verticesHashTable,matrix, x, y, position, ribbon, level) {
        //test if vertices exist in the hash table yet
        if (!(x in verticesHashTable)) {
            verticesHashTable[x] = {};
        }

        if (!(y in verticesHashTable[x])) {
            verticesHashTable[x][y] = new Vertex({
                vertexFormat: Cesium.VertexFormat.POSITION_AND_COLOR,
                position: Cesium.Cartesian3.fromDegrees(position.x, position.y, position.z),
                color: ribbon.getColor(matrix[y][x]['N_' + level])
            });
        }
        return verticesHashTable[x][y];
    }

    function getPoints(geojson) {
        let ftype = _.get(geojson, 'features[0].geometry.type');
        if(ftype === 'Point') {
            let features = geojson.features;
            let nrow = 75;
            let ncol = 119;
            let matrix = [];
            for(let i = 0;i< nrow; i++) {
                matrix.push([]);
            }
            let pts = _.map(features, (feature, i) => {
                pt = {
                    x: feature.geometry.coordinates[0],
                    y: feature.geometry.coordinates[1],
                    N_5: feature.properties['N_5'],
                    N_10: feature.properties['N_10'],
                    N_20: feature.properties['N_20']
                };
                matrix[parseInt(i/ncol)].push(pt);
            });
            return matrix;
        }
        else {
            return undefined;
        }
    }

    function ColorRibbon(schema) {
        this.schema = {
            min: schema.min,
            max: schema.max,
            colors: schema.colors,
            mode: schema.mode,
            noDataV: schema.noDataV,
            noDataColor: schema.noDataColor
        };
        

        this.getColor = function (v) { 
            if(v === this.schema.noDataV) {
                // return this.schema.noDataColor? this.schema.noDataColor: Cesium.Color.fromCssColorString('#000000');
                return Cesium.Color.fromCssColorString('#48ee4c');
            }
            let segNum = this.schema.colors.length - 1;
            let lengthPerSeg = (this.schema.max - this.schema.min) / segNum;
            let segIndex = parseInt((v - this.schema.min) / lengthPerSeg);
            let segPercent = (v - this.schema.min) % lengthPerSeg / lengthPerSeg;
            let colorA = this.schema.colors[segIndex];
            let colorZ = this.schema.colors[segIndex + 1];
            if(!colorZ) {
                // v === this.schema.max;
                return colorA;
            }

            // if(this.schema.mode === 'rgb' || this.schema.mode === undefined) {
                function getLinearColor(colorA, colorZ, segPercent) {
                    function getLinearFactor(colorA, colorZ, segPercent, factor) {
                        return (colorZ[factor] - colorA[factor]) * segPercent + colorA[factor];
                    }
                    let r = getLinearFactor(colorA, colorZ, segPercent, 'red');
                    let g = getLinearFactor(colorA, colorZ, segPercent, 'green');
                    let b = getLinearFactor(colorA, colorZ, segPercent, 'blue');
                    let a = getLinearFactor(colorA, colorZ, segPercent, 'alpha');
                    return new Cesium.Color(r, g, b, a);
                }
                return getLinearColor(colorA, colorZ, segPercent);
            // }
            // else if(this.schema.mode === 'hsl') {

            // }
        }
    }

    return function(geojson) {
        this.geojson = geojson;
        this.matrix = getPoints(geojson);
    
        this.paint = function(level) {
            return generateCesiumTriangles(this.matrix, level);
        }
    }
})