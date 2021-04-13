{
  'conditions': [
    # FIXME: check for architecture instead of OS, should only build on linux/arm/BCM2702
    ['OS=="linux"', {
      'targets': [
        {
          'target_name': 'rpi_ws281x',
          'sources': ['./src/rpi-ws281x.cc'],
          'dependencies': ['rpi_libws2811'],
          'include_dirs': ["<!(node -e \"require('nan')\")"],
          'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
        },

        {
          'target_name': 'rpi_ws281x-version',
          'type': 'none',
          'sources': ['./src/rpi_ws281x/version'],
          'actions': [{
            'action_name': 'make_version_h',
            'variables': {'version_file': './src/rpi_ws281x/version'},
            'inputs': ['./tools/make-version-h.js', '<@(version_file)'],
            'outputs': ['./src/rpi_ws281x/version.h'],
            'action': ['node', './tools/make-version-h.js', '<@(version_file)', '<@(_outputs)'],
          }]
        },

        {
          'target_name': 'rpi_libws2811',
          'type': 'static_library',
          'dependencies': ['rpi_ws281x-version'],
          'sources': [
            "<!@(node -p \"require('fs').readdirSync('./src/rpi_ws281x').filter(f => (f.match(/\.c$/) && !f.match('main.c'))).map(f => 'src/rpi_ws281x/' + f).join(' ')\")"
          ],
          'cflags!': ['-Wextra']
        }
      ]
    },

    # OS != linux: provide a dummy-target that at least won't break the install here
    {
      'targets': [{
        'target_name': 'rpi_ws281x',
        'type': 'none',
        'actions': [{
          'action_name': 'not_supported_msg',
          'inputs': [],
          'outputs': ['--nothing-built--'],
          'action': ['true'],
          'message': '**** YOU ARE INSTALLING THIS MODULE ON AN UNSUPPORTED PLATFORM ****'
        }]
      }]
    }]
  ]
}
