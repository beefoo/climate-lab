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
import time
import sys

# Define data sources
FILES = {
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
# Define data groups
DATA_GROUPS = [
    {"domainUnit": "hour", "label": "Today", "unit": "hour", "dates": [(2015,12,31,0), (2015,12,31,23)]},
    {"domainUnit": "hour", "label": "Last 48 Hours", "unit": "hour", "dates": [(2015,12,30,0), (2015,12,31,23)]},
    {"domainUnit": "weekday", "label": "Last Week", "unit": "hour", "dates": [(2015,12,25,0), (2015,12,31,23)]},
    {"domainUnit": "day", "label": "Last Month", "unit": "hour", "dates": [(2015,12,1,0), (2015,12,31,23)]},
    {"domainUnit": "month", "label": "Last Year", "unit": "day", "dates": [(2015,1,1,0), (2015,12,31,23)]},
    {"domainUnit": "month", "label": "Last 2 Years", "unit": "day", "dates": [(2014,1,1,0), (2015,12,31,23)]},
    {"domainUnit": "year", "label": "Last Decade", "unit": "month", "dates": [(2005,1,1,0), (2015,12,31,23)]},
    {"domainUnit": "year", "label": "Since 1959", "unit": "year", "dates": [(1959,1,1,0), (2015,12,31,23)]},
    {"domainUnit": "year", "label": "Since 13 C.E.", "unit": "year", "dates": [(13,1,1,0), (2015,12,31,23)]}
]
OUTPUT_FILE = "data/processed_data.json"
AXIS_ROUND_TO_NEAREST = 1
UNITS = ["hour", "day", "month", "year"]

def dateToNumber(date):
    (year, month, day, hour) = date
    return 10000 * year + 100 * month + day + hour / 24.0

def dateToSeconds(date):
    (year, month, day, hour) = date
    dt = datetime(int(year), month, day, hour)
    unix = datetime(1970,1,1)
    return (dt - unix).total_seconds()

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
            if date.hour % 6 == 0:
                dates.append("{d:%l}{d:%p}".format(d=date))
            else:
                dates.append("-")
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
            if date.day % 5 == 0:
                dates.append("{d.day}".format(d=date))
            else:
                dates.append("-")
        date += timedelta(days=1)
    return dates

def interpolateMonths(start, end):
    dates = []
    date = start
    year = None
    diff = (end.year - start.year) * 12 + end.month - start.month
    while date <= end:
        if year != date.year:
            dates.append("{d.year}".format(d=date))
            year = date.year
        else:
            if diff > 12 and date.month % 7 == 0 or diff <= 12 and date.month % 3 == 0:
                dates.append("{d:%b}".format(d=date))
            else:
                dates.append("-")
        date += relativedelta(months=1)
    return dates

def interpolateYears(start, end):
    diff = end - start + 1
    years = []
    for y in range(diff):
        year = start + y
        if year % 5 == 0 and diff <= 20 or year % 10 == 0 and 20 < diff <= 60 or year % 25 == 0 and 60 < diff <= 100 or year % 500 == 0 or diff > 100 and y == 0:
            years.append(str(year))
        elif diff <= 100 or year % 100 == 0:
            years.append("-")
        else:
            years.append("")
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

    if diff > 3:
        step = max(step, 1)

    # make a list of numbers
    numbers = [start]
    n = start + step
    while n < end:
        numbers.append(n)
        n += step
    numbers.append(end)

    return numbers

def readDataFromFile(filename, header, dates):
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
            dateNumber = dateToNumber(date)

            # Retrieve value
            value = row["value"]
            if value < 0 and "interpolated" in row:
                value = row["interpolated"]

            # Add if date is valid
            if dateToNumber(dates[0]) <= dateNumber <= dateToNumber(dates[1]) and value >= 0:
                rows.append({
                    "value": value,
                    "date": date
                })
    return rows

# Read the data into unit groups
dataByUnits = {}
for unit in UNITS:
    # get the groups
    unitGroups = [d for d in DATA_GROUPS if d["unit"]==unit]

    # get the date range
    dates = []
    for ug in unitGroups:
        dates += ug["dates"]
    dates = sorted(dates)
    dateRange = (dates[0], dates[-1])

    # get the files
    unitFiles = [f for key, f in FILES.iteritems() if f["unit"]==unit]
    for uf in unitFiles:
        # read data from file
        print "Processing %s..." % uf["filename"]
        uData = readDataFromFile(uf["filename"], uf["header"], dateRange)
        # only add data if not already exists
        if unit in dataByUnits:
            for ud in uData:
                found = [d for d in dataByUnits[unit] if d["date"]==ud["date"]]
                if not len(found):
                    dataByUnits[unit].append(ud)
        else:
            dataByUnits[unit] = uData

# get axes for data groups
dataGroups = []
for g in DATA_GROUPS:
    # compute axes
    values = [d["value"] for d in dataByUnits[g["unit"]] if g["dates"][0] <= d["date"] <= g["dates"][1]]
    yAxisMin = roundDownToNearest(min(values), AXIS_ROUND_TO_NEAREST)
    yAxisMax = roundUpToNearest(max(values), AXIS_ROUND_TO_NEAREST)
    yAxis = interpolateNumbers(yAxisMin, yAxisMax)
    xAxis = interpolateDates(g["dates"][0], g["dates"][1], g["domainUnit"])

    dataGroups.append({
        "label": g["label"],
        "xAxis": xAxis,
        "yAxis": yAxis,
        "domain": (dateToSeconds(g["dates"][0]), dateToSeconds(g["dates"][1])),
        "range": (yAxisMin, yAxisMax),
        "unit": g["unit"]
    })

# turn into tuples
for unit, data in dataByUnits.iteritems():
    dataByUnits[unit] = [(dateToSeconds(d["date"]), d["value"]) for d in data]

# Build JSON data
jsonData = {
    "data": dataByUnits,
    "scales": dataGroups
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
    print "Wrote %s groups to %s" % (len(dataGroups), OUTPUT_FILE)
