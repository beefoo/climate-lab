# -*- coding: utf-8 -*-
# Data source: ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/greenland/summit/gisp2/

# python graph.py -start 18000 -end 11000 -graph co2
# python graph.py -graph na

import argparse
import csv
import math
import matplotlib.pyplot as plt
import matplotlib.transforms as transforms
import numpy as np
import os
import pandas as pd
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-out', dest="OUTPUT_FILE", default="graph.png", help="output file")
parser.add_argument('-start', dest="START", type=int, default=13100, help="start years BP")
parser.add_argument('-end', dest="END", type=int, default=12500, help="end years BP")
parser.add_argument('-graph', dest="GRAPH", default="accumulation", help="graph name")

args = parser.parse_args()
START = args.START
END = args.END
GRAPH = args.GRAPH
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

naData = readCSV("data/cleaned_gisp2_na.csv")
# add year
startI = 0
for i,d in enumerate(naData):
    if d["Age"] != "":
        naData[i]["year"] = PRESENT_YEAR - int(2004 - d["Age"] * 1000)
    else:
        naData[i]["year"] = 0

if GRAPH == "co2":
    # co2 plot
    x = [d["year"] for d in co2Data if START >= d["year"] >= END]
    y = [d["CO2"] for d in co2Data if START >= d["year"] >= END]
    fig, ax = plt.subplots()
    ax.set_xlabel('Years before present')
    ax.set_ylabel('Carbon dioxide concentration (parts per million)', color='#2a8e36')
    ax.plot(x, y, color='#2a8e36', linewidth=2.5)

    # line for 2016 measurement
    ax.axhline(y=403, color="red", linewidth=2.5)
    trans = transforms.blended_transform_factory(ax.get_yticklabels()[0].get_transform(), ax.transData)
    ax.text(1, 385, "2016 carbon dioxide concentration", color="red", transform=trans, ha="right", va="bottom")

elif GRAPH == "na":
    # temperature plot
    x = [d["year"] for d in tempData if START >= d["year"] >= END]
    y = [d["Temperature"] for d in tempData if START >= d["year"] >= END]
    fig, ax1 = plt.subplots()
    # ax1.axis([START, END, math.floor(min(y)), math.ceil(max(y))])
    ax1.set_xlabel('Years before present')
    ax1.set_ylabel('Temperature (degrees Celsius)', color='#ce7000')
    ax1.plot(x, y, color='#ce7000', linewidth=2.5)

    # co2 plot
    ax2 = ax1.twinx()
    x = [d["year"] for d in naData if START >= d["year"] >= END]
    y = [d["Sodium"] for d in naData if START >= d["year"] >= END]
    ax2.set_ylabel('Sodium levels (parts per billion)', color='#00676d')
    ax2.plot(x, y, color='#00676d', linewidth=2.5)

else:
    # temperature plot
    x = [d["year"] for d in tempData if START >= d["year"] >= END]
    y = [d["Temperature"] for d in tempData if START >= d["year"] >= END]
    fig, ax1 = plt.subplots()
    # ax1.axis([START, END, math.floor(min(y)), math.ceil(max(y))])
    ax1.set_xlabel('Years before present')
    ax1.set_ylabel('Temperature (degrees Celsius)', color='#ce7000')
    ax1.plot(x, y, color='#ce7000', linewidth=2.5)

    # co2 plot
    ax2 = ax1.twinx()
    x = [d["year"] for d in accumData if START >= d["year"] >= END]
    y = [d["Accumulation"] for d in accumData if START >= d["year"] >= END]
    ax2.set_ylabel('Precipitation rate (meters of ice)', color='#00676d')
    ax2.plot(x, y, color='#00676d', linewidth=2.5)

# show plot
plt.xlim(START, END)  # decreasing years before present
plt.style.use('fivethirtyeight')
plt.show()
