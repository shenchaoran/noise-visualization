//The build will inline common dependencies into this file.

//For any third party dependencies, like jQuery, place them in the lib folder.

//Configure loading modules from the lib directory,
//except for 'app' ones, which are in a sibling
//directory.
requirejs.config({
    paths: {
        Assets: '../Assets',
        Core: '../Core',
        Plugins: '../Plugins',
        Util: '../Util',
        MultiColorTriangle: '../Plugins/MultiColorTriangle/',
        jquery: 'Lib/jquery-1.10.2.min',
        "jquery.csv":'Lib/jquery.csv-0.71.min',
        Cesium: '../js/ThirdParty/Cesium/Cesium',
        proj4js: 'Lib/projLib',
        proj4: 'Lib/proj4',
        lodash: '../js/ThirdParty/lodash',
        'layer-switch': '../js/Source/layer-switch',
        'load-default': '../js/Source/load-default',
        gritter: '../js/ThirdParty/gritter/js/jquery.gritter',
        bluebird: '../js/ThirdParty/bluebird.min',
        DrawHelper: '../js/Source/DrawHelper',
        'draw-ascii': '../js/Source/draw-ascii',
        turf: 'Lib/turf.min'
    },
    shim: {
        Cesium: {
            exports: 'Cesium'
        },
        proj4js: {
            exports: 'proj4js'
        },
        "jquery.csv":['jquery']
    }
});
