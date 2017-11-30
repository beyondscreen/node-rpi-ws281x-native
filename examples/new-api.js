const ws281x = require('../lib/ws281x-native');

ws281x.init({
  dmanum: 10,
  freq: 800,
  channels: [
    {gpionum: 18, count: 100, invert: true, stripType: 'ws2812'},
    {gpionum: 12, count: 12, invert: true, stripType: 'sk6812w'}
  ]
});

const channel = ws281x.channels[0];
const buffer = channel.buffer;

channel.brightness = 123;

// ... fill buffer with pixel-data

ws281x.render();

// alternative

ws281x.setBrightness(0, 240); // 1 param: set brightness for both channels
