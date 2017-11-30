var EventEmitter = require('events').EventEmitter;
var getNativeBindings = require('./bindings');

var bindings = getNativeBindings();

const stripType = {
  // 4 color R, G, B and W ordering
  SK6812_RGBW: 0x18100800,
  SK6812_RBGW: 0x18100008,
  SK6812_GRBW: 0x18081000,
  SK6812_GBRW: 0x18080010,
  SK6812_BRGW: 0x18001008,
  SK6812_BGRW: 0x18000810,

  // 3 color R, G and B ordering
  WS2811_RGB: 0x00100800,
  WS2811_RBG: 0x00100008,
  WS2811_GRB: 0x00081000,
  WS2811_GBR: 0x00080010,
  WS2811_BRG: 0x00001008,
  WS2811_BGR: 0x00000810,

  // predefined fixed LED types
  WS2812: 0x00081000, // WS2811_STRIP_GRB,
  SK6812: 0x00081000, // WS2811_STRIP_GRB,
  SK6812W: 0x18080010 // SK6812_STRIP_GRBW
};

const stripTypeIds = {
  // 4 color R, G, B and W ordering
  'sk6812-rgbw': stripType.SK6812_RGBW,
  'sk6812-rbgw': stripType.SK6812_RBGW,
  'sk6812-grbw': stripType.SK6812_GRBW,
  'sk6812-gbrw': stripType.SK6812_GBRW,
  'sk6812-brgw': stripType.SK6812_BRGW,
  'sk6812-bgrw': stripType.SK6812_BGRW,

  // 3 color R, G and B ordering
  'ws2811-rgb': stripType.WS2811_RGB,
  'ws2811-rbg': stripType.WS2811_RBG,
  'ws2811-grb': stripType.WS2811_GRB,
  'ws2811-gbr': stripType.WS2811_GBR,
  'ws2811-brg': stripType.WS2811_BRG,
  'ws2811-bgr': stripType.WS2811_BGR,

  // predefined fixed LED types
  ws2812: stripType.WS2812,
  sk6812: stripType.SK6812,
  sk6812w: stripType.SK6812W
};

const PARAM_FREQ = 1; // before init / both channels
const PARAM_DMANUM = 2; // before init / both channels
const PARAM_GPIONUM = 3; // before init / per channel
const PARAM_COUNT = 4; // before init / per channel
const PARAM_INVERT = 5; // before init / per channel
const PARAM_BRIGHTNESS = 6; // anytime / per channel
const PARAM_STRIP_TYPE = 7; // before init / per channel

const paramCodes = {
  freq: PARAM_FREQ,
  dmanum: PARAM_DMANUM,
  gpionum: PARAM_GPIONUM,
  count: PARAM_COUNT,
  invert: PARAM_INVERT,
  brightness: PARAM_BRIGHTNESS,
  stripType: PARAM_STRIP_TYPE
};

const channelDefaults = [
  {count: 0, gpio: 18, invert: 0, brightness: 255, stripType: 'ws2812'},
  {count: 0, gpio: 18, invert: 0, brightness: 255, stripType: 'ws2812'}
];

const channels = [];

/**
 * Initialize the library.
 * @param {Object} params
 */
function init(params) {
  const {dmanum = 10, freq = 800000, channels: channelsConfig = []} = params;

  bindings.setParam(paramCodes.dmanum, dmanum);
  bindings.setParam(paramCodes.freq, freq);

  channelsConfig.forEach((channelParams, channelId) => {
    const params = Object.assign({}, channelDefaults[channelId], channelParams);

    setNamedParams(channelId, params);

    const channel = Object.assign({}, params, {
      _brightness: params.brightness,
      buffer: params.count > 0 ? new Buffer(params.count) : null
    });

    Object.defineProperty(channel, 'brightness', {
      enumerable: true,
      configurable: false,
      writable: true,

      get() {
        return channel._brightness;
      },

      set(value) {
        setNamedParam(channelId, 'brightness', value);
        channel._brightness = value;
      }
    });

    channels[channelId] = channel;
  });

  return channels;
}

function setNamedParams(channelId, params) {
  Object.keys(params).forEach(paramName => {
    setNamedParam(channelId, paramName, params[paramName]);
  });
}

function setNamedParam(channelId, paramName, value) {
  bindings.setChannelParam(channelId, paramCodes[paramName], value);
}

module.exports = {
  init,
  channels,
  stripType
};
