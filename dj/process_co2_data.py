# -*- coding: utf-8 -*-

# Description: takes the raw CO2 data files provided by NOAA and produces a .json file for use by the UI
# Sources:
#   - Full Mauna Loa CO2 record (1958-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_mlo.txt
#   - Global monthly mean CO2 (1980-2017): ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_mm_gl.txt

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json
import os
from shared import *

# Define data sources
FILES = {
    "hourly": {
        "filename": "data/co2_mlo_surface-insitu_1_ccgg_HourlyData.dat",
        "source": "https://www.esrl.noaa.gov/gmd/dv/data/?parameter_name=Carbon%2BDioxide&frequency=Hourly%2BAverages",
        "header": ["site_code","year","month","day","hour","minute","second","value","value_unc","nvalue","latitude","longitude","altitude","elevation","intake_height","instrument","qcflag"]
    },
    "daily": {
        "filename": "data/co2_mlo_surface-insitu_1_ccgg_DailyData.dat",
        "source": "https://www.esrl.noaa.gov/gmd/dv/data/?parameter_name=Carbon%2BDioxide&frequency=Daily%2BAverages",
        "header": ["site_code","year","month","day","hour","minute","second","value","value_unc","nvalue","latitude","longitude","altitude","elevation","intake_height","instrument","qcflag"]
    },
    "monthly": {
        "filename": "data/co2_mm_mlo.txt",
        "source": "https://www.esrl.noaa.gov/gmd/ccgg/trends/data.html",
        "header": ["year","month","decimal_date","value","interpolated","trend","days"]
    },
    "annually": {
        "filename": "data/co2_annmean_mlo.txt",
        "source": "https://www.esrl.noaa.gov/gmd/ccgg/trends/data.html",
        "header": ["year","value","uncertainty"]
    },
    "ice_core": {
        "filename": "data/merged_ice_core_yearly.csv",
        "source": "http://scrippsco2.ucsd.edu/data/atmospheric_co2/icecore_merged_products",
        "header": ["year","value"]
    }
}
# Define data groups
DATA_GROUPS = [
    {"unit": "hour", "label": "Today", "file": "hourly", "dates": [(2015,12,31,0), (2015,12,31,23)]},
    {"unit": "hour", "label": "Last 48 Hours", "file": "hourly", "dates": [(2015,12,30,0), (2015,12,31,23)]},
    {"unit": "weekday", "label": "Last Week", "file": "hourly", "dates": [(2015,12,25,0), (2015,12,31,23)]},
    {"unit": "day", "label": "Last Month", "file": "hourly", "dates": [(2015,12,1,0), (2015,12,31,23)]},
    {"unit": "month", "label": "Last Year", "file": "daily", "dates": [(2015,1,1,0), (2015,12,31,23)]},
    {"unit": "month", "label": "Last 2 Years", "file": "daily", "dates": [(2014,1,1,0), (2015,12,31,23)]},
    {"unit": "year", "label": "Last Decade", "file": "monthly", "dates": [(2005,1,1,0), (2015,12,31,23)]},
    {"unit": "year", "label": "Since 1959", "file": "annually", "dates": [(1959,1,1,0), (2015,12,31,23)]},
    {"unit": "year", "label": "Since 13 C.E.", "file": "ice_core", "dates": [(13,1,1,0), (2015,12,31,23)]}
]
OUTPUT_FILE = "data/processed_data.json"
AXIS_ROUND_TO_NEAREST = 10

def dateToNumber(date):
    (year, month, day, hour) = date
    return 10000 * year + 100 * month + day + hour / 24.0

def interpolateHours(start, end):
    dates = []
    date = start
    day = None
    while date <= end:
        if date.day != day:
            if day is None:
                dates.append("{d:%b} {d.day}, {d.year}".format(d=date))
            else:
                dates.append("{d:%b} {d.day}".format(d=date))
            day = date.day
        else:
            dates.append("{d:%l}{d:%p}".format(d=date))
        date += timedelta(hours=1)
    return dates

def interpolateWeekdays(start, end):
    dates = []
    date = start
    weekday = start.weekday()
    while date <= end:
        if weekday == date.weekday():
            if date == start:
                dates.append("{d:%b} {d.day}, {d.year}".format(d=date))
            else:
                dates.append("{d:%a} {d.day}".format(d=date))
        else:
            dates.append("{d:%a}".format(d=date))
        date += timedelta(days=1)
    return dates

