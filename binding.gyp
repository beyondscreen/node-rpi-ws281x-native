{
  'conditions': [
    # FIXME: check for architecture instead of OS, should only build on linux/arm/BCM2702
    ['OS=="linux"', {
      'targets': [
        {
          'target_name': 'rpi_ws281x',
          'type': 'none',
          'dependencies': ['rpi1_ws281x', 'rpi2_ws281x']
        },

        {
          'target_name': 'rpi1_ws281x',
          'sources': ['./src/rpi1-ws281x.cc'],
          'dependencies': ['rpi1_libws2811'],
          'include_dirs': ['<!(node -e "require(\'nan\')")']
        },

        {
          'target_name': 'rpi2_ws281x',
          'sources': ['./src/rpi2-ws281x.cc'],
          'dependencies': ['rpi2_libws2811'],
          'include_dirs': ['<!(node -e "require(\'nan\')")']
        },

        {
          'target_name': 'rpi1_libws2811',
          'type': 'static_library',
          'sources': [
            './src/rpi1_ws281x/ws2811.c',
            './src/rpi1_ws281x/pwm.c',
            './src/rpi1_ws281x/dma.c'
          ],
          'cflags': ['-O2', '-Wall']
        },

        {
          'target_name': 'rpi2_libws2811',
          'type': 'static_library',
          'sources': [
            './src/rpi2_ws281x/ws2811.c',
            './src/rpi2_ws281x/pwm.c',
            './src/rpi2_ws281x/dma.c',
            './src/rpi2_ws281x/mailbox.c',
            './src/rpi2_ws281x/board_info.c'
          ],
          'cflags': ['-O2', '-Wall']
        },

        {
          'target_name':'action_after_build',
          'type': 'none',
          'dependencies': ['rpi_ws281x'],
          'copies': [{
                       'destination': './lib/binding/',
                       'files': [
                         '<(PRODUCT_DIR)/rpi1_ws281x.node',
                         '<(PRODUCT_DIR)/rpi2_ws281x.node'
                       ]
                     }]
        }
      ]
    }, { # OS != linux
      'targets': [{
        # provide a dummy-target that at least won't break the build here
        'target_name': 'rpi_ws281x',
        'actions': [{
          'action_name': 'not_supported_msg',
          'inputs': [],
          'outputs': [ '--nothing-being-built--' ],
          'action': ['true'],
          'message': '**** YOU ARE INSTALLING THIS MODULE ON AN UNSUPPORTED PLATFORM ****'
        }]
      }]
    }]
  ]
}
