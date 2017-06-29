# -*- coding: utf-8 -*-

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

    if diff >= 5:
        step = max(step, 1)

    # make a list of numbers
    numbers = [start]
    n = start + step
    while n < end:
        numbers.append(n)
        n += step
    numbers.append(end)

    return numbers
