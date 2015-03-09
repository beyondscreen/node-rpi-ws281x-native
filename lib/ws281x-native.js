var EventEmitter = require('events').EventEmitter;

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


// fallback to empty stub-functions if not on RPi.
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


var ws281x = new EventEmitter();

/**
 * configures PWM and DMA for sending data to the LEDs
 *
 * @param {Number} numLeds  number of LEDs to be controlled
 * @param {?Object} options  (acutally only tested with default-values)
 *                           intialization-options for the library
 *                           (PWM frequency, DMA channel, GPIO, Brightness)
 */
ws281x.init = function(numLeds, options) {
    _numLeds = numLeds;

    ws281xNative.init(numLeds, options);
};

/**
 * register a mapping to manipulate array-indices within the
 * data-array before rendering.
 *
 * @param {Array.<Number>} map  the mapping, indexed by destination.
 */
ws281x.setIndexMapping = function(mapping) {
    _indexMapping = mapping;
};

/**
 * send data to the LED-strip.
 *
 * @param {Uint32Array} data  the pixel-data, 24bit per pixel in
 *                            RGB-format (0xff0000 is red).
 * @return {Uint32Array} data as it was sent to the LED-strip
 */
ws281x.render = function(data) {
    this.emit('beforeRender', data);

    if(_indexMapping) {
        data = remap(data, _indexMapping);
    }

    ws281xNative.render(data);
    this.emit('render', data);

    return data;
};

/**
 * clears all LEDs, resets the PWM and DMA-parts and deallocates
 * all internal structures.
 */
ws281x.reset = function() {
    ws281xNative.reset();
};

module.exports = ws281x;
