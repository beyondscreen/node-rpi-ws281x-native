var ws281x = require('../lib/ws281x-native');

var NUM_LEDS = parseInt(process.argv[2], 10) || 10,
        pixelData = new Uint32Array(NUM_LEDS);

ws281x.init(NUM_LEDS);

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  ws281x.reset();
  process.nextTick(function () { process.exit(0); });
});

for(var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = 0xffcc22;
}
ws281x.render(pixelData);

// ---- animation-loop
var t0 = Date.now();
setInterval(function () {
    var dt = Date.now() - t0;

    ws281x.setBrightness(
        Math.floor(Math.sin(dt/1000) * 128 + 128));
}, 1000 / 30);

console.log('Press <ctrl>+C to exit.');
