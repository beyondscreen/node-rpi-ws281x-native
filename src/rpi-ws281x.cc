#include <stdio.h>

#include "napi.h"

extern "C" {
  #include "rpi_ws281x/ws2811.h"
}

#define DEFAULT_TARGET_FREQ     800000
#define DEFAULT_GPIO_PIN        18
#define DEFAULT_DMANUM          5

ws2811_t ledstring;
ws2811_channel_t channel0data, channel1data;

Napi::Value init(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1 && info.Length() != 2) {
        std::string err = "Wrong number of arguments " + info.Length();
        Napi::TypeError::New(env, err.c_str()).ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong type number of leds").ThrowAsJavaScriptException();
        return env.Null();
    }
    int32_t count = info[0].As<Napi::Number>().Int32Value();

    // second (optional) an Object
    if (info.Length() == 2 && info[1].IsObject()) {
        Napi::Object config = info[1].As<Napi::Object>();

        if (config.Has("frequency")) {
            ledstring.freq = config.Get("frequency").As<Napi::Number>().Int32Value();
        }

        if (config.Has("dmaNum")) {
            ledstring.dmanum = config.Get("dmaNum").As<Napi::Number>().Int32Value();
        }

        if (config.Has("gpioPin")) {
            ledstring.channel[0].gpionum = config.Get("gpioPin").As<Napi::Number>().Int32Value();
        }

        if (config.Has("invert")) {
            ledstring.channel[0].invert = config.Get("invert").As<Napi::Number>().Int32Value();
        }

        if (config.Has("brightness")) {
            ledstring.channel[0].brightness = config.Get("brightness").As<Napi::Number>().Int32Value();
        }
    }

    ledstring.freq = DEFAULT_TARGET_FREQ;
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

    ledstring.channel[0].count = count;

    ws2811_return_t err = ws2811_init(&ledstring);

    if (err) {
        printf("error initializing %i %s\n", err, ws2811_get_return_t_str(err));
        Napi::TypeError::New(env, "Init Error").ThrowAsJavaScriptException();
    }

    return env.Null();
}

Napi::Value setBrightness(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        std::string err = "Wrong number of arguments " + info.Length();
        Napi::TypeError::New(env, err.c_str()).ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong type argument 0").ThrowAsJavaScriptException();
        return env.Null();
    }
    int32_t brightness = info[0].As<Napi::Number>().Int32Value();

    ledstring.channel[0].brightness = brightness;

    return env.Null();
}

Napi::Value reset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    memset(ledstring.channel[0].leds, 0, sizeof(*ledstring.channel[0].leds) * ledstring.channel[0].count);

    ws2811_render(&ledstring);
    ws2811_wait(&ledstring);
    ws2811_fini(&ledstring);

    return env.Null();
}

Napi::Value render(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() != 1) {
        std::string err = "Wrong number of arguments " + info.Length();
        Napi::TypeError::New(env, err.c_str()).ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsTypedArray()) {
        Napi::TypeError::New(env, "Wrong type argument 0").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Uint32Array values = info[0].As<Napi::Uint32Array>();

    if (values.ByteLength() < sizeof(*ledstring.channel[0].leds) * ledstring.channel[0].count) {
        Napi::TypeError::New(env, "Wrong length").ThrowAsJavaScriptException();
        return env.Null();
    }

    memcpy(ledstring.channel[0].leds, values.Data(), sizeof(*ledstring.channel[0].leds) * ledstring.channel[0].count);

    ws2811_wait(&ledstring);
    ws2811_render(&ledstring);

    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, init));
    exports.Set(Napi::String::New(env, "setBrightness"), Napi::Function::New(env, setBrightness));
    exports.Set(Napi::String::New(env, "reset"), Napi::Function::New(env, reset));
    exports.Set(Napi::String::New(env, "render"), Napi::Function::New(env, render));

    return exports;
}

NODE_API_MODULE(wrapper, Init)
