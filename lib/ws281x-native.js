const bindings = require('./get-native-bindings')();
const {stripType, stripTypeIds, paramCodes} = require('./constants');

const MAX_CHANNELS = 2;
const DEFAULT_DMA = 5;
const DEFAULT_FREQ = 800000;
const DEFAULT_STRIP_TYPE = stripType.WS2812;

// for GPIO-numbers see for example https://pinout.xyz/
const CHANNEL_DEFAULTS = [
  {
    count: 0,
    gpio: 18,
    invert: 0,
    brightness: 255,
    stripType: DEFAULT_STRIP_TYPE
  },
  {
    count: 0,
    gpio: 13,
    invert: 0,
    brightness: 255,
    stripType: DEFAULT_STRIP_TYPE
  }
];
const channels = Array(2);

// private members for channel-instances
const _id = Symbol('_id');
const _params = Symbol('_params');
const _update = Symbol('_update');
const _init = Symbol('_init');
const _reset = Symbol('_reset');

class Channel {
  /**
   * @param {number} channelId
   * @param {ChannelParams} params
   */
  constructor(channelId, params) {
    const ledCount = params.count;

    // private properties
    this[_id] = channelId;
    this[_params] = params;

    // public/readonly properties
    Object.defineProperties(this, {
      count: {
        value: params.count,
        writable: false,
        enumerable: true,
        configurable: false
      },
      stripType: {
        value: params.stripType,
        writable: false,
        enumerable: true,
        configurable: false
      },
      invert: {
        value: params.invert,
        writable: false,
        enumerable: true,
        configurable: false
      },
      gpio: {
        value: params.gpio,
        writable: false,
        enumerable: true,
        configurable: false
      }
    });

    // public properties
    this.brightness = params.brightness;
    this.buffer = null;
    this.array = null;

    if (ledCount > 0) {
      const arrayBuffer = new ArrayBuffer(ledCount * 4); // 0xWWRRGGBB

      // buffer and array are different ways to access the same data
      this.buffer = Buffer.from(arrayBuffer);
      this.array = new Uint32Array(arrayBuffer);
    }
  }

  /**
   * Resets this channel, setting all LEDs to black.
   */
  [_reset]() {
    if (!this.array) { 
      return; 
    }
    
    this.array.fill(0);
  }

  /**
   * Sends values for all parameters to the library.
   * @private
   */
  [_init]() {
    Object.keys(this[_params]).forEach(paramName => {
      const value = this[_params][paramName];
      const code = paramCodes[paramName];

      bindings.setChannelParam(this[_id], code, value);
    });
  }

  /**
   * Sends the current state of the buffer and the current brightness-value
   * to the library.
   * @private
   */
  [_update]() {
    if (this.buffer === null) {
      return;
    }

    bindings.setChannelParam(this[_id], paramCodes.brightness, this.brightness);
    bindings.setChannelData(this[_id], this.buffer);
  }
}

/**
 * Initializes the library.
 * @param {FullParams} params
 * @return {Channel[]} the initialized channel-instances
 */
function init(params) {
  // FIXME: validate params
  const {
    dma = DEFAULT_DMA,
    freq = DEFAULT_FREQ,
    channels: channelsConfig = []
  } = params;

  // send global parameter values
  bindings.setParam(paramCodes.dma, dma);
  bindings.setParam(paramCodes.freq, freq);

  // setup channels
  for (let channelId = 0; channelId < MAX_CHANNELS; channelId++) {
    const userParams = channelsConfig[channelId];
    const defaults = CHANNEL_DEFAULTS[channelId];

    const params = Object.assign({}, defaults, userParams);

    if (typeof params.stripType === 'string') {
      params.stripType = stripTypeIds[params.stripType];
    }

    channels[channelId] = new Channel(channelId, params);
  }

  channels.forEach(channel => channel[_init]());
  bindings.init();

  return channels;
}

/**
 * Submits the current state of the channel-buffers to the driver for rendering.
 */
function render() {
  channels.forEach(channel => channel[_update]());
  bindings.render();
}

/**
 * resets all color-values of all channels and renders.
 */
function reset() {
  channels.forEach(channel => channel[_reset]());
  render();
}

/**
 * Shuts down the library, freeing allocated memory and resources.
 * This should always be called when terminating the program.
 */
function finalize() {
  bindings.finalize();
}

/**
 * Simple initializer for single-channel usage.
 * @param {number} numLeds number of LEDs
 * @param {CombinedParams} options additional options.
 * @return {Channel}
 */
module.exports = function(numLeds, options = {}) {
  const {
    dma = DEFAULT_DMA,
    freq = DEFAULT_FREQ,
    gpio = 18,
    invert = false,
    brightness = 255,
    stripType = DEFAULT_STRIP_TYPE
  } = options;

  const channelOptions = {count: numLeds, gpio, invert, brightness, stripType};
  const [channel] = init({dma, freq, channels: [channelOptions]});

  // for convenience, make methods available via the channel-instance
  channel.render = render;
  channel.finalize = finalize;

  return channel;
};

Object.assign(module.exports, {
  init,
  render,
  reset,
  finalize,
  stripType
});

/**
 * @typedef {object} FullParams
 * @property {number} dma  the DMA-number
 * @property {number} freq  the PWM-frequency in Hz
 * @property {ChannelParams[]} channels The channel configurations.
 */

/**
 * @typedef {object} ChannelParams
 * @property {number} count  number of LEDs on this channel
 * @property {number} gpio  the GPIO port-number the LEDs connect to
 * @property {boolean} invert  true to invert the output-signal (if you are
 *     using an inverting level-shifter for example)
 * @property {number} brightness  initial brightness for the channel
 * @property {number|string} stripType  the strip-type (see ./constants.js)
 */

/**
 * @typedef {object} CombinedParams
 * @extends ChannelParams
 * @property {number} dma
 * @property {number} freq
 */
