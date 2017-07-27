# -*- coding: utf-8 -*-

# Gridded Monthly Temperature Anomaly Data
# source: https://data.giss.nasa.gov/gistemp/
# inspect: ncdump -h data/gistemp1200_ERSSTv4.nc
# compile: ffmpeg -framerate 30/1 -i img/frames/frame%05d.png -c:v libx264 -r 30 -pix_fmt yuv420p -q:v 1 video/temperature_1950-2016.mp4

import argparse
import datetime
import json
import math
import os
from netCDF4 import Dataset
from pprint import pprint
from pyproj import Proj
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/gistemp1200_ERSSTv4.nc", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1990, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2016, type=int, help="End year")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="Output file")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
OUTPUT_FILE = args.OUTPUT_FILE
START_YEAR = args.START_YEAR
END_YEAR = args.END_YEAR
GRADIENT = [
    "#4B94D8", # blue
    # "#FCEF76", # yellow
    "#212121", # black
    "#D83636" #red
]
MIN_VALUE = -4.1
MAX_VALUE = 4.3
LATLON_OFFSET = 0.8

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [255,255,255]
  return tuple([int(hex[i:i+2], 16) for i in range(1,6,2)])

def rgb2hex(rgb):
  # [255,255,255] -> "0xFFFFFF"
  rgb = [int(x) for x in list(rgb)]
  return "0x"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in rgb]).upper()

def lerp(a, b, amount):
    return (b-a) * amount + a

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

robinsonProj = Proj(ellps='WGS84',proj='robin')

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude
lons = ds.variables['lon'][:] # float: longitude
times = ds.variables['time'][:] # int: days since 1/1/1800
tempData = ds.variables['tempanomaly'][:] # short: surface temperature anomaly (K), e.g. tempData[time][lat][lon]
w = len(lons)
h = len(lats)
t = len(times)

# Convert lat/lon to pixels using Robinson projection
coordinates = []
values = []
minLens = []
for y, lat in enumerate(lats):
    for x, lon in enumerate(lons):
        o = LATLON_OFFSET
        p1 = robinsonProj(lon-o, lat-o)
        p2 = robinsonProj(lon+o, lat-o)
        p3 = robinsonProj(lon+o, lat+o)
        p4 = robinsonProj(lon-o, lat+o)
        c = [p1, p2, p3, p4]
        # get shortest side
        minLen = min([abs(c[0][0] - c[1][0]), abs(c[2][0] - c[3][0]), abs(c[1][1] - c[2][1])])
        coordinates.append({
            "poly": c,
            "center": robinsonProj(lon, lat),
            "minLen": minLen
        })
        values += c
        minLens.append(minLen)
cxs = [c[0] for c in values]
cys = [c[1] for c in values]
cbounds = [min(cxs), min(cys), max(cxs), max(cys)]
minLens = (min(minLens), max(minLens))

def normCoordinate(c, bounds):
    nx = norm(c[0], cbounds[0], cbounds[2])
    ny = norm(c[1], cbounds[3], cbounds[1])
    return (nx, ny)

for i, c in enumerate(coordinates):
    poly = [normCoordinate(cc, cbounds) for cc in c["poly"]]
    coordinates[i]["poly"] = poly
    coordinates[i]["center"] = normCoordinate(c["center"], cbounds)
    coordinates[i]["multiplier"] =  norm(c["minLen"], minLens[0], minLens[1])

baseDate = "1800-01-01"
bd = datetime.datetime.strptime(baseDate, "%Y-%m-%d")
emptyColor = hex2rgb("#212121")

def tempToColor(v):
    color = emptyColor
    if v != "--":
        n = norm(v, MIN_VALUE, MAX_VALUE)
        color = getColor(GRADIENT, n)
    return color

def tempToRadius(v):
    mult = 0
    if v != "--":
        if v > 0:
            mult = norm(v, 0, MAX_VALUE)
        else:
            mult = norm(abs(v), 0, abs(MIN_VALUE))
    return mult

data = []

for i, days in enumerate(times):
    theDate = bd + datetime.timedelta(days=int(days))
    theYear = theDate.year
    theMonth = theDate.month
    theMap = []
    if START_YEAR <= theYear <= END_YEAR:
        for y, lat in enumerate(lats):
            for x, lon in enumerate(lons):
                r = y * w + x
                value = tempData[i][y][x]
                color = tempToColor(value)
                c = coordinates[r]
                center = c["center"]
                # determine size
                radius = tempToRadius(value)
                radius = c["multiplier"] * radius
                theMap.append((
                    round(center[0],3),
                    round(center[1],3),
                    round(radius,3),
                    color
                ))
        data.append(theMap)
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*i/t*100,1))
    sys.stdout.flush()

print "\rDone."

jsonData = {
    "mapData": data,
    "domain": [START_YEAR, END_YEAR],
    "mapDimensions": [w, h]
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
    print "Wrote %s times to %s" % (len(data), args.OUTPUT_FILE)
