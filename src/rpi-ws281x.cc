#include <node.h>
#include <v8.h>

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
Handle<Value> Render(const Arguments& args) {
  HandleScope scope;

  if(args.Length() != 1) {
    ThrowException(Exception::TypeError(String::New("render(): missing argument.")));
    return scope.Close(Undefined());
  }

  Local<Object> obj = args[0]->ToObject();
  if (obj->GetIndexedPropertiesExternalArrayDataType() != kExternalUnsignedIntArray) {
    ThrowException(Exception::TypeError(String::New("render(): expected argument to be an Uint32Array.")));
    return scope.Close(Undefined());
  }

  int len = obj->GetIndexedPropertiesExternalArrayDataLength();
  uint32_t* data = static_cast<uint32_t*>(obj->GetIndexedPropertiesExternalArrayData());

  memcpy(ledstring.channel[0].leds, data, std::min(4*len, 4*ledstring.channel[0].count));

  ws2811_wait(&ledstring);
  ws2811_render(&ledstring);

  return scope.Close(Undefined());
}

/**
 * exports.init(Number ledCount [, Object config]) - setup the configuration and initialize the library.
 */
Handle<Value> Init(const Arguments& args) {
  HandleScope scope;

  ledstring.freq    = DEFAULT_TARGET_FREQ;
  ledstring.dmanum  = DEFAULT_DMANUM;

  channel0data.gpionum = DEFAULT_GPIO_PIN;
  channel0data.invert = 0;
  channel0data.count = 0;

  channel1data.gpionum = 0;
  channel1data.invert = 0;
  channel1data.count = 0;


  ledstring.channel[0] = channel0data;
  ledstring.channel[1] = channel1data;


  if(args.Length() < 1) {
    ThrowException(Exception::TypeError(String::New("init(): expected at least 1 argument")));
    return scope.Close(Undefined());
  }

  // first argument is a number
  if(!args[0]->IsNumber()) {
    ThrowException(Exception::TypeError(String::New("init(): argument 0 is not a number")));
    return scope.Close(Undefined());
  }
  ledstring.channel[0].count = args[0]->Int32Value();

  // second (optional) an Object
  if(args.Length() >= 2 && args[1]->IsObject()) {
    Local<Object> config = args[1]->ToObject();

    Local<String>
        symFreq = String::NewSymbol("frequency"),
        symDmaNum = String::NewSymbol("dmaNum"),
        symGpioPin = String::NewSymbol("gpioPin"),
        symInvert = String::NewSymbol("invert");

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
  }

  // FIXME: handle errors, throw JS-Exception
  int err = ws2811_init(&ledstring);

  if(err) {
      ThrowException(Exception::TypeError(String::New("init(): initialization failed. sorry – no idea why.")));
  }

  return scope.Close(Undefined());
}

/**
 * exports.reset() – blacks out the LED-strip and finalizes the library
 * (disable PWM, free DMA-pages etc).
 */
Handle<Value> Reset(const Arguments& args) {
  HandleScope scope;

  memset(ledstring.channel[0].leds, 0, sizeof(*ledstring.channel[0].leds) * ledstring.channel[0].count);

  ws2811_render(&ledstring);
  ws2811_wait(&ledstring);
  ws2811_fini(&ledstring);

  return scope.Close(Undefined());
}


void initialize(Handle<Object> exports) {
  exports->Set(String::NewSymbol("init"),   FunctionTemplate::New(Init)->GetFunction());
  exports->Set(String::NewSymbol("reset"),  FunctionTemplate::New(Reset)->GetFunction());
  exports->Set(String::NewSymbol("render"), FunctionTemplate::New(Render)->GetFunction());
}

NODE_MODULE(rpi_ws281x, initialize)