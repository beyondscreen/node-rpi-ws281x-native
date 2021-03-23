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

const paramCodes = {
  freq: 1,
  dma: 2,
  gpio: 3,
  count: 4,
  invert: 5,
  brightness: 6,
  stripType: 7
};

module.exports = {paramCodes, stripTypeIds, stripType};
