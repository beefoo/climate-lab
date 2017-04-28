# -*- coding: utf-8 -*-

# Description: takes the raw CO2 data files provided by NOAA and produces a .json file for use by the UI
# Sources:
#   - Full Mauna Loa CO2 record (1958-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_mlo.txt
#   - Global monthly mean CO2 (1980-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_gl.txt

from datetime import datetime
import json
import os
from shared import *

DATA_FILES = [
    {"file": "data/co2_mm_mlo.txt", "header": ["year", "month", "decimal", "average", "interpolated", "trend", "days"]},
    {"file": "data/co2_mm_gl.txt", "header": ["year", "month", "decimal", "average", "trend"]}
]
OUTPUT_FILE = "data/processed_data.json"
START_YEAR = 1959
END_YEAR = 2016

def readFile(filename, header):
    rows = []
    with open(filename, 'rb') as f:
        lines = [line.strip().split() for line in f if not line.startswith("#")]
        for line in lines:
            values = [parseNumber(l) for l in line]
            rows.append(dict(zip(header, values)))
    return rows

data = []
for df in DATA_FILES:
    fileData = readFile(df["file"], df["header"])
    for d in fileData:
        # skip data out of range
        if d["year"] < START_YEAR or d["year"] > END_YEAR:
            continue

        date = "%s-%s-01T00:00:00Z" % (d["year"], str(d["month"]).zfill(2))
        # date = datetime(d["year"], d["month"], 1)

        # Use interpolated value if average not available
        value = d["average"]
        if value < 0 and "interpolated" in d:
            value = d["interpolated"]
        trend = d["trend"]

        # Check if date already exists
        found = [i for i,item in enumerate(data) if item["date"]==date]

        # If exists, overwrite data
        if len(found):
            index = found[0]
            data[index]["value"] = value

        # Otherwise, add it
        else:
            data.append({"date": date, "value": value})

# Sort by date
data = sorted(data, key=lambda k: k["date"])

# Normalize dates
years = END_YEAR - START_YEAR + 1
months = years * 12
if months != len(data):
    print "Warning: missing month values"

# Normalize values
values = [d["value"] for d in data]
startDate = data[0]["date"]
endDate = data[-1]["date"]

# Build JSON data
jsonData = {
    "values": values,
    "unit": "month",
    "dateRange": [startDate, endDate],
    "valueRange": [min(values), max(values)],
    "meta": {
        "label": "Carbon Dioxide",
        "title": "Atmospheric Carbon Dioxide",
        "source": "National Oceanic and Atmospheric Administration",
        "sourceURL": "https://www.esrl.noaa.gov/gmd/ccgg/trends/",
        "dateRange": [startDate, endDate],
        "valueRange": [min(values), max(values)]
    }
}

# Retrieve existing data if exists
jsonOut = {}
if os.path.isfile(OUTPUT_FILE):
    with open(OUTPUT_FILE) as f:
        jsonOut = json.load(f)
jsonOut["co2"] = jsonData

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s values to %s" % (len(values), OUTPUT_FILE)
