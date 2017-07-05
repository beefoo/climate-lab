# -*- coding: utf-8 -*-

import datetime
import json
import math
from netCDF4 import Dataset
from PIL import Image
import sys

# Gridded Monthly Temperature Anomaly Data
# source: https://data.giss.nasa.gov/gistemp/
# inspect: ncdump -h data/gistemp1200_ERSSTv4.nc

INPUT_FILE = 'data/gistemp1200_ERSSTv4.nc'
OUTPUT_FILE = 'data/processed_data.json'
GRADIENT = []
MIN_VALUE = -4.1
MAX_VALUE = 4.3

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [255,255,255]
  return [int(hex[i:i+2], 16) for i in range(1,6,2)]

def rgb2hex(RGB):
  # [255,255,255] -> "#FFFFFF"
  RGB = [int(x) for x in RGB]
  return "#"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in RGB])

def lerpColor(s, f, amount):
    rgb = [
      int(s[j] + amount * (f[j]-s[j]))
      for j in range(3)
    ]
    return rgb2hex(rgb)

def norm(value, a, b):
    n = 1.0 * (value - a) / (b - a)
    n = min(n, 1)
    n = max(n, 0)
    return n

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude
lons = ds.variables['lon'][:] # float: longitude
times = ds.variables['time'][:] # int: days since 1/1/1800
w = len(lons)
h = len(lats)
t = len(times)
print "Time: %s x Lon: %s x Lat: %s" % (t, w, h)

tempData = ds.variables['tempanomaly'][:] # short: surface temperature anomaly (K), e.g. tempData[time][lat][lon]
baseDate = "1800-01-01"
bd = datetime.datetime.strptime(baseDate, "%Y-%m-%d")

def dataToImg(data):
    # show image
    im = Image.new("RGB", (w, h))
    pixeldata = [(0,0,0) for n in range(w*h)]
    for y, lat in enumerate(lats):
        for x, lon in enumerate(lons):
            r = y * w + x
            v = data[y][x]
            color = (50,50,50)
            if v != "--":
                n = norm(v, MIN_VALUE, MAX_VALUE)
                red = int(n * 255)
                color = (red, 0, 0)
            pixeldata[(h-1-y) * w + x] = color
    im.putdata(pixeldata)
    im.show()

# dataToImg(tempData[1600])

for i, days in enumerate(times):
    theDate = bd + datetime.timedelta(days=int(days))
    theYear = theDate.year
    theMonth = theDate.month
    data = tempData[i]
    # dataToImg(data)
