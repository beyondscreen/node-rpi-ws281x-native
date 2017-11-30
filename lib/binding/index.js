/**
 * @return {{
 *   setParam: function(param: Number, value: Number): void,
 *   setChannelParam: function(channel: Number, param: Number, value: Number): void,
 *   setChannelData: function(channel: Number, data: Buffer): void,
 *   init: function(): void,
 *   render: function(): void,
 *   finalize: function(): void
 * }}
 */
module.exports = function getNativeBindings() {
  var stub = {
    setParam: function() {},
    setChannelParam: function() {},
    setChannelData: function() {},
    init: function() {},
    render: function() {},
    finalize: function() {}
  };

  if (!process.getuid || process.getuid() !== 0) {
    console.warn(
      '[rpi-ws281x-native] This module requires being run ' +
        'with root-privileges. A non-functional stub of the ' +
        'interface will be returned.'
    );

    return stub;
  }

  // the native module might even be harmful (or won't work in the best case)
  // in the wrong environment, so we make sure that at least everything we can
  // test for matches the raspberry-pi before loading the native-module
  if (process.arch !== 'arm' && process.platform !== 'linux') {
    console.warn(
      '[rpi-ws281x-native] It looks like you are not ' +
        'running on a raspberry pi. This module will not work ' +
        'on other platforms. A non-functional stub of the ' +
        'interface will be returned.'
    );

    return stub;
  }

  // determine rapsberry-pi version based on SoC-family. (note: a more
  // detailed way would be to look at the revision-field from cpuinfo, see
  // http://elinux.org/RPi_HardwareHistory)
  var raspberryVersion = (function() {
    var cpuInfo = require('fs')
        .readFileSync('/proc/cpuinfo')
        .toString(),
      socFamily = cpuInfo.match(/hardware\s*:\s*(bcm\d+)/i);

    if (!socFamily) {
      return 0;
    }

    switch (socFamily[1].toLowerCase()) {
      case 'bcm2708':
        return 1;
      case 'bcm2835':
        return 1;
      case 'bcm2709':
        return 2;
      default:
        return 0;
    }
  })();

  if (raspberryVersion === 0) {
    console.warn(
      '[rpi-ws281x-native] Could not verify raspberry-pi ' +
        'version. If this is wrong and you are running this on a ' +
        'raspberry-pi, please file a bug-report at ' +
        '  https://github.com/beyondscreen/node-rpi-ws281x-native/issues\n' +
        'A non-functional stub of this modules interface will be ' +
        'returned.'
    );

    return stub;
  }

  return require('./rpi_ws281x.node');
};
