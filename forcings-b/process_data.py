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
    {"name": "Orbital changes", "className": "natural", "label": "Earth's orbital changes", "title": "Is it the Earth's orbit?", "sub": "The Earth wobbles as it orbits the sun, changing the way sunlight reaches the surface. In the past, these shifts brought us in an out of ice ages—but the effect over the last 125 years is small."},
    {"name": "Solar", "className": "natural", "label": "Solar temperature", "title": "Is it the sun?", "sub": "The sun's temperature varies over decades and centuries. These changes have had little effect on the Earth's overall climate."},
    {"name": "Volcanic", "className": "natural", "label": "Volcanic activity", "title": "Is it volcanoes?", "sub": "Erupting volcanoes throw a layer of dust and chemicals into the air. This mix includes aerosols, which can have a short-term cooling effect."},
    {"name": "Natural", "className": "natural", "label": "All natural factors", "title": "Is it all natural factors combined?", "sub": "If these forces were making the planet warmer, the graph would show that their combined effect matching the rising temperature. Does it?"},
    {"name": "Land use", "className": "human", "label": "Deforestation", "title": "Is it deforestation?", "sub": "When forests are cleared, the land underneath reflects more sunlight than the darker trees. This light bounces off the Earth’s surface, causing the planet to cool a little."},
    {"name": "Anthropogenic tropospheric aerosol", "className": "human", "label": "Ozone pollution", "title": "Is it ozone pollution?", "sub": "Ozone has a different effect depending on where it is in the atmosphere. In the higher layers, it blocks light and keeps the planet cool. Lower down, ozone is a pollutant and traps heat near the Earth. Overall, the warming effect isn’t strong."},
    {"name": "Greenhouse gases", "className": "human", "label": "Greenhouse gases", "title": "Is it greenhouse gases?", "sub": "The rise in heat-trapping greenhouse gases is the only factor that matches the world’s warming since 1880."},
    {"name": "Human", "className": "human", "label": "All human factors", "title": "Is it all human factors combined?", "sub": "Greenhouse gases warm the atmosphere. Other factors cool it a little. Together they match the observed temperature, particularly since 1950."}
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
