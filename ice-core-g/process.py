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
parser.add_argument('-in', dest="INPUT_FILE", default="data/cleaned_gisp2_age.csv", help="output file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/timeline.json", help="output file")
parser.add_argument('-interval', dest="DEPTH_INTERVAL", type=int, default=500, help="Interval to display depth markers")
parser.add_argument('-start', dest="DEPTH_START", type=int, default=2808, help="Depth start")
parser.add_argument('-end', dest="DEPTH_END", type=int, default=1, help="Depth end")
parser.add_argument('-yinterval', dest="YEAR_INTERVAL", type=int, default=10000, help="Interval to display year markers")

args = parser.parse_args()
INPUT_FILE = args.INPUT_FILE
OUTPUT_FILE = args.OUTPUT_FILE
DEPTH_INTERVAL = args.DEPTH_INTERVAL
DEPTH_START = args.DEPTH_START
DEPTH_END = args.DEPTH_END
YEAR_INTERVAL = args.YEAR_INTERVAL
PRESENT_YEAR = 2018
BEFORE_YEAR = 1950

def ceilToNearest(value, nearest):
    return int(math.ceil(1.0 * value / nearest) * nearest)

def floorToNearest(value, nearest):
    return int(math.floor(1.0 * value / nearest) * nearest)

def norm(value, a, b):
    return 1.0 * (value - a) / (b - a)

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

data = readCSV(INPUT_FILE)

yearStart = None
yearEnd = None
for i, d in enumerate(data):
    yearsAgo = PRESENT_YEAR - int(1950 - d["Ice Age"])
    data[i]["yearsAgo"] = yearsAgo
    if yearEnd is None and d["Depth"] >= DEPTH_END:
        yearEnd = ceilToNearest(yearsAgo, 500)
    if yearStart is None and d["Depth"] >= DEPTH_START:
        yearStart = floorToNearest(yearsAgo, 50000)
print "From %s years ago to %s years ago" % (yearStart, yearEnd)

depthMarkers = []
depth = floorToNearest(DEPTH_START, DEPTH_INTERVAL)
while depth >= DEPTH_END:
    depthMarkers.append({
        "label": "%s meters below surface" % depth,
        "x": norm(depth, DEPTH_START, DEPTH_END)
    })
    depth -= DEPTH_INTERVAL

timeMarkers = []
year = yearEnd
yearInterval = 500
for i, d in enumerate(data):
    yearsAgo = d["yearsAgo"]
    depth = d["Depth"]
    if yearsAgo > year:
        timeMarkers.append({
            "label": "%s years ago" % "{:,}".format(year),
            "x": norm(depth, DEPTH_START, DEPTH_END)
        })
        year += yearInterval
        year = ceilToNearest(year, yearInterval)
        if year >= 50000:
            yearInterval = 50000
        elif year >= 10000:
            yearInterval = 10000
        elif year >= 5000:
            yearInterval = 2500
        elif year >= 1000:
            yearInterval = 1000
    if year > yearStart:
        break

jsonOut = {
    "depthMarkers": depthMarkers,
    "timeMarkers": timeMarkers
}

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote to %s" % OUTPUT_FILE
