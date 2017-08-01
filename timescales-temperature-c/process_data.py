# -*- coding: utf-8 -*-

import argparse
import csv
from datetime import datetime, timedelta
import json
import math
import os
import sys

# Sources:
    # NOAA / Global Surface Temperature Anomalies / Monthly / (1880 - present)
    # https://www.ncdc.noaa.gov/monitoring-references/faq/anomalies.php
    # Baseline: 20th century average (1901-2000)

    # Mann et al. 2008 / 2,000 Year Hemispheric and Global Temperature Reconstructed / Annual / (0 - 2006)
    # https://www.ncdc.noaa.gov/paleo-search/study/6252
    # http://www.pnas.org/content/105/36/13252.full
    # Baseline: 1961–1990 average

# 20the century average temperature in °C
# https://www.ncdc.noaa.gov/sotc/global/201613
BASELINE = 13.9

START_YEAR = 1880
END_YEAR = 2016
PALEO_DATA_FILE = "data/glhad_eiv_composite.csv"
# INSTRUMENT_DATA_FILE = "data/188001-201705.csv"
INSTRUMENT_DATA_FILE = "data/1880-2017.csv"
OUTPUT_FILE = "data/processed_data.json"
GRADIENT = ["#8ac1f2", "#c643c4", "#ff3f3f"]

def dateToSeconds(date):
    (year, month, day) = date
    dt = datetime(int(year), month, day)
    unix = datetime(1970,1,1)
    return (dt - unix).total_seconds()

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

def parseDate(string):
    year = 0
    month = 1
    # a year
    if len(string) <= 4:
        year = int(string)
    # a year and month
    else:
        year = int(string[:4])
        month = int(string[4:])
    return (year, month, 1)

def parseNumber(string):
    try:
        num = float(string)
        if "." not in string:
            num = int(string)
        return num
    except ValueError:
        return string

def parseRows(arr):
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
            rows = parseRows(rows)
    return rows

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [255,255,255]
  return tuple([int(hex[i:i+2], 16) for i in range(1,6,2)])

def rgb2hex(rgb):
  # [255,255,255] -> "0xFFFFFF"
  rgb = [int(x) for x in list(rgb)]
  return "0x"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in rgb]).upper()

def lerp(a, b, amount):
    return (b-a) * amount + a

def lerpColor(s, f, amount):
    rgb = [
      int(s[j] + amount * (f[j]-s[j]))
      for j in range(3)
    ]
    return tuple(rgb)

def norm(value, a, b):
    n = 1.0 * (value - a) / (b - a)
    n = min(n, 1)
    n = max(n, 0)
    return n

def getColor(grad, amount):
    gradLen = len(grad)
    i = (gradLen-1) * amount
    remainder = i % 1
    rgb = (0,0,0)
    if remainder > 0:
        rgb = lerpColor(grad[int(i)], grad[int(i)+1], remainder)
    else:
        rgb = grad[int(i)]
    return int(rgb2hex(rgb), 16)


# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# read data
paleoData = readCSV(PALEO_DATA_FILE)
instrData = readCSV(INSTRUMENT_DATA_FILE)

# sort data
paleoData = sorted(paleoData, key=lambda k: k["Date"])
instrData = sorted(instrData, key=lambda k: k["Date"])

# remove paleo data that is invalid or available in intrument data
earliestInstrYear = instrData[0]["Date"]
paleoData = [d for d in paleoData if d["Date"] < earliestInstrYear and d["Value"]!="NaN"]

# convert instrument data to absolute
for i,d in enumerate(instrData):
    instrData[i]["Abs"] = d["Value"] + BASELINE

# determine the baseline for paleo (1961–1990)
paleoBaselineValues = [d["Abs"] for d in instrData if 1961 <= d["Date"] <= 1990]
paleoBaseline = mean(paleoBaselineValues)
print "Paleo baseline: %s" % paleoBaseline

# convert paleo data to absolute
for i,d in enumerate(paleoData):
    paleoData[i]["Abs"] = d["Value"] + paleoBaseline

# combine the data
combinedData = paleoData + instrData

# filter
combinedData = [d for d in combinedData if START_YEAR <= d["Date"] <= END_YEAR]

# convert everything to fahrenheit
for i,d in enumerate(combinedData):
    combinedData[i]["Value"] = d["Value"] * 1.8
    combinedData[i]["Abs"] = d["Abs"] * 1.8 + 32

# plot data
xs = [d["Date"] for d in combinedData]
ys = [d["Abs"] for d in combinedData]
# import matplotlib.pyplot as plt
# plt.plot(xs, ys)
# plt.show()

dataDomain = [xs[0], xs[-1]]
dataRange = [math.floor(min(ys)), math.ceil(max(ys))]

# get colors
for i,d in enumerate(combinedData):
    n = norm(d["Abs"], dataRange[0], dataRange[1])
    combinedData[i]["Norm"] = n
    combinedData[i]["Color"] = getColor(GRADIENT, n)

data = [(round(d["Abs"],3), d["Color"]) for d in combinedData]

jsonData = {
    "data": data,
    "domain": dataDomain,
    "range": dataRange
}

# Retrieve existing data if exists
jsonOut = {}
if os.path.isfile(OUTPUT_FILE):
    with open(OUTPUT_FILE) as f:
        jsonOut = json.load(f)
jsonOut["temperature"] = jsonData

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(data), OUTPUT_FILE)
