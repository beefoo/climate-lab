# -*- coding: utf-8 -*-

# Sources:
# ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_annmean_mlo.txt
# ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/antarctica/law/law2006.txt
# ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/antarctica/epica_domec/edc-co2.txt
# http://cdiac.ess-dive.lbl.gov/ftp/trends/co2/vostok.icecore.co2

import math
import matplotlib.pyplot as plt
import numpy as np
import os
import sys

DATA = [
    {"file": "data/co2_annmean_mlo.txt", "label": "Mauna Loa", "yearKey": "year", "valueKey": "mean", "color": "tab:blue"},
    {"file": "data/law2006.txt", "label": "Law", "yearKey": "YearAD", "valueKey": "CO2spl", "color": "tab:orange"},
    {"file": "data//edc-co2.txt", "label": "EPICA", "yearKey": "Age", "valueKey": "CO2", "bp": 1950, "color": "tab:green"},
    {"file": "data/vostok.icecore.co2.txt", "label": "Vostok", "yearKey": "GasAge", "valueKey": "CO2", "bp": 1950, "color": "tab:purple"}
]
PRESENT = 2017
START_YEARS_BP = 110000

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

def readTxt(filename):
    rows = []
    if os.path.isfile(filename):
        with open(filename, 'rb') as f:
            lines = [line.split() for line in f if not line.startswith("#")]
            header = lines.pop(0)
            rows = []
            for line in lines:
                row = {}
                for i,h in enumerate(header):
                    try:
                        row[h] = line[i]
                    except IndexError:
                        print "Index Error %s" % filename
                        sys.exit(1)
                rows.append(row)
            rows = parseNumbers(rows)
    return rows

# plot the data
for entry in DATA:
    data = readTxt(entry["file"])
    years = []
    values = []
    for row in data:
        year = row[entry["yearKey"]]
        yearbp = PRESENT-year
        if "bp" in entry:
            bp = entry["bp"]
            yearbp = (PRESENT - bp) + year
        if yearbp > START_YEARS_BP:
            continue
        years.append(yearbp)
        values.append(row[entry["valueKey"]])

    plt.plot(years, values, color=entry["color"], label=entry["label"])

plt.ylabel('CO2 ppm')
plt.xlabel('Years Before 2017')
plt.gca().invert_xaxis()
plt.legend()
plt.show()
