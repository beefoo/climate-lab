# -*- coding: utf-8 -*-

# Source:
# NASA GISS
# Zonal annual means, 1880-present
# https://data.giss.nasa.gov/gistemp/

import argparse
import csv
from datetime import datetime, timedelta
import json
import math
from netCDF4 import Dataset
import os
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/gistemp1200_ERSSTv4.nc", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1980, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2016, type=int, help="End year")
parser.add_argument('-zones', dest="ZONES", default=9, type=int, help="Number of zones")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="Output file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
OUTPUT_FILE = args.OUTPUT_FILE
START_YEAR = args.START_YEAR
END_YEAR = args.END_YEAR
ZONES = args.ZONES
RANGE = (-6, 6)

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude between -90 and 90
lons = ds.variables['lon'][:] # float: longitude between -180 and 180
times = ds.variables['time'][:] # int: days since 1/1/1800
tempData = ds.variables['tempanomaly'][:] # short: surface temperature anomaly (K), e.g. tempData[time][lat][lon]

if 1.0*len(lats)/ZONES % 1 > 0:
    print "Warning: zones not a divisor of %s" % len(lats)

# retrieve data from each zone
data = []
zoneSize = len(lats) / ZONES
baseDate = "1800-01-01"
bd = datetime.strptime(baseDate, "%Y-%m-%d")
for zone in range(ZONES):
    i0 = zone * zoneSize
    i1 = (zone+1) * zoneSize
    zoneLats = lats[i0:i1]
    zoneData = []
    for j, days in enumerate(times):
        theDate = bd + timedelta(days=int(days))
        theYear = theDate.year
        theMonth = theDate.month
        if START_YEAR <= theYear <= END_YEAR:
            arr = []
            for i, lat in enumerate(zoneLats):
                values = tempData[j][i0+i][:]
                values = [v for v in values if v != "--"]
                if len(values) > 0:
                    arr += values
            value = mean(arr)
            zoneData.append(value)
    data.append(zoneData)
    print "Zone %s complete" % (zone+1)
data = list(reversed(data))

jsonData = {
    "zoneData": data,
    "domain": [START_YEAR, END_YEAR],
    "range": RANGE
}

# Retrieve existing data if exists
jsonOut = jsonData
if os.path.isfile(args.OUTPUT_FILE):
    with open(args.OUTPUT_FILE) as f:
        jsonOut = json.load(f)
        jsonOut.update(jsonData)

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s zones to %s" % (len(data), args.OUTPUT_FILE)
