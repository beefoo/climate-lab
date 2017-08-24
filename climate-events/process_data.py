# -*- coding: utf-8 -*-

# Source:
# http://natcatservice.munichre.com/

import argparse
import csv
import json
import math
import os
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-input', dest="INPUT_FILE", default="data/preprocessed_data.json", help="Input file")
parser.add_argument('-start', dest="START_YEAR", default=1980, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2016, type=int, help="End year")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="JSON output file")

args = parser.parse_args()

CATEGORIES = [
    {"name": "geophysical", "label": "Earthquakes and volcanic activity", "color": int("ea84ff", 16)},
    {"name": "meteorological", "label": "Storms", "color": int("f4eb3d", 16)},
    {"name": "hydrological", "label": "Floods and landslides", "color": int("7fc1f4", 16)},
    {"name": "climatological", "label": "Droughts, heat waves, and fires", "color": int("f77d51", 16)}
]

def norm(value, a, b):
    n = 1.0 * (value - a) / (b - a)
    n = min(n, 1)
    n = max(n, 0)
    return n

jsonIn = {}
with open(args.INPUT_FILE) as f:
    jsonIn = json.load(f)

dataIn = jsonIn["data"]
domainIn = jsonIn["domain"]
dataOut = []

for i, d in enumerate(dataIn):
    year = i + domainIn[0]

    if not (args.START_YEAR <= year <= args.END_YEAR):
        continue

    families = d["eventFamilies"]
    eventsIn = d["events"]
    eventsOut = []
    countsOut = [0 for d in range(len(CATEGORIES))]

    for e in eventsIn:
        size = 1
        if len(e["details"]) > 0:
            size = 2
        eventsOut.append((
            round(norm(e["x"], -180, 180), 3),
            round(1.0- norm(e["y"], -90, 90), 3),
            size,
            e["eventFamily"]
        ))
        countsOut[e["eventFamily"]] += 1

    dataOut.append({
        "events": eventsOut,
        "counts": countsOut,
        "length": len(eventsOut)
    })

jsonOut = {
    "domain": [args.START_YEAR, args.END_YEAR],
    "data": dataOut,
    "categories": CATEGORIES
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(dataOut), args.OUTPUT_FILE)
