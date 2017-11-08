var CONFIG = {
  "nodes": [
    {id: "CENTER", name: "Warming", fixed: true, groupId: "center"},
    {id: "A1", name: "Warmer Arctic summers", groupId: "A"},
    {id: "A2", name: "Warmer ocean waters", groupId: "A"},
    {id: "A3", name: "Less sea ice growth in the Arctic", groupId: "A"},
    {id: "A4", name: "Even warmer waters", groupId: "A"},
    {id: "B1", name: "Fish migrations", groupId: "B"},
    {id: "B2", name: "Change in Arctic fisheries", groupId: "B"},
    {id: "B3", name: "Loss of income for Arctic communities", groupId: "B"},
    {id: "C1", name: "Loss of food resources for Arctic wildlife", groupId: "C"},
    {id: "D1", name: "Higher daytime and nighttime temperatures on averages", groupId: "D"},
    {id: "D2", name: "More days above  35˚C (95˚F) and more frequent heat waves", groupId: "D"},
    {id: "D3", name: "More evaporation from lakes, streams and reservoirs", groupId: "D"},
    {id: "E1", name: "Loss of freshwater resources for agriculture and human consumption", groupId: "E"},
    {id: "F1", name: "More droughts, less food production", groupId: "F"},
    {id: "F2", name: "Decreased food security", groupId: "F"}
  ],
  "links": [
    {source: "CENTER", target: "A1", linkName: "As the climate warms, summers in the Arctic are becoming longer and warmer."},
    {source: "A1", target: "A2", linkName: "Sea surface temperatures rise as the oceans absorb excess heat from the atmosphere."},
    {source: "A2", target: "A3", linkName: "Warmer air and oceans melt more Arctic sea ice in the summer and prevent its growth in the winter."},
    {source: "A3", target: "A4", linkName: "The loss of reflective ice cover allows the oceans to absorb more energy from the sun."},
    {source: "A4", target: "CENTER", linkName: "Oceans radiate heat back into the system, raising the air temperature even higher."},
    {source: "A2", target: "B1", linkName: "As oceans warmer, fish species from lower latitudes move north"},
    {source: "B1", target: "B2", linkName: "As fish move north, pressure is put on native species."},
    {source: "B2", target: "B3", linkName: "Communities that depend on Arctic fisheries suffer losses of food resources and income."},
    {source: "B1", target: "C1", linkName: "Decline in Arctic birds and mammals that depend on native fish."},
    {source: "CENTER", target: "D1", linkName: "A warming world means hotter days and nights."},
    {source: "D1", target: "D2", linkName: "Higher average temperatures mean more frequent extreme temperatures."},
    {source: "D2", target: "D3", linkName: "Warmer air evaporates moisture."},
    {source: "D3", target: "CENTER", linkName: "Water in the air holds more heat, continuing the cycle of warming."},
    {source: "D3", target: "E1", linkName: "As sources of freshwater dry up, there will be less available for drinking and agriculture."},
    {source: "D1", target: "F1", linkName: "Hotter and longer summers make food more difficult to grow in places like the western US."},
    {source: "F1", target: "F2", linkName: "Less food produced means less food security for countries and communities."},
  ],
  "positions": {
    "center": [0.5, 0.5],
    "A": [0.5, 0.7],
    "B": [0.5, 0.8],
    "C": [0.5, 0.8],
    "D": [0.5, 0.3],
    "E": [0.5, 0.2],
    "F": [0.5, 0.2]
  }
};
