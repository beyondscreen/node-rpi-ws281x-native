{
  'conditions': [
    # FIXME: check for architecture instead of OS, should only build on linux/arm/BCM2702
    ['OS=="linux"', {
      'targets': [

        {
          'target_name': 'rpi_ws281x',
          'sources': ['./src/rpi-ws281x.cc'],
          'dependencies': ['rpi_libws2811'],
          'include_dirs': ['<!(node -e "require(\'nan\')")']
        },

        {
          'target_name': 'rpi_libws2811',
          'type': 'static_library',
          'sources': [
            './src/rpi_ws281x/ws2811.c',
            './src/rpi_ws281x/pwm.c',
            './src/rpi_ws281x/dma.c',
            './src/rpi_ws281x/mailbox.c',
            './src/rpi_ws281x/board_info.c'
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
              '<(PRODUCT_DIR)/rpi_ws281x.node'
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
