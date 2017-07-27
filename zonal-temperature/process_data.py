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
import numpy as np
from netCDF4 import Dataset
import os
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/gistemp1200_ERSSTv4.nc", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1990, type=int, help="Start year")
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
# RANGE = (-6, 6) # Celsius
RANGE = (-11, 11) # Fahrenheit

GRADIENT = [
    "#4B94D8", # blue
    "#D3D3D3", # gray
    "#D83636" #red
]

def savitzky_golay(y, window_size, order, deriv=0, rate=1):
    try:
        window_size = np.abs(np.int(window_size))
        order = np.abs(np.int(order))
    except ValueError, msg:
        raise ValueError("window_size and order have to be of type int")
    if window_size % 2 != 1 or window_size < 1:
        raise TypeError("window_size size must be a positive odd number")
    if window_size < order + 2:
        raise TypeError("window_size is too small for the polynomials order")
    order_range = range(order+1)
    half_window = (window_size -1) // 2
    # precompute coefficients
    b = np.mat([[k**i for i in order_range] for k in range(-half_window, half_window+1)])
    m = np.linalg.pinv(b).A[deriv] * rate**deriv * math.factorial(deriv)
    # pad the signal at the extremes with
    # values taken from the signal itself
    firstvals = y[0] - np.abs( y[1:half_window+1][::-1] - y[0] )
    lastvals = y[-1] + np.abs(y[-half_window-1:-1][::-1] - y[-1])
    y = np.concatenate((firstvals, y, lastvals))
    return np.convolve( m[::-1], y, mode='valid')

# Add colors
def hex2rgb(hex):
    # "#FFFFFF" -> [255,255,255]
    return tuple([int(hex[i:i+2], 16) for i in range(1,6,2)])

def rgb2hex(rgb):
    # [255,255,255] -> "0xFFFFFF"
    rgb = [int(x) for x in list(rgb)]
    return "0x"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in rgb]).upper()

def lerpColor(s, f, amount):
    rgb = [
      int(s[j] + amount * (f[j]-s[j]))
      for j in range(3)
    ]
    return tuple(rgb)

def norm(value, a, b):
    n = 1.0 * (value - a) / (b - a)
    n = min(n, 1)
    n = max(n, 0)
    return n

def getColor(grad, amount):
    gradLen = len(grad)
    i = (gradLen-1) * amount
    remainder = i % 1
    rgb = (0,0,0)
    if remainder > 0:
        rgb = lerpColor(grad[int(i)], grad[int(i)+1], remainder)
    else:
        rgb = grad[int(i)]
    return int(rgb2hex(rgb), 16)

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

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
                # convert to Fahrenheit
                values = [v*1.8 for v in values if v != "--"]
                if len(values) > 0:
                    arr += values
            value = mean(arr)
            zoneData.append(value)
    # window: 5 years (12 months x 5)
    trendData = savitzky_golay(zoneData, 12*5+1, 3)
    data.append([zoneData, list(trendData)])
    print "Zone %s complete" % (zone+1)
data = list(reversed(data))

# # add colors
# for i,values in enumerate(data):
#     for j,value in enumerate(values):
#         n = norm(value, RANGE[0], RANGE[1])
#         color = getColor(GRADIENT, n)
#         data[i][j] = (value, color)

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
