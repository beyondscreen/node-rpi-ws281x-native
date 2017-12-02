const bindings = require('./get-native-bindings')();
const {stripType, stripTypeIds, paramCodes} = require('./constants');

const MAX_CHANNELS = 2;

// for GPIO-numbers see for example https://pinout.xyz/
const CHANNEL_DEFAULTS = [
  {count: 0, gpio: 18, invert: 0, brightness: 255, stripType: stripType.WS2812},
  {count: 0, gpio: 13, invert: 0, brightness: 255, stripType: stripType.WS2812}
];
const channels = Array(2);

// private members for channel-instances
const _update = Symbol('_update');
const _init = Symbol('_init');
const _reset = Symbol('_reset');

class Channel {
  constructor(channelId, params) {
    const ledCount = params.count;

    this.id = channelId;
    this.params = params;
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
   * Sends values for all parameters to the library.
   * @private
   */
  [_init]() {
    Object.keys(this.params).forEach(paramName => {
      const value = this.params[paramName];
      const code = paramCodes[paramName];

      bindings.setChannelParam(this.id, code, value);
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

    bindings.setChannelParam(this.id, paramCodes.brightness, this.brightness);
    bindings.setChannelData(this.id, this.buffer);
  }

  /**
    sets all pixels black
  */
  [_reset](){
    if (this.buffer === null) {
      return;
    }

    for(var i=0;i<this.array.length;i++){
      this.array[i] = 0;
    }
    bindings.setChannelParam(this.id, paramCodes.brightness, this.brightness);
    bindings.setChannelData(this.id, this.buffer);
  }
}

/**
 * Initializes the library.
 * @param {Object} params
 * @returns {Channel[]} the initialized channel-instances
 */
function init(params) {
  // FIXME: validate params
  const {dma = 5, freq = 800000, channels: channelsConfig = []} = params;

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
 * Shuts down the library, freeing allocated memory and resources.
 * This should always be called when terminating the program.
 */
function finalize() {
  bindings.finalize();
}

function reset(){
  channels.forEach(channel => channel[_reset]());
  bindings.render();
}

module.exports = {
  init,
  render,
  finalize,
  reset,
  channels,
  stripType
};
