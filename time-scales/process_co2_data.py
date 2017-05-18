# -*- coding: utf-8 -*-

# Description: takes the raw CO2 data files provided by NOAA and produces a .json file for use by the UI
# Sources:
#   - Full Mauna Loa CO2 record (1958-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_mlo.txt
#   - Global monthly mean CO2 (1980-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_gl.txt

from datetime import datetime, timedelta
import json
import os
from shared import *
import time
import sys

# Define data sources
DATA_SOURCES = {
    "hourly": {
        "filename": "data/co2_mlo_surface-insitu_1_ccgg_HourlyData.dat",
        "source": "https://www.esrl.noaa.gov/gmd/dv/data/?parameter_name=Carbon%2BDioxide&frequency=Hourly%2BAverages",
        "header": ["site_code","year","month","day","hour","minute","second","value","value_unc","nvalue","latitude","longitude","altitude","elevation","intake_height","instrument","qcflag"],
        "unit": "hour"
    },
    "daily": {
        "filename": "data/co2_mlo_surface-insitu_1_ccgg_DailyData.dat",
        "source": "https://www.esrl.noaa.gov/gmd/dv/data/?parameter_name=Carbon%2BDioxide&frequency=Daily%2BAverages",
        "header": ["site_code","year","month","day","hour","minute","second","value","value_unc","nvalue","latitude","longitude","altitude","elevation","intake_height","instrument","qcflag"],
        "unit": "day"
    },
    "monthly": {
        "filename": "data/co2_mm_mlo.txt",
        "source": "https://www.esrl.noaa.gov/gmd/ccgg/trends/data.html",
        "header": ["year","month","decimal_date","value","interpolated","trend","days"],
        "unit": "month"
    },
    "annually": {
        "filename": "data/co2_annmean_mlo.txt",
        "source": "https://www.esrl.noaa.gov/gmd/ccgg/trends/data.html",
        "header": ["year","value","uncertainty"],
        "unit": "year"
    },
    "ice_core": {
        "filename": "data/merged_ice_core_yearly.csv",
        "source": "http://scrippsco2.ucsd.edu/data/atmospheric_co2/icecore_merged_products",
        "header": ["year","value"],
        "unit": "year"
    }
}

DATA_SOURCE = DATA_SOURCES["daily"]
OUTPUT_FILE = "data/processed_data.json"

def dateToSeconds(date):
    (year, month, day, hour) = date
    dt = datetime(int(year), month, day, hour)
    unix = datetime(1970,1,1)
    return (dt - unix).total_seconds()

def readDataFromFile(filename, header):
    rows = []
    with open(filename, 'rb') as f:
        lines = [line.strip().split() for line in f if not line.startswith("#") and not line.startswith("\"")]
        for line in lines:
            values = [parseNumber(l) for l in line]
            row = dict(zip(header, values))

            # Retrieve date
            date = (row["year"], 1, 1, 0)
            if "hour" in row:
                date = (row["year"], row["month"], row["day"], row["hour"])
            elif "day" in row:
                date = (row["year"], row["month"], row["day"], 0)
            elif "month" in row:
                date = (row["year"], row["month"], 1, 0)

            # Retrieve value
            value = row["value"]
            if value < 0 and "interpolated" in row:
                value = row["interpolated"]

            # Add if date is valid
            if value >= 0:
                rows.append({
                    "value": value,
                    "date": date
                })
    return rows

# Read the data
data = readDataFromFile(DATA_SOURCE["filename"], DATA_SOURCE["header"])

# sort data and get ranges
data = sorted(data, key=lambda k: k["date"])
dateRange = (data[0]["date"], data[-1]["date"])
d1 = dateRange[-1]
maxStartDateTuple = (d1[0], d1[1], 1, 0)
maxStartDate = dateToSeconds(maxStartDateTuple)
values = [d["value"] for d in data]
minRangeValues = [d["value"] for d in data if d["date"] >= maxStartDateTuple]

# turn into tuples
tuples = [(dateToSeconds(d["date"]), d["value"]) for d in data]

# Build JSON data
jsonData = {
    "data": tuples,
    "minDomain": (maxStartDate, dateToSeconds(dateRange[1])),
    "maxDomain": (dateToSeconds(dateRange[0]), dateToSeconds(dateRange[1])),
    "minRange": (min(minRangeValues),  max(minRangeValues)),
    "maxRange": (min(values), max(values))
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
    print "Wrote %s items to %s" % (len(tuples), OUTPUT_FILE)
