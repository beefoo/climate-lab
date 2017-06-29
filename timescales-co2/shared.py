# -*- coding: utf-8 -*-

from datetime import datetime
import math
import numpy as np

def dateToSeconds(date):
    (year, month, day, hour) = date
    dt = datetime(int(year), month, day, hour)
    unix = datetime(1970,1,1)
    return (dt - unix).total_seconds()

def dateStringToSeconds(string):
    parts = [int(p) for p in string.split("-")]
    return dateToSeconds((parts[0], parts[1], parts[2], 0))

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

# http://scipy.github.io/old-wiki/pages/Cookbook/SavitzkyGolay
# http://stackoverflow.com/questions/20618804/how-to-smooth-a-curve-in-the-right-way
def savitzky_golay(y, window_size, order=3, deriv=0, rate=1):
    r"""
    Parameters
    ----------
    y : array_like, shape (N,)
        the values of the time history of the signal.
    window_size : int
        the length of the window. Must be an odd integer number.
    order : int
        the order of the polynomial used in the filtering.
        Must be less then `window_size` - 1.
    deriv: int
        the order of the derivative to compute (default = 0 means only smoothing)
    Returns
    -------
    ys : ndarray, shape (N)
        the smoothed signal (or it's n-th derivative).
    """
    y = np.array(y)
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
    half_window = int((window_size -1) // 2)
    # precompute coefficients
    b = np.mat([[k**i for i in order_range] for k in range(-half_window, half_window+1)])
    m = np.linalg.pinv(b).A[deriv] * rate**deriv * math.factorial(deriv)
    # pad the signal at the extremes with
    # values taken from the signal itself
    firstvals = y[0] - np.abs( y[1:half_window+1][::-1] - y[0] )
    lastvals = y[-1] + np.abs(y[-half_window-1:-1][::-1] - y[-1])
    y = np.concatenate((firstvals, y, lastvals))
    return np.convolve( m[::-1], y, mode='valid').tolist()
