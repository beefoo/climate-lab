# -*- coding: utf-8 -*-

# Gridded Monthly Temperature Anomaly Data
# source: https://data.giss.nasa.gov/gistemp/
# pre-process data: python preprocess_data.py

# compile: ffmpeg -framerate 15/1 -i img/frames/frame%05d.png -c:v libx264 -r 15 -pix_fmt yuv420p -q:v 1 video/temperature_1980-2016.mp4
# convert: ffmpeg -i video/temperature_1980-2016.mp4 -c:v libvpx -b:v 1M -c:a libvorbis video/temperature_1980-2016.webm

# For web:
# python process_maps.py -out img/map/ -width 800

import argparse
import datetime
import json
import math
from netCDF4 import Dataset
from PIL import Image, ImageDraw, ImageFilter
from pprint import pprint
from pyproj import Proj
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-in', dest="INPUT_FILE", default="data/gistemp1200_ERSSTv4_annual.nc", help="Temperature input file")
parser.add_argument('-start', dest="START_YEAR", default=1950, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2016, type=int, help="End year")
parser.add_argument('-out', dest="OUTPUT_DIR", default="img/frames/", help="Output directory")
parser.add_argument('-trans', dest="TRANSITION_FRAMES", default=0, type=int, help="Number of transition frames")
parser.add_argument('-width', dest="TARGET_WIDTH", default=1920, type=int, help="Target width")
parser.add_argument('-format', dest="IMAGE_FORMAT", default="png", help="Image format")
args = parser.parse_args()

# config
INPUT_FILE = args.INPUT_FILE
OUTPUT_DIR = args.OUTPUT_DIR
START_YEAR = args.START_YEAR
END_YEAR = args.END_YEAR
TRANSITION_FRAMES = args.TRANSITION_FRAMES
TARGET_WIDTH = args.TARGET_WIDTH
IMAGE_FORMAT = args.IMAGE_FORMAT

BACKGROUND_IMAGE = 'img/worldmap.png'
GRADIENT = [
    "#4B94D8", # blue
    # "#FCEF76", # yellow
    "#212121", # black
    "#D83636" #red
]
MIN_VALUE = -3.5
MAX_VALUE = 3.5
TARGET_HEIGHT = TARGET_WIDTH / 2
LATLON_OFFSET = 0.8
BLUR_RADIUS = 0
RADIUS_RANGE = [0.2, 1.2]

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

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

robinsonProj = Proj(ellps='WGS84',proj='robin')

# Convert colors to RGB
GRADIENT = [hex2rgb(g) for g in GRADIENT]

# Open NetCDF file
ds = Dataset(INPUT_FILE, 'r')

# Extract data from NetCDF file
lats = ds.variables['lat'][:] # float: latitude
lons = ds.variables['lon'][:] # float: longitude
times = ds.variables['time'][:] # int: year
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

tempData = ds.variables['tempanomaly'][:] # float: surface temperature anomaly (C), e.g. tempData[time][lat][lon]
emptyColor = hex2rgb("#212121")
# backgroundImage = Image.open(BACKGROUND_IMAGE)

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

def dataToImg(filename, data):
    # show image
    im = Image.new("RGBA", (TARGET_WIDTH, TARGET_HEIGHT))
    # im.paste(backgroundImage, (0,0))
    draw = ImageDraw.Draw(im)
    for y, lat in enumerate(lats):
        for x, lon in enumerate(lons):
            r = y * w + x
            v = data[y, x]
            color = tempToColor(v)
            poly = coordinates[r]["poly"]
            # draw.polygon(poly, fill=color)
            c = coordinates[r]["center"]
            minLen = min([abs(poly[0][0] - poly[1][0]), abs(poly[2][0] - poly[3][0]), abs(poly[1][1] - poly[2][1])])
            # determine size
            rad = tempToRadius(v)
            cellR = minLen * 0.5 * rad
            if cellR > 0:
                bounds = [(c[0]-cellR, c[1]-cellR), (c[0]+cellR, c[1]+cellR)]
                draw.ellipse(bounds, fill=color)
    del draw
    # print(filename)
    im.save(filename)
    # im.show()

print "Generating images..."
years = []
yearData = []
index = 1
for i, year in enumerate(times):
    if START_YEAR <= year <= END_YEAR:
        data = tempData[i]
        filename = "%sframe%s.%s" % (OUTPUT_DIR, str(index).zfill(5), IMAGE_FORMAT)
        dataToImg(filename, data)
        index += 1
    sys.stdout.write('\r')
    sys.stdout.write("%s%%" % round(1.0*(i+1)/t*100,1))
    sys.stdout.flush()


ds.close()
print "\rDone."
