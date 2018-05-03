Run: `python process.py` to generate the .json file. This script creates a composite of four different data sets taking preference to more modern and higher resoslution data sets.

The file is in the format:

```
{
  "title": "<string>",
  "description": "<string>",
  "domain": [<int in years bp>, <int in years bp>],
  "range": [<float>, <float>],
  "xLabel": "<string>",
  "yLabel": "<string>",
  "header": ["yearsbp", "value", "error"],
  "data": [
    [<the year bp>, <the value>, <the error>],
    [<the year bp>, <the value>, <the error>],
    [<the year bp>, <the value>, <the error>],
    ...
  ]
}
```
