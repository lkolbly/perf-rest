var http = require("http");
var fs = require("fs");
var deepcopy = require("deepcopy");
var strftime = require("strftime");

global.PERF_UTILS_PATH = __dirname+"/perf.utils.js";
var def = require(process.cwd()+"/perf.def.js");

var logFile = fs.createWriteStream("perf."+strftime("%Y%m%d%H%M%S")+".log", {flags: 'w'});
var log = function(obj) {
    var tm = process.hrtime();
    obj.time = tm[0]*1e9 + tm[1];
    logFile.write(JSON.stringify(obj)+"\n");
};
process.on('exit', function(code) {
    logFile.end();
});

var nrequests = 0;

var makeRequest = function(options, body, cb) {
    //options.agent = false;
    var req = http.request(options);
    var data = "";
    req.on('response', function(res) {
	res.on('data', function(chunk) {
	    data += chunk;
	});
	res.on('end', function() {
	    cb(data);
	});
    });
    req.write(body);
    req.end();
    nrequests+=1;
};

// Courtesy stackoverflow
function paddy(n, p, c) {
    var pad_char = typeof c !== 'undefined' ? c : '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
}

var printUpdate = function() {
    console.log("time: "+Math.floor(process.uptime()/60)+":"+paddy(Math.floor(process.uptime())%60, 2)+" nrequests: "+nrequests+" nclients: "+numClients);
};
setInterval(printUpdate, 5000);

process.on('exit', function(code) {
    console.log("Counting requests...");
    console.log("Made "+nrequests+" requests");
});

var buildRequest = function(cur_request, requestname, instance_state) {
    // Check to see if there's an oncall function
    var request = deepcopy(def.Requests[requestname]);
    //console.log(requestname);
    //console.log(request);
    if (request.oncall !== undefined) {
	request.oncall(instance_state, {});
    }

    // Merge request and cur_request
    for (var attrname in request) {
	if (cur_request[attrname] === undefined) {
	    cur_request[attrname] = request[attrname];
	} else {
	    if (Object.prototype.toString.call(cur_request[attrname]) === "[object Object]") {
		// Iterate!
		for (var attrname2 in request[attrname]) {
		    cur_request[attrname][attrname2] = request[attrname][attrname2];
		}
	    } else if (Object.prototype.toString.call(cur_request[attrname]) === "[object Array]") {
		// Merge!
		cur_request[attrname].concat(request[attrname]);
	    } else {
		cur_request[attrname] = request[attrname];
	    }
	}
    }

    return cur_request;
};

var runRequest = function(requestname, instance_state, onfinish) {
    if (requestname === "noop") {
	onfinish();
	return;
    }
    var request = def.Requests[requestname];

    // Find all the parents
    var parents = [];
    var r = request;
    while (r.parent !== undefined) {
	parents.push(r.parent);
	var name = r.parent;
	r = def.Requests[name];
	if (r === undefined) {
	    console.log("ERROR: "+r.parent+" is not a valid request");
	}
    }

    // Apply them, top down
    var req = {};
    while (parents.length > 0) {
	var name = parents.pop();
	req = buildRequest(req, name, instance_state);
	//console.log("Applied "+name+", built:");
	//console.log(req);
    }
    req = buildRequest(req, requestname, instance_state);

    // Calculate the body
    var body = "";
    if (req.body !== undefined) {
	body = JSON.stringify(req.body);
    }

    // Now, run it
    //console.log("Making call:");
    //console.log(req);
    if (req.cancel === true) {
	onfinish();
    } else {
	var startTime = process.hrtime();
	makeRequest(req, body, function(res) {
	    // Get the timing data
	    var endTime = process.hrtime();
	    var latency = (endTime[0]-startTime[0])*1e9 + (endTime[1]-startTime[1]); // ns
	    log({request: req.method+" "+req.path, latency: latency});

	    // Check to see if there's an onfinish function
	    if (request.onfinish !== undefined) {
		request.onfinish(JSON.parse(res), instance_state);
	    }

	    onfinish();
	});
    }
};

var numClients = 0;

var onEnterState = function(engine, statename, instance_state) {
    if (statename === "exit") {
	// We're done here
	numClients--;
	log({numClients: numClients});
	return;
    }

    // Iterate over the requests.
    var state = def.States[statename];

    // run the request
    runRequest(state.request, instance_state, function() {
	// The request is done, let's transition states
	var v = Math.random();
	var n = 0;
	while (v > 0.0) {
	    v -= state.transition[n].prob;
	    n = (n+1)%state.transition.length;
	}

	// We've found our destination
	var delay = 0;
	if (state.transition[n].delay !== undefined) {
	    var t = Object.prototype.toString.call(state.transition[n].delay);
	    if (t === "[object Number]") {
		delay = state.transition[n].delay;
	    } else if (t === "[object Function]") {
		delay = state.transition[n].delay(instance_state);
	    } else {
		// We dunno what it is...
	    }
	}
	engine.scheduleState(state.transition[n].dest, delay, instance_state);
    });
};

var StateEngine = {
    scheduleState: function(dest_state, delay, instance_state) {
	setTimeout(function() {
	    if (dest_state === "preinit") {
		// Advance to init
		instance_state = new def.Instance();
		clients.push(instance_state);
		numClients++;
		log({numClients: numClients});
		dest_state = "init";
	    }
	    onEnterState(StateEngine, dest_state, instance_state);
	}, delay*1000);
    }
};

var clients = [];
for (var i=0; i<1000; i++) {
    //StateEngine.sc
    //clients.push(new def.Instance());
    //numClients++;
    //log({numClients: numClients});
}

// Start working...
for (var i=0; i<def.numClients; i++) {
    //init(clients[i]);
	var delay = 0;
	if (def.States.preinit.delay !== undefined) {
	    var t = Object.prototype.toString.call(def.States.preinit.delay);
	    if (t === "[object Number]") {
		delay = def.States.preinit.delay;
	    } else if (t === "[object Function]") {
		delay = def.States.preinit.delay({});
	    } else {
		// We dunno what it is...
	    }
	}
    //console.log("preinit delay: "+delay);
    StateEngine.scheduleState("preinit", delay, {});
}
