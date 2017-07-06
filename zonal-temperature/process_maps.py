# -*- coding: utf-8 -*-

import datetime
import json
import math
from netCDF4 import Dataset
from PIL import Image, ImageDraw, ImageFilter
from pprint import pprint
from pyproj import Proj
import sys

# Gridded Monthly Temperature Anomaly Data
# source: https://data.giss.nasa.gov/gistemp/
# inspect: ncdump -h data/gistemp1200_ERSSTv4.nc

INPUT_FILE = 'data/gistemp1200_ERSSTv4.nc'
OUTPUT_DIR = 'img/frames/'
BACKGROUND_IMAGE = 'img/worldmap.png'
GRADIENT = [
    "#4B94D8", # blue
    # "#FCEF76", # yellow
    "#212121", # black
    "#D83636" #red
]
MIN_VALUE = -4.1
MAX_VALUE = 4.3
TARGET_WIDTH = 1920
TARGET_HEIGHT = TARGET_WIDTH / 2
LATLON_OFFSET = 0.8
START_YEAR = 1880
END_YEAR = 2016
BLUR_RADIUS = 0
RADIUS_RANGE = [0.2, 1.2]
FPS = 30
TRANSITION_S = 1

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [255,255,255]
  return tuple([int(hex[i:i+2], 16) for i in range(1,6,2)])

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
    if remainder > 0:
        return lerpColor(grad[int(i)], grad[int(i)+1], remainder)
    else:
        return grad[int(i)]

robinsonProj = Proj(ellps='WGS84',proj='robin')

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

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

# Convert lat/lon to pixels using Robinson projection
coordinates = []
values = []
for y, lat in enumerate(lats):
    for x, lon in enumerate(lons):
        o = LATLON_OFFSET
        p1 = robinsonProj(lon-o, lat-o)
        p2 = robinsonProj(lon+o, lat-o)
        p3 = robinsonProj(lon+o, lat+o)
        p4 = robinsonProj(lon-o, lat+o)
        c = [p1, p2, p3, p4]
        coordinates.append({
            "poly": c,
            "center": robinsonProj(lon, lat)
        })
        values += c
        p = robinsonProj(lon, lat)
cxs = [c[0] for c in values]
cys = [c[1] for c in values]
cbounds = [min(cxs), min(cys), max(cxs), max(cys)]

def c2px(c, bounds, tw, th):
    nx = norm(c[0], cbounds[0], cbounds[2])
    ny = norm(c[1], cbounds[3], cbounds[1])
    x = nx * tw
    y = ny * th
    return (x, y)

for i, c in enumerate(coordinates):
    coordinates[i]["poly"] = [c2px(cc, cbounds, TARGET_WIDTH, TARGET_HEIGHT) for cc in c["poly"]]
    coordinates[i]["center"] = c2px(c["center"], cbounds, TARGET_WIDTH, TARGET_HEIGHT)

tempData = ds.variables['tempanomaly'][:] # short: surface temperature anomaly (K), e.g. tempData[time][lat][lon]
baseDate = "1800-01-01"
bd = datetime.datetime.strptime(baseDate, "%Y-%m-%d")
emptyColor = hex2rgb("#212121")
backgroundImage = Image.open(BACKGROUND_IMAGE)

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
        mult = lerp(RADIUS_RANGE[0], RADIUS_RANGE[1], mult)
    return mult

def dataToImg(filename, dataFrom, dataTo, amount):
    # show image
    im = Image.new("RGB", (TARGET_WIDTH, TARGET_HEIGHT), emptyColor)
    im.paste(backgroundImage, (0,0))
    draw = ImageDraw.Draw(im)
    for y, lat in enumerate(lats):
        for x, lon in enumerate(lons):
            r = y * w + x
            v1 = dataFrom[y][x]
            v2 = dataTo[y][x]
            c1 = tempToColor(v1)
            c2 = tempToColor(v2)
            color = lerpColor(c1, c2, amount)
            poly = coordinates[r]["poly"]
            # draw.polygon(poly, fill=color)
            c = coordinates[r]["center"]
            minLen = min([abs(poly[0][0] - poly[1][0]), abs(poly[2][0] - poly[3][0]), abs(poly[1][1] - poly[2][1])])
            # determine size
            r1 = tempToRadius(v1)
            r2 = tempToRadius(v2)
            mult = lerp(r1, r2, amount)
            cellR = minLen * 0.5 * mult
            if cellR > 0:
                bounds = [(c[0]-cellR, c[1]-cellR), (c[0]+cellR, c[1]+cellR)]
                draw.ellipse(bounds, fill=color)
    del draw
    if BLUR_RADIUS > 0:
        imf = im.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
        imf.save(filename)
    else:
        im.save(filename)
        # im.show()

# dataToImg("sample.png", tempData[1600], tempData[1601], 0.5)

index = 1
for i, days in enumerate(times):
    if i < 0:
        continue
    theDate = bd + datetime.timedelta(days=int(days))
    theYear = theDate.year
    theMonth = theDate.month
    if START_YEAR <= theYear <= END_YEAR:
        if theYear==START_YEAR and theMonth<=1:
            continue
        dataFrom = tempData[i-1]
        dataTo = tempData[i]
        frames = FPS * TRANSITION_S
        for f in range(frames):
            filename = "%sframe%s.png" % (OUTPUT_DIR, str(index).zfill(5))
            dataToImg(filename, dataFrom, dataTo, 1.0*f/frames)
            index += 1
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*i/t*100,1))
    sys.stdout.flush()

print "\rDone."
