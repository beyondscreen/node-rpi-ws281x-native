# control ws281x-LEDs with node.js

**NOTE: This will only ever work on the Raspberry Pi.**

This module provides native bindings to the
[rpi_ws281x](https://github.com/jgarff/rpi_ws281x) library by Jeremy Garff
that is used to control strips of individually addressable LEDs directly
from a raspberry-pi. Supported are all LEDs of the NEOPIXEL/WS281x-family
(specifically WS2811, WS2812, WS2812b, SK6812, SK6812W in all variations).

## setup

this module is available via npm:

    npm install rpi-ws281x-native

if you prefer installing from source:

    npm install -g node-gyp
    git clone --recursive https://github.com/beyondscreen/node-rpi-ws281x-native.git
    cd rpi-ws281x-native
    npm install


## node-version

You will need an up-to-date version of nodejs that supports at least some es6-features (>= 6.5).

If you are running on a RaspberryPi 1 or zero (running an ARMv61 processor),
you might need to download and install the nodejs-binaries manually.
Head over to https://nodejs.org/dist, find the version to install and download the `-armv61`-version.

See here for more information: https://raspberrypi.stackexchange.com/questions/48303/install-nodejs-for-all-raspberry-pi

## Usage Example

This is the simplest example that will actually do something.
It will initialize the driver for 100 LEDs and set all LEDs to the
same, pinkish color:

```javascript
const ws281x = require('rpi-ws281x-native');

const channel = ws281x(100, { stripType: 'ws2812' });

const colorArray = channel.array;
for (let i = 0; i < channel.count; i++) {
  colorsArray[i] = 0xffcc22;
}

ws281x.render();
```


## API

### `ws281x(numLeds: number, options = {}): Channel`

For simple setups (i.e. those using just one channel), there is an easy
way for initialization using the top-level export function.

#### Example:

```javascript
const ws2821x = require('rpi-ws281x-native');
const options = {
  dma: 10,
  freq: 800000,
  gpio: 18,
  invert: false,
  brightness: 255,
  stripType: ws281x.stripType.WS2812
};

const channel = ws281x(20, options);
const colors = channel.array;

// update color-values
colors[42] = 0xffcc22;
ws281x.render();
```

This function takes two parameters, the number of LEDs (`numLeds`) and an `options`-object
which is entirely optional. These options combine the channel-options and
the global option from the init-function as described below.

The returned object is a channel object (also described below) that gives
access to the color-data.


### `ws281x.init(options: Object): Channel[]`

Configures and initializes the drivers and returns an array of channel-interfaces.

#### Example:

```javascript
const ws2821x = require('rpi-ws281x-native');

const channels = ws281x.init({
  dma: 10,
  freq: 800000,
  channels: [
    {count: 20, gpio: 18, invert: false, brightness: 255, stripType: 'ws2812'},
    {count: 20, gpio: 13, invert: false, brightness: 128, stripType: 'sk6812-rgbw'}
  ]
});
```

The only parameter `options` is an object with the following properties (unspecified properties will use the default-value):

 - `dma: number`: the dma-number to use for the driver's data-transport to the LEDs (default: `10`)

 - `freq: number`: the frequency in Hz of the control-signal. This is 800kHz for ws2812/sk6812 LEDs and 400kHz for older ws2811 LEDs (default `800000`).

 - `channels: Object[]`: an array of one or two objects with channel-specific
   configuration for the two possible outputs:

    - `count: number`: the number of LEDs on this channel.
    - `gpio: number`: the GPIO port-number the strip is connected to. (default: `18` for the first channel and `12` for the second channel)
    - `invert: boolean`: whether the output-signal should be inverted (needed when a inverting level-shifter is used) (default: `false`)
    - `brightness: number`: the brightness, applied to all LEDs on this channel. Value between 0 and 255 (default: `255`).
    - `stripType: string|number`: the LED-type connected on this channel. See `./lib/constants.js`. Can be a string-constant or one of the values from `ws281x.stripType` (default `ws281x.stripType.WS2812`)


### `ws281x.render()`

Send the current state of the channel color-buffers to the LEDs.

#### Example:

```javascript
const ws2821x = require('rpi-ws281x-native');

// initialize
const [channel] = ws281x.init(options);

// set some color-values
channel.array[12] = 0xff0000;

// render
ws281x.render();
```


### `ws281x.reset()`

Clear all color-values and render.

### `ws281x.finalize()`

Shut down the drivers and free all resources.


### `Channel`

Each of the channels is represented by a channel-object.
Channels do not contain any public methods – all interaction happens through the following properties:

 - `[readonly] count: number`: number of LEDs on this channel
 - `[readonly] stripType: number`: the numeric LED-type (see `ws281x.stripType`)
 - `[readonly] invert: boolean`: if the signal for the LEDs is inverted
 - `[readonly] gpio: number`: the GPIO port-number used
 - `brightness: number`: the current brightness. Setting this property will
   have an effect with the very next `render()`-call.
 - `array: Uint32Array`: the color-data, represented as a Uint32Array.
   Each index in this array represents the color-value of an LED in 32
   bits (8 bit each for white, red, green, blue, counting from MSB to LSB).
   So the numbers can be specified in hex using `0xwwrrggbb`-format.
   For RGB-LEDs (those without a seperate white-channel) the MSB is ignored.
 - `buffer: Buffer`: A node-buffer, providing an alternative way to manipulate
   the color-data. This is a view on the same array-buffer that is used by the
   Uint32Array. When using the buffer, make sure to check for endianness to
   prevent problems (I believe it is little endian on the raspebrry-pi).



## testing basic functionality

connect the WS2812-strip to the raspberry-pi as described
[here](https://learn.adafruit.com/neopixels-on-raspberry-pi/raspberry-pi-wiring) and run
the command `sudo node examples/rainbow.js <numLeds>`.
You should now see some rainbow-colors animation on the LED-strip.


## needs to run as root

As the native part of this module needs to directly interface with the physical
memory of the raspberry-pi (which is required in order to configure the PWM and
DMA-modules), it always has to run with root-privileges (there are probably ways
around this requirement, but that doesn't change the fact that the node-process
running the LEDs needs access to the raw physical memory – a thing you should
never allow to any user other than root).

If you are using this module as part of a program that should not be run with
elevated privileges, it would be a good idea to have the LED-driver running in
a seperate process. In such a case you could use the openpixel-control protocol
to send the pixel-data to the driver-process.
A stream-based node-implementation and some more information
[can be found here](https://github.com/beyondscreen/node-openpixelcontrol).


## Hardware

There is a guide [over at adafruit.com](https://learn.adafruit.com/neopixels-on-raspberry-pi)
on how to get the hardware up and running. I followed these instructions by
the word and had a working LED-strip.

Essentially, you need the Raspberry Pi, a logic-level converter and of
course a LED-Strip or other types of WS281x/SK6812-LEDs.

The logic-level shifter is required to shift the output-voltage of the
GPIO from 3.3V up to 5V. The adafruit-guide mentions
the 74AHCT125, but in fact most of the 74HCT-series chips or even a simple
transistor can be used for this.

To connect all that together, I'd recommend buying a small breadboard and some
jumper-wires. Also, consider buying a 5V power-supply that can deliver up to
60mA per LED (so you'll need up to 6A (30W) to fully power 100 LEDs).
For smaller applications, a good USB-charger should do the job just fine.

### Buying stuff

A short checklist of what you will need:

 * Raspberry-PI and SD-Card
 * 5V power-supply (Meanwell for instance builds really good ones)
 * LED-Strip with WS2811/WS2812 Controllers (there are several other
   controller-variations that are not supported)
 * a breadboard and some jumper-wires (m/m as well as at least two f/m to
   connect the GPIO-Pins)
 * a 3.3V to 5V logic-level converter (74AHCT125 or 74HCT125N, others will
   probably also work)
 * more wire to connect the LED-strips

You can buy everything at [adafruit.com](https://adafruit.com),
[sparkfun](https://sparkfun.com), on ebay or your favourite electronics
retailer (germany: check [conrad electronic](http://www.conrad.de),
[watterott](http://watterott.com) or [reichelt](http://reichelt.de) where
I bought most of my stuff). If you got more time than money to spend, I
recommend buying directly from chinese manufacturers (via aliexpress
for example). Shipping takes ages, but you end up paying only half as
much for the LEDs for example.


## Known Issues

### Raspberry integrated soundcard

There is a conflict where the internal soundcard uses the same 
GPIO / DMA / PWM functions that are needed to run the LED-drivers. 
As far as I know you can not use both at the same time.

To disable audio, comment out the following line in config.txt contained on the boot partion.

#dtparam=audio=on

As @AdyiPool [pointed out](https://github.com/beyondscreen/node-rpi-ws281x-native/issues/49), that file seems to not exist in newer
raspbian-versions, Alternatively, you can create a file `/etc/modprobe.d/blacklist-ws281x.conf` with the following contents (effectively preventing sound-related modules to be loaded into the kernel):

```
blacklist snd_bcm2835
blacklist snd_pcm
blacklist snd_timer
blacklist snd_pcsp
blacklist snd
```

(after updating the file you need to run `sudo update-initramfs -u` to
get the changes into the boot-partition or something like that)

If anyone finds a better solution please get in touch!