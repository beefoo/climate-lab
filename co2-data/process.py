# -*- coding: utf-8 -*-

# Sources:
# ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_annmean_mlo.txt
# ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/antarctica/law/law2006.txt
# ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/antarctica/epica_domec/edc-co2.txt
# http://cdiac.ess-dive.lbl.gov/ftp/trends/co2/vostok.icecore.co2
# ftp://ftp.ncdc.noaa.gov/pub/data/paleo/icecore/antarctica/vostok/readme_petit1999.txt

import json
import math
import numpy as np
import os
import sys

DATA = [
    {"file": "data/co2_annmean_mlo.txt", "label": "Mauna Loa", "yearKey": "year", "valueKey": "mean", "errorKey": "unc", "color": "tab:blue"},
    {"file": "data/law2006.txt", "label": "Law", "yearKey": "YearAD", "valueKey": "CO2spl", "error": 1.1, "color": "tab:orange"},
    {"file": "data/edc-co2.txt", "label": "EPICA", "yearKey": "Age", "valueKey": "CO2", "errorKey": "sigma", "bp": 1950, "color": "tab:green"},
    {"file": "data/vostok.icecore.co2.txt", "label": "Vostok", "yearKey": "GasAge", "valueKey": "CO2", "error": 3, "bp": 1950, "color": "tab:purple"}
]
PRESENT = 1988
START_YEARS_BP = 110000
SHOW_GRAPH = False
OUTPUT_FILE = "data/co2.json"

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

def rounddown(x, nearest):
    return int(math.floor(1.0 * x / nearest)) * nearest

def roundup(x, nearest):
    return int(math.ceil(1.0 * x / nearest)) * nearest

# plot the data
if SHOW_GRAPH:
    import matplotlib.pyplot as plt

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
            if yearbp > START_YEARS_BP or yearbp < 0:
                continue
            years.append(yearbp)
            values.append(row[entry["valueKey"]])

        plt.plot(years, values, color=entry["color"], label=entry["label"])

    plt.ylabel('CO2 ppm')
    plt.xlabel('Years Before %s' % PRESENT)
    plt.gca().invert_xaxis()
    plt.legend()
    plt.show()

# otherwise, output the data
else:
    years = []
    dataOut = []

    for entry in DATA:
        data = readTxt(entry["file"])

        for row in data:
            year = row[entry["yearKey"]]
            yearbp = PRESENT-year
            if "bp" in entry:
                bp = entry["bp"]
                yearbp = (PRESENT - bp) + year
            if yearbp > START_YEARS_BP or yearbp < 0 or yearbp in years:
                continue

            error = 0
            if "error" in entry:
                error = entry["error"]
            elif "errorKey" in entry:
                error = row[entry["errorKey"]]

            years.append(yearbp)
            dataOut.append([
                int(yearbp),
                row[entry["valueKey"]],
                error
            ])

    # sort by year descending
    dataOut = sorted(dataOut, key=lambda k: k[0], reverse=True)

    # determine range
    values = [d[1] for d in dataOut]
    minValue = rounddown(min(values), 10)
    maxValue = roundup(max(values), 10)

    jsonOut = {
        "title": "Carbon Dioxide (parts per million)",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In nec massa a nunc vehicula aliquam. Nulla vitae sapien risus.",
        "domain": [START_YEARS_BP, 0],
        "range": [minValue, maxValue],
        "xLabel": "Years before present",
        "yLabel": "CO2 ppm",
        "header": ["yearsbp", "value", "error"],
        "data": dataOut
    }

    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(jsonOut, f)
        print "Wrote %s items to %s" % (len(data), OUTPUT_FILE)
