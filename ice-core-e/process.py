# -*- coding: utf-8 -*-
# Data source: ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/greenland/summit/gisp2/

import argparse
import csv
import json
import math
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="output file")
parser.add_argument('-interval', dest="DEPTH_INTERVAL", type=int, default=500, help="Interval to display depth markers")

args = parser.parse_args()
DEPTH_INTERVAL = args.DEPTH_INTERVAL
PRESENT_YEAR = 2016

events = [
    {"label": "Holocene", "startYearBP": 11700, "endYearBP": 0},
    {"label": "Younger Dryas", "startYearBP": 12900, "endYearBP": 11700}
]

def parseNumber(string):
    try:
        num = float(string)
        return num
    except ValueError:
        return string

def parseNumbers(arr):
    for i, item in enumerate(arr):
        for key in item:
            arr[i][key] = parseNumber(item[key])
    return arr

def readCSV(filename):
    rows = []
    if os.path.isfile(filename):
        with open(filename, 'rb') as f:
            lines = [line for line in f if not line.startswith("#")]
            reader = csv.DictReader(lines, skipinitialspace=True)
            rows = list(reader)
            rows = parseNumbers(rows)
    return rows

def roundDown(val, amt):
    return int(math.floor(1.0 * val / amt)) * amt

def getDepth(data, yearsBP):
    i = 0
    while yearsBP > data[i]["yearsBP"] and i < len(data)-1:
        i += 1
    return data[i]["Depth"]

def getYearsBP(data, depth):
    i = 0
    while depth > data[i]["Depth"] and i < len(data)-1:
        i += 1
    return data[i]["yearsBP"]

# get age/depth data
ageData = readCSV("data/cleaned_gisp2_age.csv")
# add year
for i,d in enumerate(ageData):
    ageData[i]["yearsBP"] = PRESENT_YEAR - int(1950 - d["Ice Age"])

yearsBP = [d["yearsBP"] for d in ageData]
depths = [d["Depth"] for d in ageData]
depthRange = [max(depths), min(depths)]

# add depths to events
startI = 0
for i,d in enumerate(events):
    events[i]["startDepth"] = getDepth(ageData, d["startYearBP"])
    events[i]["endDepth"] = getDepth(ageData, d["endYearBP"])

# generate axis labels
axisLabels = [{"depth": ageData[-1]["Depth"], "yearsBP": ageData[-1]["yearsBP"]}]
depth = roundDown(depthRange[0], DEPTH_INTERVAL)
while depth > depthRange[1]:
    yearsBP = getYearsBP(ageData, depth)
    axisLabels.append({"depth": depth, "yearsBP": yearsBP})
    depth -= DEPTH_INTERVAL
axisLabels.append({"depth": ageData[0]["Depth"], "yearsBP": ageData[0]["yearsBP"]})

if (axisLabels[0]["depth"] - axisLabels[1]["depth"]) < DEPTH_INTERVAL/2:
    axisLabels.pop(1)

if (axisLabels[-2]["depth"] - axisLabels[-1]["depth"]) < DEPTH_INTERVAL/2:
    axisLabels.pop(-2)

jsonOut = {
    "depthRange": depthRange,
    "events": events,
    "axisLabels": axisLabels
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote to %s" % args.OUTPUT_FILE
