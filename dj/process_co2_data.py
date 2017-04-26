# -*- coding: utf-8 -*-

# Description: takes the raw CO2 data files provided by NOAA and produces a .json file for use by the UI
# Sources:
#   - Full Mauna Loa CO2 record (1958-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_mlo.txt
#   - Global monthly mean CO2 (1980-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_gl.txt

import json
import os

DATA_FILES = [
    {"file": "data/co2_mm_mlo.txt", "header": ["year", "month", "decimal", "average", "interpolated", "trend", "days"]},
    {"file": "data/co2_mm_gl.txt", "header": ["year", "month", "decimal", "average", "trend"]}
]
OUTPUT_FILE = "data/processed_data.json"
START_YEAR = 1959
END_YEAR = 2016

def parseNumber(string):
    try:
        num = float(string)
        if "." not in string:
            num = int(string)
        return num
    except ValueError:
        return string

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

        date = "%s-%s-01" % (d["year"], str(d["month"]).zfill(2))

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
            data[index]["trend"] = trend

        # Otherwise, add it
        else:
            data.append({"date": date, "value": value, "trend": trend})

# Sort by date
data = sorted(data, key=lambda k: k["date"])
values = [d["value"] for d in data]

# Put data into rows to make data smaller
jsonHeader = ["date", "value", "trend"]
jsonRows = [[d["date"], d["value"], d["trend"]] for d in data]
jsonData = {
    "header": jsonHeader,
    "rows": jsonRows,
    "meta": {
        "title": "Atmospheric Carbon Dioxide",
        "source": "National Oceanic and Atmospheric Administration",
        "sourceURL": "https://www.esrl.noaa.gov/gmd/ccgg/trends/",
        "dateRange": [data[0]["date"], data[-1]["date"]],
        "valueRange": [min(values), max(values)]
    }
}

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump({"co2": jsonData}, f)
    print "Wrote %s rows to %s" % (len(jsonRows), OUTPUT_FILE)
