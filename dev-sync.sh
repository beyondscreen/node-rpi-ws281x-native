#!/usr/bin/env bash

node_modules/.bin/chokidar "'**/*.{c,h,cc,gyp,js}'" \
	--initial \
	-c 'rsync -ruvz --exclude .git --exclude .idea --exclude node_modules . raspberrypi.local:projects/rpi-ws281x-dev'
