var perf_utils = require(PERF_UTILS_PATH);
var mkpoisson = perf_utils.mkpoisson;

var ClientInstance = function() {
    this.client_id = "";
};

var ClientRequests = {
    "base": {
	hostname: "localhost",
	port: 3000,
	headers: {
	    "Content-Type": "application/json"
	}
    },

    "authenticated": {
	oncall: function(state, params) {
	    this.headers = {client_id: state.client_id};
	},
	parent: "base" // The parent request
    },

    "login": {
	parent: "base",
	path: "/login",
	method: "GET",
	onfinish: function(res, state) {
	    state.client_id = res.client_id;
	    //console.log("We are client "+state.client_id+"!");
	}
    },

    "perform_expensive_action": {
	oncall: function(state, params) {
	    var delayTime = Math.random()*10.0;

	    // Look! You can specify these in the oncall function
	    this.path = "/delay";
	    this.body = {delaytime: delayTime};
	},
	parent: "authenticated",
	// path is specified in the oncall function
	method: "POST"
    }
};

var ClientStates = {
    "preinit": { // Stores the delay for before init is called
	delay: mkpoisson(60.0)
    },
    "init": {
	request: "login",
	transition: [{ // Specify the transition after the request
	    prob: 1.0,
	    dest: "delay_action"
	}]
    },
    "delay_action": {
	request: "perform_expensive_action",
	transition: [{
	    prob: 0.95,
	    delay: mkpoisson(30.0),
	    dest: "delay_action"
	}, {
	    prob: 0.05,
	    dest: "exit"
	}]
    }
};

module.exports = {
    Requests: ClientRequests,
    States: ClientStates,
    Instance: ClientInstance,
    numClients: 1000
};
