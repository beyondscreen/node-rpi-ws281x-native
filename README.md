# control ws281x-LEDs with node.js

> if you happen to know C++ and node/V8, I would really appreciate any help and feedback on this module.
> There is certainly lots of room for improvement.

This module provides native bindings to the [rpi_ws281x](https://github.com/jgarff/rpi_ws281x)
library by Jeremy Garff to provide a very basic set of functions to write data to a strip of
ws2811/ws2812 LEDs. **will only run on the Raspberry Pi.**

## setup

this module is available via npm:

    npm install rpi-ws2812-native

if you prefer installing from source:

    npm install -g node-gyp
    git clone --recursive https://github.com/raspberry-node/node-rpi-ws281x-native.git
    cd rpi-ws281x-native
    node-gyp rebuild


## usage

this module exports only three functions to send data to the LED-String.

```javascript
exports = {
    /**
     * configures PWM and DMA for sending data to the LEDs
     *
     * @param numLeds {Number}  number of LEDs to be controlled
     * @param [options] {Object}  (acutally only tested with default-values)
     *                            intialization-options for the library
     *                            (PWM frequency, DMA channel, GPIO)
     */
    init: function(numLeds, options) {},

    /**
     * send data to the LED-strip.
     *
     * @param data {Uint32Array}  the pixel-data, 24bit per pixel in
     *                            RGB-format (0xff0000 is red).
     */
    render: function(data) {},

    /**
     * clears all LEDs, resets the PWM and DMA-parts and deallocates
     * all internal structures.
     */
    reset: function() {}
};
```

## testing basic functionality

connect the WS2812-strip to the raspberry-pi as described [here](https://learn.adafruit.com/neopixels-on-raspberry-pi/wiring)
and run the command `node examples/rainbow.js <numLeds>`.
You should now see some rainbow-colors animation on the LED-strip.


## hardware

There is a guide [over at adafruit.com](https://learn.adafruit.com/neopixels-on-raspberry-pi) on how
to get the hardware up and running. Essentially, you need the Raspberry Pi, a logic-level converter
to shift the output-voltage of the GPIO from 3.3V up to 5V (should be fast enough to handle 800kHz,
the guide mentions the 74AHCT125, mine is an 74HCT125N) and of course an LED-Strip or other types of WS2812-LEDs.

To connect all that together, I'd recommend buying a small breadboard and some jumper-wires.
Also, consider buing a 5V power-supply that can deliver up to 60mA per LED (so you'll need 6A to fully power 100 LEDs).
For smaller applications, a decent USB-charger should do.

You can buy everything you need at adafruit or any other electronics reseller
(germany: check [conrad electronic](http://www.conrad.de) or [watterott](http://watterott.com) – this is
where i bought most of my stuff).