def interpolateDays(start, end):
    dates = []
    date = start
    month = None
    while date <= end:
        if month != date.month:
            if month is None:
                dates.append("{d:%b} {d.year}".format(d=date))
            else:
                dates.append("{d:%b}".format(d=date))
            month = date.month
        else:
            dates.append("{d.day}".format(d=date))
        date += timedelta(days=1)
    return dates

def interpolateMonths(start, end):
    dates = []
    date = start
    year = None
    while date <= end:
        if year != date.year:
            dates.append("{d.year}".format(d=date))
            year = date.year
        else:
            dates.append("{d:%b}".format(d=date))
        date += relativedelta(months=1)
    return dates

def interpolateYears(start, end):
    diff = end - start
    years = [start]
    for y in range(diff):
        years.append(start + y + 1)
    return years

def interpolateDates(start, end, unit):
    dates = []
    if unit == "year":
        return interpolateYears(int(start[0]), int(end[0]))
    else:
        startDate = datetime(start[0], start[1], start[2], start[3])
        endDate = datetime(end[0], end[1], end[2], end[3])
        if unit == "hour":
            return interpolateHours(startDate, endDate)
        elif unit == "weekday":
            return interpolateWeekdays(startDate, endDate)
        elif unit == "day":
            return interpolateDays(startDate, endDate)
        elif unit == "month":
            return interpolateMonths(startDate, endDate)
    return dates

def interpolateNumbers(start, end):
    # determine step
    diff = end - start
    power = math.floor(math.log(diff, 10)) - 1.0
    step = math.pow(10, power)

    # convert to int if no decimal
    if step % 1 <= 0:
        step = int(step)

    # make a list of numbers
    numbers = [start]
    n = start + step
    while n < end:
        numbers.append(n)
        n += step
    numbers.append(end)

    return numbers

def getPoints(data, yRange, xRange):
    points = []
    for d in data:
        y = norm(d["value"], yRange)
        x = norm(d["date"], (dateToNumber(xRange[0]), dateToNumber(xRange[1])))
        points.append((x,y))
    return points

def readDataFromFile(filename, header, dates):
    rows = []
    with open(filename, 'rb') as f:
        lines = [line.strip().split() for line in f if not line.startswith("#") and not line.startswith("\"")]
        for line in lines:
            values = [parseNumber(l) for l in line]
            row = dict(zip(header, values))

            # Retrieve date
            date = dateToNumber((row["year"], 1, 1, 0))
            if "hour" in row:
                date = dateToNumber((row["year"], row["month"], row["day"], row["hour"]))
            elif "day" in row:
                date = dateToNumber((row["year"], row["month"], row["day"], 0))
            elif "month" in row:
                date = dateToNumber((row["year"], row["month"], 1, 0))

            # Retrieve value
            value = row["value"]
            if value < 0 and "interpolated" in row:
                value = row["interpolated"]

            # Add if date is valid
            if dateToNumber(dates[0]) <= date <= dateToNumber(dates[1]) and value >= 0:
                rows.append({
                    "value": value,
                    "date": date
                })
    return rows

# read data
dataGroups = []
for g in DATA_GROUPS:
    f = FILES[g["file"]]
    print "Processing %s..." % f["filename"]
    data = readDataFromFile(f["filename"], f["header"], g["dates"])

    # compute axes
    values = [d["value"] for d in data]
    yAxisMin = roundDownToNearest(min(values), AXIS_ROUND_TO_NEAREST)
    yAxisMax = roundUpToNearest(max(values), AXIS_ROUND_TO_NEAREST)
    yAxis = interpolateNumbers(yAxisMin, yAxisMax)
    xAxis = interpolateDates(g["dates"][0], g["dates"][1], g["unit"])

    points = getPoints(data, (yAxisMin, yAxisMax), g["dates"])

    dataGroups.append({
        "label": g["label"],
        "data": points,
        "xAxis": xAxis,
        "yAxis": yAxis
    })

# Build JSON data
jsonData = dataGroups

# Retrieve existing data if exists
jsonOut = {}
if os.path.isfile(OUTPUT_FILE):
    with open(OUTPUT_FILE) as f:
        jsonOut = json.load(f)
jsonOut["co2"] = jsonData

# Write to file
with open(OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s groups to %s" % (len(dataGroups), OUTPUT_FILE)
