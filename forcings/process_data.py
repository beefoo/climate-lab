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
    {"name": "Orbital changes", "className": "natural", "label": "Earth's orbital changes", "title": "Is it the Earth's orbit?", "sub": "The Earth wobbles on its axis, and its tilt and orbit change over many thousands of years, pushing the climate into and out of ice ages. Yet the influence of orbital changes on the planet's temperature over 125 years has been negligible."},
    {"name": "Solar", "className": "natural", "label": "Solar temperature", "title": "Is it the sun?", "sub": "The sun's temperature varies over decades and centuries. These changes have had little effect on the Earth's overall climate."},
    {"name": "Volcanic", "className": "natural", "label": "Volcanic activity", "title": "Is it volcanoes?", "sub": "The data suggest no. Human industry emits about 100 times more CO₂ than volcanic activity, and eruptions release sulfate chemicals that can actually cool the atmosphere for a year or two."},
    {"name": "Natural", "className": "natural", "label": "All natural factors", "title": "Is it all natural factors combined?", "sub": "If it were, then the response to natural factors should match the observed temperature. Adding the natural factors together just doesn't add up."},
    {"name": "Human", "className": "human", "label": "All human factors", "title": "Is it all human factors combined?", "sub": "Greenhouse gases warm the atmosphere. Aerosols cool it a little bit. Ozone and land-use changes add and subtract a little. Together they match the observed temperature, particularly since 1950."},
    {"name": "Greenhouse gases", "className": "human", "label": "Greenhouse gases", "title": "It Really Is Greenhouse Gases", "sub": "Atmospheric CO₂ levels are 40 percent higher than they were in 1750. The orange line shows the influence of greenhouse gas emissions. It's no contest."},
    {"name": "Anthropogenic tropospheric aerosol", "className": "human", "label": "Ozone pollution", "title": "Is it ozone pollution?", "sub": "Natural ozone high in the atmosphere blocks harmful sunlight and cools things slightly. Closer to Earth, ozone is created by pollution and traps heat, making the climate a little bit hotter. What's the overall effect? Not much."},
    {"name": "Land use", "className": "human", "label": "Deforestation", "title": "Is it deforestation?", "sub": "Humans have cut, plowed, and paved more than half the Earth's land surface. Dark forests are yielding to lighter patches, which reflect more sunlightâ€”and have a slight cooling effect."}
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
    rows.append({"label": header["label"], "className": header["className"], "title": header["title"], "sub": header["sub"], "data": getData(forcings, header["name"], START_YEAR, END_YEAR, fBaseline)})

jsonOut = {
    "domain": (START_YEAR, END_YEAR),
    "range": RANGE,
    "data": rows
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(rows), args.OUTPUT_FILE)
