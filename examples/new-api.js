const ws281x = require('../lib/ws281x-native');

const NUM_LEDS = parseInt(process.argv[2], 10) || 10;
const STRIP_TYPE = process.argv[3] || "ws2812";

const channels = ws281x.init({
  dma: 5,
  freq: 800000,
  channels: [{gpio: 18, count: NUM_LEDS, invert: false, stripType: STRIP_TYPE}]
});

const channel = channels[0];
const pixelData = channel.array;

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function() {
  ws281x.reset();
  process.nextTick(function() {
    process.exit(0);
  });
});

// ---- animation-loop
let offset = 0;
setInterval(function() {
  for (let i = 0; i < 3 * NUM_LEDS; i++) {
    pixelData[i] = colorwheel((offset + i) % 256);
  }

  offset = (offset + 1) % 256;
  //console.log(pixelData);
  ws281x.render();
}, 1000 / 30);

console.log('Press <ctrl>+C to exit.');

// rainbow-colors, taken from http://goo.gl/Cs3H0v
function colorwheel(pos) {
  pos = 255 - pos;

  if (pos < 85) {
    return rgb2Int(255 - pos * 3, 0, pos * 3);
  } else if (pos < 170) {
    pos -= 85;
    return rgb2Int(0, pos * 3, 255 - pos * 3);
  } else {
    pos -= 170;
    return rgb2Int(pos * 3, 255 - pos * 3, 0);
  }
}

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

function rgbw2Int(r, g, b, w) {
  return ((w & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}
