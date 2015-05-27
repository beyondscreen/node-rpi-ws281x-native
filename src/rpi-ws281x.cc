#include <node.h>
#include <v8.h>
#include <nan.h>

#include <stdio.h>
#include <stdint.h>
#include <string.h>

#include <algorithm>

extern "C" {
  #include "rpi_ws281x/ws2811.h"
}

using namespace v8;

#define DEFAULT_TARGET_FREQ     800000
#define DEFAULT_GPIO_PIN        18
#define DEFAULT_DMANUM          5

ws2811_t ledstring;
ws2811_channel_t
  channel0data,
  channel1data;

/**
 * exports.render(Uint32Array data) - sends the data to the LED-strip,
 *   if data is longer than the number of leds, remaining data will be ignored.
 *   Otherwise, data
 */
NAN_METHOD(Render) {
  NanScope();

  if(args.Length() != 1) {
    return NanThrowTypeError("render(): missing argument.");
  }

  if(!args[0]->IsUint32Array()) {
    return NanThrowTypeError(
        "render(): expected argument to be an Uint32Array.");
  }

  Local<Uint32Array> arr = Local<Uint32Array>::Cast(args[0]->ToObject());

  if(!arr->HasIndexedPropertiesInExternalArrayData()) {
    // This is still a bit mysterious why this happens, but arrays with less
    // than 16 elements are not created with their indexed properties in an
    // external array. In this case a call to the Buffer-method will trigger
    // JSTypedArray::MaterializeArrayBuffer which in turn converts the array
    // into an external array.
    arr->Buffer();
  }

  if (arr->GetIndexedPropertiesExternalArrayDataType() != kExternalUnsignedIntArray) {
    return NanThrowTypeError("render(): something did go wrong. Please file a bugreport.");
  }

  int len = arr->GetIndexedPropertiesExternalArrayDataLength();
  uint32_t* data = static_cast<uint32_t*>(arr->GetIndexedPropertiesExternalArrayData());

  memcpy(ledstring.channel[0].leds, data, std::min(4*len, 4*ledstring.channel[0].count));

  ws2811_wait(&ledstring);
  ws2811_render(&ledstring);

  NanReturnValue(NanUndefined());
}

/**
 * exports.init(Number ledCount [, Object config]) - setup the configuration and initialize the library.
 */
NAN_METHOD(Init) {
  NanScope();

  ledstring.freq    = DEFAULT_TARGET_FREQ;
  ledstring.dmanum  = DEFAULT_DMANUM;

  channel0data.gpionum = DEFAULT_GPIO_PIN;
  channel0data.invert = 0;
  channel0data.count = 0;
  channel0data.brightness = 255;

  channel1data.gpionum = 0;
  channel1data.invert = 0;
  channel1data.count = 0;
  channel1data.brightness = 255;

  ledstring.channel[0] = channel0data;
  ledstring.channel[1] = channel1data;

  if(args.Length() < 1) {
    return NanThrowTypeError("init(): expected at least 1 argument");
  }

  // first argument is a number
  if(!args[0]->IsNumber()) {
    return NanThrowTypeError("init(): argument 0 is not a number");
  }

  ledstring.channel[0].count = args[0]->Int32Value();

  // second (optional) an Object
  if(args.Length() >= 2 && args[1]->IsObject()) {
    Local<Object> config = args[1]->ToObject();

    Local<String>
        symFreq = NanNew<String>("frequency"),
        symDmaNum = NanNew<String>("dmaNum"),
        symGpioPin = NanNew<String>("gpioPin"),
        symInvert = NanNew<String>("invert"),
        symBrightness = NanNew<String>("brightness");

    if(config->HasOwnProperty(symFreq)) {
      ledstring.freq = config->Get(symFreq)->Uint32Value();
    }

    if(config->HasOwnProperty(symDmaNum)) {
      ledstring.dmanum = config->Get(symDmaNum)->Int32Value();
    }

    if(config->HasOwnProperty(symGpioPin)) {
      ledstring.channel[0].gpionum = config->Get(symGpioPin)->Int32Value();
    }

    if(config->HasOwnProperty(symInvert)) {
      ledstring.channel[0].invert = config->Get(symInvert)->Int32Value();
    }

    if(config->HasOwnProperty(symBrightness)) {
      ledstring.channel[0].brightness = config->Get(symBrightness)->Int32Value();
    }
  }

  // FIXME: handle errors, throw JS-Exception
  int err = ws2811_init(&ledstring);

  if(err) {
      return NanThrowError("init(): initialization failed. sorry – no idea why.", err);
  }

  NanReturnValue(NanUndefined());
}

/**
 * exports.reset() – blacks out the LED-strip and finalizes the library
 * (disable PWM, free DMA-pages etc).
 */
NAN_METHOD(Reset) {
  NanScope();

  memset(ledstring.channel[0].leds, 0, sizeof(*ledstring.channel[0].leds) * ledstring.channel[0].count);

  ws2811_render(&ledstring);
  ws2811_wait(&ledstring);
  ws2811_fini(&ledstring);

  NanReturnValue(NanUndefined());
}


void initialize(Handle<Object> exports) {
  exports->Set(NanNew<String>("init"),   NanNew<FunctionTemplate>(Init)->GetFunction());
  exports->Set(NanNew<String>("reset"),  NanNew<FunctionTemplate>(Reset)->GetFunction());
  exports->Set(NanNew<String>("render"), NanNew<FunctionTemplate>(Render)->GetFunction());
}

NODE_MODULE(rpi_ws281x, initialize)
