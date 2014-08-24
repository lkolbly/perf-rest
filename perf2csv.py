import json, sys

buckets = []
time_offset = -1

def extendBuckets(data):
    global time_offset
    if time_offset < 0:
        time_offset = data["time"]
    partition = (data["time"]-time_offset)/60000000000
    while len(buckets) <= partition:
        buckets.append({"nRequests": 0, "totalLatency": 0})
    return partition

def handleRequestLine(data):
    global buckets

    partition = extendBuckets(data)

    # Partition by minute
    buckets[partition]["nRequests"]+=1
    buckets[partition]["totalLatency"]+=data["latency"]/1000 # ms

def handleClientLine(data):
    partition = extendBuckets(data)
    buckets[partition]["nClients"] = data["numClients"]
    pass

def handleLine(data):
    if "numClients" in data:
        handleClientLine(data)
    else:
        handleRequestLine(data)

f = open(sys.argv[1])
for line in f.xreadlines():
    line = line.strip(" \r\n")
    if len(line) == 0:
        continue
    handleLine(json.loads(line))
f.close()

# Output the buckets
f = open("perf.csv", "w")
f.write("time (min),nRequests,totalLatency,nClients\n")
t = 0
nClients = 0
for b in buckets:
    if "nClients" in b:
        nClients = b["nClients"]
    f.write("%s,%s,%s,%s\n"%(t,b["nRequests"],b["totalLatency"],nClients))
    t+=1
