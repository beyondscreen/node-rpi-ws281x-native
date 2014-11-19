{
  "targets": [
    {
      "target_name": "rpi_ws281x",
      "sources": ["./src/rpi-ws281x.cc"],
      "dependencies": ["libws2811"]
    },

    {
      "target_name": "libws2811",
      "type": "static_library",
      "sources": [
        "./src/rpi_ws281x/ws2811.c",
        "./src/rpi_ws281x/pwm.c",
        "./src/rpi_ws281x/dma.c"
      ],
      "cflags": ["-O2", "-Wall"]
    },

    {
      "target_name":"action_after_build",
      "type": "none",
      "dependencies": ["rpi_ws281x"],
      "copies": [{
         "destination": "./lib/binding/",
         "files": ["<(PRODUCT_DIR)/rpi_ws281x.node"]
      }]
    }
  ]
}