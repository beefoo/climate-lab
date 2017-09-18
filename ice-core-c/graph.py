# -*- coding: utf-8 -*-
# Data source: ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/greenland/summit/gisp2/

import argparse
import csv
import math
import matplotlib.pyplot as plt
import numpy as np
import os
import pandas as pd
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-out', dest="OUTPUT_FILE", default="graph.png", help="output file")

args = parser.parse_args()
PRESENT_YEAR = 2016

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

# get age/depth data
ageData = readCSV("data/cleaned_gisp2_age.csv")
# add year
for i,d in enumerate(ageData):
    ageData[i]["year"] = PRESENT_YEAR - int(1950 - d["Ice Age"])

# get temperature data
tempData = readCSV("data/cleaned_gisp2_temp.csv")
# add year
for i,d in enumerate(tempData):
    tempData[i]["year"] = PRESENT_YEAR - int(2004 - d["Age"] * 1000)

# get accumulation data
accumData = readCSV("data/cleaned_gisp2_accum.csv")
# add year
for i,d in enumerate(accumData):
    accumData[i]["year"] = PRESENT_YEAR - int(2004 - d["Age"] * 1000)

# get CO2 data
co2Data = readCSV("data/cleaned_gisp2_co2.csv")
# add year
startI = 0
for i,d in enumerate(co2Data):
    # find the closest year via depth
    j = startI
    while ageData[j]["Depth"] < d["Depth"]:
        j += 1
    startI = j
    co2Data[i]["year"] = ageData[j]["year"]

# get the domain
years = [d["year"] for d in tempData] + [d["year"] for d in accumData]

# temperature plot
x = [d["year"] for d in tempData]
y = [d["Temperature"] for d in tempData]
fig, ax1 = plt.subplots()
# ax1.axis([domain[0], domain[1], math.floor(min(tempValues)), math.ceil(max(tempValues))])
ax1.set_xlabel('Years before present')
ax1.set_ylabel('Temperature (degrees Celsius)', color='#ce7000')
ax1.plot(x, y, color='#ce7000', linewidth=2.5)

# co2 plot
ax2 = ax1.twinx()
x = [d["year"] for d in accumData]
y = [d["Accumulation"] for d in accumData]
ax2.set_ylabel('Accumulation (meters of ice)', color='#00676d')
ax2.plot(x, y, color='#00676d', linewidth=2.5)

# show plot
plt.xlim(max(years), 0)  # decreasing time
plt.style.use('fivethirtyeight')
plt.show()
