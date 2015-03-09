function getNativeBindings() {
    // the native module might even be harmful (or won't work in the best case)
    // in the wrong environment, so we make sure that at least everything we can
    // test for matches the raspberry-pi before loading the native-module
    if(process.arch === 'arm' || process.platform === 'linux') {
        var fs = require('fs');

        // will only work on the Broadcom BCM2708
        var isBCM2708 = (function() {
            var cpuInfo = fs.readFileSync('/proc/cpuinfo').toString();

            return /hardware\s*:\s*bcm2708/i.test(cpuInfo);
        } ());

        if(isBCM2708) {
            return require('./binding/rpi_ws281x.node');
        }
    }

    return null;
}


var ws281xNative = getNativeBindings();
if(!ws281xNative) {
    process.stderr.write(
        '[rpi-ws281x-native] it looks like you are not running the module ' +
        'on a raspberry pi. Will only return stubs for native ' +
        'interface-functions.\n'
    );

    ws281xNative = {
        init: function() {},
        render: function() {},
        reset: function() {}
    };
}



var _numLeds = 0,
    _indexMapping = null;


function remap(src, indexMapping) {
    var dest = new Uint32Array(src.length);

    for(var i=0; i<src.length; i++) {
        dest[i] = src[indexMapping[i]];
    }

    return dest;
}


module.exports = {
    /**
     *
     * @param numLeds
     * @param options
     */
    init: function(numLeds, options) {
        _numLeds = numLeds;

        ws281xNative.init(numLeds, options);
    },

    /**
     * registers an index-mapping.
     * Index: destination-index, Value: Source-Index
     *
     * @param {Array.<Number>} mapping
     */
    setIndexMapping: function(mapping) {
        _indexMapping = mapping;
    },

    /**
     *
     * @param data
     */
    render: function(data) {
        if(_indexMapping) {
            data = remap(data, _indexMapping);
        }

        ws281xNative.render(data);
    },

    /**
     *
     */
    reset: function() {
        ws281xNative.reset();
    }
};
