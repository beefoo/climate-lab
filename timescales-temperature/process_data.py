# -*- coding: utf-8 -*-

# Sources:
#   GISS Surface Temperature Analysis (GISTEMP)
#   https://data.giss.nasa.gov/gistemp/

import argparse
import csv
from datetime import datetime
import json
import math
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/GLB.Ts+dSST.csv", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1880, help="Temperature input file")
parser.add_argument('-end', dest="END_YEAR", default=2017, help="Temperature input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="Output file")

args = parser.parse_args()

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

def celsiusToFahrenheight(c):
    return (c * 9.0 / 5.0)

def dateToSeconds(date):
    (year, month, day) = date
    dt = datetime(int(year), month, day)
    unix = datetime(1970,1,1)
    return (dt - unix).total_seconds()

rawData = readCSV(args.INPUT_FILE)
monthHeaders = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
data = []
for row in rawData:
    year = row["Year"]
    if args.START_YEAR <= year <= args.END_YEAR:
        for i,m in enumerate(monthHeaders):
            value = row[m]
            if value != "***":
                data.append({
                    "date": (year, i+1, 1),
                    "value": celsiusToFahrenheight(value)
                })

def yearsAgo(d, years):
    d2 = (d[0]-years, d[1]+1, d[2])
    if d2[1] > 12:
        d2 = (d[0]-years+1, 1, d[2])
    return d2

# sort data and get ranges
data = sorted(data, key=lambda k: k["date"])
dateRange = (data[0]["date"], data[-1]["date"])
d1 = dateRange[-1]
labels = [
    {"text": "Last month", "date": dateToSeconds(dateRange[1])},
    {"text": "One year of data", "date": dateToSeconds(yearsAgo(d1, 1))},
    {"text": "Ten years of data", "date": dateToSeconds(yearsAgo(d1, 10))},
    {"text": "Fifty years of data", "date": dateToSeconds(yearsAgo(d1, 50))},
    {"text": "All data since 1880", "date": dateToSeconds(dateRange[0])}
]

maxStartDateTuple = yearsAgo(d1, 1)
maxStartDate = dateToSeconds(maxStartDateTuple)
values = [d["value"] for d in data]
minRangeValues = [d["value"] for d in data if d["date"] >= maxStartDateTuple]

# turn into tuples
tuples = [(dateToSeconds(d["date"]), d["value"]) for d in data]

# Build JSON data
jsonData = {
    "data": tuples,
    "minDomain": (maxStartDate, dateToSeconds(dateRange[1])),
    "maxDomain": (dateToSeconds(dateRange[0]), dateToSeconds(dateRange[1])),
    "minRange": (min(minRangeValues),  max(minRangeValues)),
    "maxRange": (min(values), max(values)),
    "labels": labels
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
