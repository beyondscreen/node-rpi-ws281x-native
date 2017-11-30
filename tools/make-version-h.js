const fs = require('fs');

const [versionFile, outputFile] = process.argv.slice(2);

const version = fs.readFileSync(versionFile, 'utf8').trim();
const [major, minor, patch] = version.split('.');

const fileContent = `
/* Auto Generated File - DO NOT MODIFY */
#ifndef __VERSION_H__
#define __VERSION_H__

#define VERSION_MAJOR ${major}
#define VERSION_MINOR ${minor}
#define VERSION_MICRO ${patch}
#endif
`;

fs.writeFileSync(outputFile, fileContent);
