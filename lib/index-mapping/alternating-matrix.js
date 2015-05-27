module.exports = function(width, height) {
    var map = new Uint16Array(width*height);
    for(var i = 0; i<map.length; i++) {
        var row = Math.floor(i/width), col = i % width;

        if((row % 2) === 0) {
            map[i] = i;
        } else {
            map[i] = (row+1) * width - (col+1);
        }
    }

    return map;
};