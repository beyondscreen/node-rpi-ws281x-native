var EventEmitter = require('events').EventEmitter;

function getNativeBindings() {
    // the native module might even be harmful (or won't work in the best case)
    // in the wrong environment, so we make sure that at least everything we can
    // test for matches the raspberry-pi before loading the native-module
    if(process.arch === 'arm' || process.platform === 'linux') {

        // will only work on RPi1 (Broadcom BCM2708) and RPi2 (BCM2709) and
        // this is the best check i could come up with to see which one we are
        // dealing with.
        var raspberryVersion = (function() {
            var cpuInfo = require('fs').readFileSync('/proc/cpuinfo').toString(),
                socFamily = cpuInfo.match(/hardware\s*:\s*(bcm270[89])/i);

            if(!socFamily) { return 0; }

            switch(socFamily[1].toLowerCase()) {
                case 'bcm2708': return 1;
                case 'bcm2709': return 2;
                default: return 0;
            }
        } ());

        switch(raspberryVersion) {
            case 1: case 2:
                return require('./binding/rpi_ws281x.node');

            default:
                process.stderr.write(
                    '[rpi-ws281x-native] it looks like you are not running ' +
                    'on a raspberry pi so there will be no functionality ' +
                    'exposed by this module. For convenience, ' +
                    'implementation stubs are provided.\n'
                );

                return {
                    init: function() {},
                    render: function() {},
                    reset: function() {}
                };

        }
    }

    return null;
}

var bindings = getNativeBindings();


/**
 * gamma-correction: remap color-values (provided as 0x00rrbbgg) with a
 * gamma-factor. Gamma-value and formula are taken from
 * http://rgb-123.com/ws2812-color-output/
 *
 * @type function(number): number
 */
var gammaCorrect = (function() {
    var _gamma = 1/0.45;
    var _gammaTable = new Uint8Array(256);

    for(var i=0; i<256; i++) {
        _gammaTable[i] = Math.floor(Math.pow(i / 255, _gamma) * 255 + 0.5);
    }

    return function gammaCorrect(color) {
        return (
            _gammaTable[color & 0xff]
            | (_gammaTable[(color >> 8) & 0xff] << 8)
            | (_gammaTable[(color >> 16) & 0xff] << 16)
        );
    };
} ());


/**
 * remap pixel-positions according to the specified index-mapping.
 *
 * @type function(Uint32Array, Array.<Number>): Uint32Array
 */
var remap = (function() {
    var _tmpData = null;

    return function remap(data, indexMapping) {
        if(!_tmpData) {
            _tmpData = new Uint32Array(data.length);
        }

        _tmpData.set(data);

        for(var i=0; i<data.length; i++) {
            data[i] = gammaCorrect(_tmpData[indexMapping[i]]);
        }

        return data;
    };
} ());



var ws281x = new EventEmitter();
var _indexMapping = null;
var _isInitialized = false;


// ---- EXPORTED INTERFACE

/**
 * configures PWM and DMA for sending data to the LEDs
 *
 * @param {Number} numLeds  number of LEDs to be controlled
 * @param {?Object} options  (acutally only tested with default-values)
 *                           intialization-options for the library
 *                           (PWM frequency, DMA channel, GPIO, Brightness)
 */
ws281x.init = function(numLeds, options) {
    _isInitialized = true;
    bindings.init(numLeds, options);
};


/**
 * register a mapping to manipulate array-indices within the
 * data-array before rendering.
 *
 * @param {Array.<Number>} mapping  the mapping, indexed by destination.
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
    if(!_isInitialized) {
        throw new Error('render called before initialization.');
    }

    this.emit('beforeRender', data);

    if(_indexMapping) {
        data = remap(data, _indexMapping);
    }

    for(var i=0; i<data.length; i++) {
        data[i] = gammaCorrect(data[i]);
    }

    bindings.render(data);
    this.emit('render', data);

    return data;
};

/**
 * clears all LEDs, resets the PWM and DMA-parts and deallocates
 * all internal structures.
 */
ws281x.reset = function() {
    bindings.reset();
};

module.exports = ws281x;
