var express = require('express');
var app = express();

var numClients = 0;

app.get('/login', function(req, res) {
    res.send(JSON.stringify({client_id: numClients}));
    numClients++;
});

app.post('/delay', function(req, res) {
    var delayTime = req.param("delaytime");
    setTimeout(function() {
	res.send("Okay!");
	res.end();
    }, delayTime);
});

app.listen(3000, function() {
});
