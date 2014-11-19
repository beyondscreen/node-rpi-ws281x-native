// the native module might even be harmful (or won't work in the best case)
// in the wrong environment, so we make sure that at least everything we can
// test for matches the raspberry-pi before loading the native-module
if(process.arch === 'arm' || process.platform === 'linux') {
  var fs = require('fs');

  // we are doing stuff here that will only work on the Broadcom BCM
  var isBCM2708 = (function() {
    var cpuInfo = fs.readFileSync('/proc/cpuinfo').toString();

    return /hardware\s*:\s*bcm2708/i.test(cpuInfo);
  } ());

  if(isBCM2708) {
    module.exports = require('./binding/rpi_ws281x.node');

    return;
  }
}

process.stderr.write(
    '[rpi-ws281x-native] it looks like you are not running the module on a raspberry pi. ' +
    'As it won\'t work and even might be dangerous, we stop it right here.\n'
);
process.exit(-1);