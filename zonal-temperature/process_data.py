# -*- coding: utf-8 -*-

# Source:
# NASA GISS
# Zonal annual means, 1880-present
# https://data.giss.nasa.gov/gistemp/

import argparse
import csv
from datetime import datetime
import json
import math
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/ZonAnn.Ts+dSST.csv", help="Temperature input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="Output file")

args = parser.parse_args()

# Zones from north to south
ZONES = [
    "64N-90N",
    "44N-64N",
    "24N-44N",
    "EQU-24N",
    "24S-EQU",
    "44S-24S",
    "64S-44S",
    "90S-64S"
]

def parseNumber(string):
    try:
        num = float(string)
        if "." not in string:
            num = int(string)
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

rawData = readCSV(args.INPUT_FILE)
rawData = sorted(rawData, key=lambda k: k["Year"])
dataDomain = [rawData[0]["Year"], rawData[-1]["Year"]]

data = {}
for z in ZONES:
    data[z] = []

for d in rawData:
    for z in ZONES:
        data[z].append((d["Year"], d[z]))

globalData = [(d["Year"], d["Glob"]) for d in rawData]

jsonData = {
    "data": data,
    "domain": dataDomain,
    "zones": ZONES,
    "global": globalData
}

# Retrieve existing data if exists
jsonOut = {}
if os.path.isfile(args.OUTPUT_FILE):
    with open(args.OUTPUT_FILE) as f:
        jsonOut = json.load(f)
jsonOut["temperature"] = jsonData

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(rawData), args.OUTPUT_FILE)
