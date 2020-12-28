//const rpiVersion = require('rpi-version');

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
  const stub = {
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
 /** rpi-version does not work with RPI 4 */
  // if (!rpiVersion()) {
  //   console.warn(
  //     '[rpi-ws281x-native] Could not verify raspberry-pi ' +
  //       'version. If this is wrong and you are running this on a ' +
  //       'raspberry-pi, please file a bug-report at ' +
  //       '  https://github.com/beyondscreen/node-rpi-ws281x-native/issues\n' +
  //       'A non-functional stub of this modules interface will be ' +
  //       'returned.'
  //   );

  //   return stub;
  // }

  return require('bindings')('rpi_ws281x.node');
};
