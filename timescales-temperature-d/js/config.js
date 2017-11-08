var CONFIG = {
  "dataURL": "data/processed_data.json",
  "dataKey": "temperature",
  "enableSound": true,
  "minDomainCount": 5,
  "annotations": [
    {
      "year": 1902,
      "title": "Novarupta Volcano Eruption",
      "description": "The third largest eruption of the 20th century. Since volcanic dust blasted into the atmosphere causes temporary cooling, average global temperatures dropped for a few years after the eruption.",
      "highlightYears": [1902, 1903, 1904],
      "image": "img/novarupta.jpg"
    },{
      "year": 1912,
      "title": "Santa María Volcano Eruption",
      "description": "The largest eruption of the 20th century. Since volcanic dust blasted into the atmosphere causes temporary cooling, average global temperatures dropped for a few years after the eruption.",
      "highlightYears": [1912, 1913],
      "image": "img/santa_maria.jpg"
    },{
      "year": 1991,
      "title": "Mount Pinatubo Volcano Eruption",
      "description": "The second largest volcanic eruption of the 20th century. Since volcanic dust blasted into the atmosphere causes temporary cooling, average global temperatures dropped for a few years after the eruption.",
      "highlightYears": [1991, 1992, 1993],
      "image": "img/pinatubo.jpg"
    },{
      "year": 1941,
      "title": "Major El Niño event",
      "description": "1940-1942 had a strong El Niño event, which has a warming effect on the Pacific Ocean",
      "highlightYears": [1940, 1941, 1942]
    },{
      "year": 1983,
      "title": "Major El Niño event",
      "description": "1982-1983 had one of the strongest El Niño events since 1880, which has a warming effect on the Pacific Ocean",
      "highlightYears": [1982, 1983],
      "image": "img/el_nino_1983.jpg"
    },{
      "year": 1998,
      "title": "Major El Niño event",
      "description": "1997-1998 had one of the strongest El Niño events since 1880, which has a warming effect on the Pacific Ocean",
      "highlightYears": [1997, 1998],
      "image": "img/el_nino_1997.jpg"
    },{
      "year": 2015,
      "title": "Major El Niño event",
      "description": "2015-2016 had one of the strongest El Niño events since 1880, which has a warming effect on the Pacific Ocean",
      "highlightYears": [2015, 2016],
      "image": "img/el_nino_2015.jpg"
    },{
      "yearRange": [1945, 1965],
      "title": "Post-WWII sulphate aerosol pollution",
      "description": "The mid-century cooling appears to have been largely due to sulphate aerosols emitted by industrial activities and volcanic eruptions. Sulphate aerosols have a cooling effect on the climate because they reflect energy from the Sun.",
      "highlightYearRange": [1945, 1965]
    },{
      "year": 1965,
      "title": "Clean Air Act",
      "description": "The Clean Air Acts of 1965, 1967, and 1970 removed much of the sulphate aerosol from the atmosphere. The following decades saw an increase in average global temperature since sulphate aerosols had a cooling effect on the climate",
      "highlightYears": [1965, 1967, 1970],
      "image": "img/air_quality_act.jpg"
    },{
      "yearRange": [1880, 2016],
      "title": "A warming trend",
      "description": "When looking at the entire global temperature record since 1880, there is a clear long-term warming trend for global average temperature.",
      "trend": true
    }
  ],
  "messages": [
    {"text": "The average global temperature jumps around from year to year. It's hard to see any pattern when looking at only a handful of years.", "years": 10},
    {"text": "Several decades of temperature records don't always show whether the planet is warming or cooling.", "years": 30},
    {"text": "You can begin to see patterns of climate change can be seen when looking at 40 years of records or more.", "years": 100},
    {"text": "When viewing over a century of global temperature records, a clear warming trend is observed.", "years": 200}
  ]
};
