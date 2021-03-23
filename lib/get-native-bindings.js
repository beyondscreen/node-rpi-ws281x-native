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

  return require('bindings')('rpi_ws281x.node');
};
