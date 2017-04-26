# -*- coding: utf-8 -*-

# Description: takes the raw temperature anomaly data files provided by NOAA and produces a .json file for use by the UI
# Sources:
#   - Global Land and Ocean Temperature Anomalies: https://www.ncdc.noaa.gov/cag/time-series/global/globe/land_ocean/p12/12/1880-2017.csv

import csv
import json
import os

INPUT_FILE = "data/188001-201612_land_ocean.csv"
OUTPUT_FILE = "data/processed_data.json"
START_YEAR = 1959
END_YEAR = 2016

# read csv
data = []
with open(INPUT_FILE, 'rb') as f:
    r = csv.reader(f, delimiter=',')
    for skip in range(4):
        next(r, None)
    # for each row
    for _year, _value in r:
        year = int(_year[:4])
        month = int(_year[4:])
        if year >= START_YEAR and year <= END_YEAR:
            value = float(_value)
            date = "%s-%s-01" % (year, str(month).zfill(2))
            data.append({"date": date, "value": value})

# Sort by date
data = sorted(data, key=lambda k: k["date"])
values = [d["value"] for d in data]

# Put data into rows to make data smaller
jsonHeader = ["date", "value"]
jsonRows = [[d["date"], d["value"]] for d in data]
jsonData = {
    "header": jsonHeader,
    "rows": jsonRows,
    "meta": {
        "label": "Temperature",
        "title": "Global Temperature Anomalies",
        "source": "National Oceanic and Atmospheric Administration",
        "sourceURL": "https://www.ncdc.noaa.gov/climate-monitoring/",
        "dateRange": [data[0]["date"], data[-1]["date"]],
        "valueRange": [min(values), max(values)]
    }
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
    print "Wrote %s rows to %s" % (len(jsonRows), OUTPUT_FILE)
