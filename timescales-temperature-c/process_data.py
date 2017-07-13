# -*- coding: utf-8 -*-

import argparse
import csv
from datetime import datetime, timedelta
import json
import math
import matplotlib.pyplot as plt
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

PALEO_DATA_FILE = "data/glhad_eiv_composite.csv"
INSTRUMENT_DATA_FILE = "data/188001-201705.csv"

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
            if key == "Value":
                arr[i][key] = parseNumber(item[key])
            elif key == "Date":
                arr[i][key] = parseDate(item[key])
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

# read data
paleoData = readCSV(PALEO_DATA_FILE)
instrData = readCSV(INSTRUMENT_DATA_FILE)

# sort data
paleoData = sorted(paleoData, key=lambda k: k["Date"])
instrData = sorted(instrData, key=lambda k: k["Date"])

# remove paleo data that is invalid or available in intrument data
earliestInstrYear = instrData[0]["Date"][0]
paleoData = [d for d in paleoData if d["Date"][0] < earliestInstrYear and d["Value"]!="NaN"]

# convert instrument data to absolute
for i,d in enumerate(instrData):
    instrData[i]["Abs"] = d["Value"] + BASELINE

# determine the baseline for paleo (1961–1990)
paleoBaselineValues = [d["Abs"] for d in instrData if 1961 <= d["Date"][0] <= 1990]
paleoBaseline = mean(paleoBaselineValues)
print "Paleo baseline: %s" % paleoBaseline

# convert paleo data to absolute
for i,d in enumerate(paleoData):
    paleoData[i]["Abs"] = d["Value"] + paleoBaseline

# combine the data
combinedData = paleoData + instrData

# convert date to int
for i,d in enumerate(combinedData):
    combinedData[i]["Date"] = dateToSeconds(d["Date"])

xs = [d["Date"] for d in combinedData]
ys = [d["Value"] for d in combinedData]
plt.plot(xs, ys)
plt.show()
