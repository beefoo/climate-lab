# -*- coding: utf-8 -*-

# Sources:
# https://data.giss.nasa.gov/modelforce/
# NASA GISS ModelE2: https://data.giss.nasa.gov/modelE/
# Via: https://www.bloomberg.com/graphics/2015-whats-warming-the-world/

import argparse
import csv
import json
import math
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-forcings', dest="FORCINGS_FILE", default="data/forcings.csv", help="Forcings input file")
parser.add_argument('-observed', dest="OBSERVED_FILE", default="data/observed.csv", help="Observed input file")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="JSON output file")

args = parser.parse_args()

START_YEAR = 1880
END_YEAR = 2005
BASELINE_YEAR_START = 1880
BASELINE_YEAR_END = 1910
RANGE = (-1, 2)
FORCING_HEADERS = [
    {"name": "Orbital changes", "label": "Earth's orbital changes"},
    {"name": "Solar", "label": "Solar temperature"},
    {"name": "Volcanic", "label": "Volcanic activity"},
    {"name": "Natural", "label": "All natural factors"},
    {"name": "Land use", "label": "Deforestation"},
    {"name": "Anthropogenic tropospheric aerosol", "label": "Ozone pollution"},
    {"name": "Greenhouse gases", "label": "Greenhouse gases"},
    {"name": "Human", "label": "All human factors"}
]

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

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

# Retrieve data
observed = readCSV(args.OBSERVED_FILE)
forcings = readCSV(args.FORCINGS_FILE)

# convert celsius to fahrenheit
for i, r in enumerate(observed):
    observed[i]["Annual_Mean"] = (9.0/5.0 * r["Annual_Mean"] + 32)

# convert kelvin to fahrenheit
for i, r in enumerate(forcings):
    headers = ["All forcings"] + [h["name"] for h in FORCING_HEADERS]
    for h in headers:
        forcings[i][h] = (9.0/5.0 * r[h]) - 459.67

# get baseline values
def getBaseline(rows, colName, startYear, endYear):
    values = [r[colName] for r in rows if startYear <= r["Year"] <= endYear]
    return mean(values)

fBaseline = getBaseline(forcings, "All forcings", BASELINE_YEAR_START, BASELINE_YEAR_END)
oBaseline = getBaseline(observed, "Annual_Mean", BASELINE_YEAR_START, BASELINE_YEAR_END)

# retrieve data
def getData(rows, colName, startYear, endYear, baseline):
    d = []
    for row in rows:
        if startYear <= row["Year"] <= endYear:
            d.append((row["Year"], row[colName]-baseline))
    return d

# process data
rows = []
rows.append({"label": "Observed global temperature", "data": getData(observed, "Annual_Mean", START_YEAR, END_YEAR, oBaseline)})
for header in FORCING_HEADERS:
    rows.append({"label": header["label"], "data": getData(forcings, header["name"], START_YEAR, END_YEAR, fBaseline)})

jsonOut = {
    "domain": (START_YEAR, END_YEAR),
    "range": RANGE,
    "data": rows
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(rows), args.OUTPUT_FILE)
