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

INPUT_FILE = "data/annotations.json"
OUTPUT_FILE = "data/processed_data.json"

data = {}
with open(INPUT_FILE) as f:
    data = json.load(f)

dateKeys = ["startDate", "endDate", "datePosition"]
for key in data:
    for i,a in enumerate(data[key]):
        for k in dateKeys:
            if k in a:
                data[key][i][k] = dateStringToSeconds(a[k])

# Retrieve existing data if exists
jsonOut = {}
if os.path.isfile(OUTPUT_FILE):
    with open(OUTPUT_FILE) as f:
        jsonOut = json.load(f)

jsonOut["annotations"] = data

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote annotations to %s" % OUTPUT_FILE
