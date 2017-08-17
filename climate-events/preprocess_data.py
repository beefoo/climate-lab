# -*- coding: utf-8 -*-

# Source:
# http://natcatservice.munichre.com/

import argparse
import csv
import json
import math
import os
from pprint import pprint
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-dir', dest="DIR", default="data/raw", help="Input directory")
parser.add_argument('-start', dest="START_YEAR", default=1980, type=int, help="Start year")
parser.add_argument('-end', dest="END_YEAR", default=2016, type=int, help="End year")
parser.add_argument('-out', dest="OUTPUT_FILE", default="data/processed_data.json", help="JSON output file")

args = parser.parse_args()

data = []
year = args.START_YEAR
while year <= args.END_YEAR:
    with open("%s/%s.json" % (args.DIR, year)) as f:
        d = json.load(f)

        # validate string
        if d["periodString"] != str(year):
            print "Wrong year found for %s" % year
            sys.exit(1)

        # retrieve event families
        eventFamilies = [
            {
                "id": el["eventFamilyId"],
                "name": el["eventFamilyName"],
                "deathToll": el["deathToll"],
                "econLosses": el["econLossesInflationAdj"]
            } for el in d["aggregations"]["eventfamily"]]
        eventFamiliesLookup = dict((str(el["id"]), i) for i, el in enumerate(eventFamilies))

        # retrieve events
        events = []
        for key, items in d["topLists"].iteritems():
            events += items[:]
        events = dict((str(el["id"]),el) for el in events)

        entries = []
        coords = d["coordinates"]
        for c in coords:
            eventFamily = eventFamiliesLookup[str(c["eventFamilyId"])]

            details = ""
            econLosses = 0
            deathToll = 0
            if "id" in c and str(c["id"]) in events:
                event = events[str(c["id"])]
                if "details" in event:
                    details = event["details"]
                if "econLossesTable" in event:
                    econLosses = int(''.join(c for c in event["econLossesTable"] if c.isdigit()))
                if "deathToll" in event:
                    deathToll = int(''.join(c for c in event["deathToll"] if c.isdigit()))

            entries.append({
                "x": c["x"],
                "y": c["y"],
                "eventFamily": eventFamily,
                "details": details,
                "econLosses": econLosses,
                "deathToll": deathToll
            })

        data.append({
            "eventFamilies": eventFamilies,
            "events": entries
        })

    year += 1

jsonOut = {
    "domain": [args.START_YEAR, args.END_YEAR],
    "data": data
}

# Write to file
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump(jsonOut, f)
    print "Wrote %s items to %s" % (len(data), args.OUTPUT_FILE)
