#include <nan.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <v8.h>

extern "C" {
#include "rpi_ws281x/ws2811.h"
}

using namespace v8;
using v8::FunctionTemplate;

#define DEFAULT_TARGET_FREQ 800000
#define DEFAULT_GPIO_PIN 18
#define DEFAULT_DMANUM 10

#define PARAM_FREQ 1
#define PARAM_DMANUM 2
#define PARAM_GPIONUM 3
#define PARAM_COUNT 4
#define PARAM_INVERT 5
#define PARAM_BRIGHTNESS 6
#define PARAM_STRIP_TYPE 7

ws2811_t ws281x;

/**
 * ws281x.setParam(param:Number, value:Number)
 * wrap setting global params in ws2811_t
 */
void setParam(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 2) {
    Nan::ThrowTypeError("setParam(): expected two params");
    return;
  }

  if (!info[0]->IsNumber()) {
    Nan::ThrowTypeError(
        "setParam(): expected argument 1 to be the parameter-id");
    return;
  }

  if (!info[1]->IsNumber()) {
    Nan::ThrowTypeError("setParam(): expected argument 2 to be the value");
    return;
  }

  const int param = Nan::To<int32_t>(info[0]).FromJust();
  const int value = Nan::To<int32_t>(info[1]).FromJust();

  switch (param) {
    case PARAM_FREQ:
      ws281x.freq = value;
      break;
    case PARAM_DMANUM:
      ws281x.dmanum = value;
      break;

    default:
      Nan::ThrowTypeError("setParam(): invalid parameter-id");
      return;
  }
}
/**
 * ws281x.setChannelParam(channel:Number, param:Number, value:Number)
 *
 * wrap setting params in ws2811_channel_t
 */
void setChannelParam(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 3) {
    Nan::ThrowTypeError("setChannelParam(): missing argument");
    return;
  }

  // retrieve channelNumber from argument 1
  if (!info[0]->IsNumber()) {
    Nan::ThrowTypeError(
        "setChannelParam(): expected argument 1 to be the channel-number");
    return;
  }

  const int channelNumber = Nan::To<int32_t>(info[0]).FromJust();
  if (channelNumber > 1 || channelNumber < 0) {
    Nan::ThrowError("setChannelParam(): invalid chanel-number");
    return;
  }

  if (!info[1]->IsNumber()) {
    Nan::ThrowTypeError(
        "setChannelParam(): expected argument 2 to be the parameter-id");
    return;
  }

  if (!info[2]->IsNumber() && !info[2]->IsBoolean()) {
    Nan::ThrowTypeError(
        "setChannelParam(): expected argument 3 to be the value");
    return;
  }

  ws2811_channel_t *channel = &ws281x.channel[channelNumber];
  const int param = Nan::To<int32_t>(info[1]).FromJust();
  const int value = Nan::To<int32_t>(info[2]).FromJust();

  switch (param) {
    case PARAM_GPIONUM:
      channel->gpionum = value;
      break;
    case PARAM_COUNT:
      channel->count = value;
      break;
    case PARAM_INVERT:
      channel->invert = value;
      break;
    case PARAM_BRIGHTNESS:
      channel->brightness = (uint8_t)value;
      break;
    case PARAM_STRIP_TYPE:
      channel->strip_type = value;
      break;

    default:
      Nan::ThrowTypeError("setChannelParam(): invalid parameter-id");
      return;
  }
}

/**
 * ws281x.setChannelData(channel:Number, buffer:Buffer)
 *
 * wrap copying data to ws2811_channel_t.leds
 */
void setChannelData(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 2) {
    Nan::ThrowTypeError("setChannelData(): missing argument.");
    return;
  }

  // retrieve channelNumber from argument 1
  if (!info[0]->IsNumber()) {
    Nan::ThrowTypeError(
        "setChannelData(): expected argument 1 to be the channel-number.");
    return;
  }

  int channelNumber = Nan::To<int32_t>(info[0]).FromJust();
  if (channelNumber > 1 || channelNumber < 0) {
    Nan::ThrowError("setChannelData(): invalid chanel-number");
    return;
  }
  ws2811_channel_t channel = ws281x.channel[channelNumber];

  // retrieve buffer from argument 2
  if (!node::Buffer::HasInstance(info[1])) {
    Nan::ThrowTypeError("setChannelData(): expected argument 2 to be a Buffer");
    return;
  }
  v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
  auto buffer = info[1]->ToObject(context).ToLocalChecked();
  uint32_t *data = (uint32_t *)node::Buffer::Data(buffer);

  if (channel.count == 0 || channel.leds == NULL) {
    Nan::ThrowError("setChannelData(): channel not ready");
    return;
  }

  const int numBytes = std::min(node::Buffer::Length(buffer),
                                sizeof(ws2811_led_t) * channel.count);

  // FIXME: handle memcpy-result
  memcpy(channel.leds, data, numBytes);
}

/**
 * ws281x.init()
 *
 * wrap ws2811_init()
 */
void init(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  ws2811_return_t ret;

  ret = ws2811_init(&ws281x);
  if (ret != WS2811_SUCCESS) {
    Nan::ThrowError(ws2811_get_return_t_str(ret));
    return;
  }
}

/**
 * ws281x.render()
 *
 * wrap ws2811_wait() and ws2811_render()
 */
void render(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  ws2811_return_t ret;

  ret = ws2811_wait(&ws281x);
  if (ret != WS2811_SUCCESS) {
    Nan::ThrowError(ws2811_get_return_t_str(ret));
    return;
  }

  ret = ws2811_render(&ws281x);
  if (ret != WS2811_SUCCESS) {
    Nan::ThrowError(ws2811_get_return_t_str(ret));
    return;
  }
}

/**
 * ws281x.finalize()
 *
 * wrap ws2811_wait() and ws2811_fini()
 */
void finalize(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  ws2811_return_t ret;

  ret = ws2811_wait(&ws281x);
  if (ret != WS2811_SUCCESS) {
    Nan::ThrowError(ws2811_get_return_t_str(ret));
    return;
  }

  ws2811_fini(&ws281x);
}

NAN_MODULE_INIT(InitAll) {
  Nan::Set(target, Nan::New<String>("init").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(init)).ToLocalChecked());

  Nan::Set(target, Nan::New<String>("setParam").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(setParam)).ToLocalChecked());
  
  Nan::Set(target, Nan::New<String>("setChannelParam").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(setChannelParam)).ToLocalChecked());
  
  Nan::Set(target, Nan::New<String>("setChannelData").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(setChannelData)).ToLocalChecked());

  Nan::Set(target, Nan::New<String>("render").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(render)).ToLocalChecked());

  Nan::Set(target, Nan::New<String>("finalize").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(finalize)).ToLocalChecked());
}

NODE_MODULE(addon, InitAll)

// vi: ts=2 sw=2 expandtab
