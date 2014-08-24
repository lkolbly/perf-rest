var mkpoisson = function(lambda) {
    return (function(instance_state) {
	// Knuth's algorithm
	var L = Math.pow(Math.E, -lambda);
	var k = 0;
	var p = 1;
	do {
	    k += 1;
	    p = p * Math.random();
	} while (p > L);
	return k - 1;
    });
};

module.exports = {
    mkpoisson: mkpoisson
};
