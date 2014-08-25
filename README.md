perf-rest
=========

Welcome to perf-rest, the benchmark tool for RESTful APIs. Or other HTTP servers.

How to install
==============

Unlike most Node-based projects, perf-rest does not use the module framework. Keep it in it's own install directory.

Once you've cloned this repo, you need to "npm install" the following packages:
```
deepcopy
express
strftime
```

How to run
==========

Create a perf.def.js file in the working directory (which can be anywhere on your system), and populate it with code to tell perf-rest what to do. An example .def.js file is included with this project.

Then, run the perf.js file from this directory. For example, if you cloned this repo to /opt/perf-rest, and your perf.def.js file was in /home/lane/some-project, then you would run:

```
$ cd /home/lane/some-project/
$ nodejs /opt/perf-rest/perf.js
```

Using the results
=================

The results are written to a .log file in the current directory. To convert the results to a CSV file, use the python perf2csv.py script and pass it the name of that log file. It will output a CSV file to perf.csv, with the following columns:

```
time: The time bucket that row refers to.
nRequests: The number of requests issued during that time bucket.
totalLatency: The sum of the latencies of each request. The average (mean) latency for this time bucket is this column divided by nRequests.
nClients: The total number of active clients that were being modeled by perf.js.
```

Also, if you want, you can use the .log file directly. It's pretty straight-forward.

TODO
====
- More detailed output.
