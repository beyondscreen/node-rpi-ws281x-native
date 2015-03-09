module.exports = function(rows, cols) {
    var map = new Uint16Array(rows*cols);

    for(var x=0; x<cols; x++) {
        for(var y=0; y<rows; y++) {
            map[cols*y + x] = cols*y + rows-x-1;
        }
    }

    return map;
};