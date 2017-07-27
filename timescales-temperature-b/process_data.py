# -*- coding: utf-8 -*-

# Source:
# NOAA Temperature Time Series
# https://www.ncdc.noaa.gov/cag/time-series/global/globe/land_ocean/1/5/1880-2016

import argparse
import csv
from datetime import datetime
import json
import math
import os
import sys

# 20the century average temperature in °C
# https://www.ncdc.noaa.gov/sotc/global/201613
BASELINE = 13.9 * 9.0 / 5.0

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/1880-2016.csv", help="Temperature input file")
parser.add_argument('-start', dest="START_COLOR", default="#4B94D8", help="Start color")
parser.add_argument('-end', dest="END_COLOR", default="#C45C5C", help="End color")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="Output file")

args = parser.parse_args()

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

def norm(value, a, b):
    return 1.0 * (value - a) / (b - a)

# Add colors
def hex_to_RGB(hex):
  # "#FFFFFF" -> [255,255,255]
  return [int(hex[i:i+2], 16) for i in range(1,6,2)]

def RGB_to_hex(RGB):
  # [255,255,255] -> "#FFFFFF"
  RGB = [int(x) for x in RGB]
  return "#"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in RGB])

def lerpColor(s, f, amount):
    rgb = [
      int(s[j] + amount * (f[j]-s[j]))
      for j in range(3)
    ]
    return RGB_to_hex(rgb)

data = readCSV(args.INPUT_FILE)

# Convert to Fahrenheit
for i,d in enumerate(data):
    # Check for records set
    data[i]["Value"] = round(d["Value"] * 9.0 / 5.0, 1)

years = [d["Year"] for d in data]
values = [d["Value"] for d in data]
dataDomain = [min(years), max(years)]
dataRange = [min(values), max(values)]

colorStart = hex_to_RGB(args.START_COLOR)
colorFinish = hex_to_RGB(args.END_COLOR)

maxValue = -999
for i,d in enumerate(data):
    # Check for records set
    data[i]["Record"] = 0
    if d["Value"] > maxValue:
        maxValue = d["Value"]
        if d["Value"] > 0:
            data[i]["Record"] = 1

    n = norm(d["Value"], dataRange[0], dataRange[1])
    data[i]["Norm"] = n
    data[i]["Color"] = lerpColor(colorStart, colorFinish, n)


tuples = [(d["Year"], d["Value"], d["Color"], d["Norm"], d["Record"]) for d in data]
jsonData = {
    "data": tuples,
    "domain": dataDomain,
    "range": dataRange,
    "baseline": BASELINE
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
    print "Wrote %s items to %s" % (len(tuples), args.OUTPUT_FILE)
