# -*- coding: utf-8 -*-

import math

# Interpolation if only two points available
def interpolateCosine(y1, y2, mu):
    mu2 = (1.0  - math.cos(mu * math.pi)) * 0.5
    return (y1 * (1.0 - mu2) + y2 * mu2)

# Interpolation if four points are available
def interpolateCubic(y0, y1, y2, y3, mu):
    mu2 = mu * mu
    a0 = y3 - y2 - y0 + y1
    a1 = y0 - y1 - a0
    a2 = y2 - y0
    a3 = y1
    return (a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3)

def norm(value, r):
    a = r[0]
    b = r[1]
    return 1.0 * (value - a) / (b - a)

# String to number
def parseNumber(string):
    try:
        string = string.replace(",","")
        num = float(string)
        if "." not in string:
            num = int(string)
        return num
    except ValueError:
        return string

def roundDownToNearest(value, nearest=10):
    return int(math.floor(1.0 * value / nearest)) * nearest

def roundUpToNearest(value, nearest=10):
    return int(math.ceil(1.0 * value / nearest)) * nearest
