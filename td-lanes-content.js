/* Append-only encounter data. Combat and the five original raw stage IDs stay unchanged. */
(function(root){'use strict';
const E=typeof module==='object'&&module.exports?require('./td-lanes'):root.TDLanes;
E.levels.push({
  "name": {
    "zh": "转移的压力",
    "en": "Shifting pressure"
  },
  "brief": {
    "zh": "四段共43名敌人。第3行先迎来碎片群，随后第5行、再到第1行出现碎片与冲锋。查看完整预报，把后续补给留给下一段压力；廉价直射补强或不同专长搭配都可应对。",
    "en": "43 enemies in four pushes. Fragments first gather in lane 3, then fragments and chargers pressure lane 5, then lane 1. Read the full forecast and reserve later supplies for the next push. Reinforced cheap bolts or a mix of specialties can work."
  },
  "phaseStarts": [
    4,
    22,
    36,
    53
  ],
  "spawns": [
    {
      "row": 0,
      "type": "data",
      "time": 4
    },
    {
      "row": 0,
      "type": "data",
      "time": 7
    },
    {
      "row": 1,
      "type": "data",
      "time": 7
    },
    {
      "row": 1,
      "type": "data",
      "time": 10
    },
    {
      "row": 2,
      "type": "data",
      "time": 10
    },
    {
      "row": 2,
      "type": "data",
      "time": 13
    },
    {
      "row": 3,
      "type": "data",
      "time": 13
    },
    {
      "row": 3,
      "type": "data",
      "time": 16
    },
    {
      "row": 4,
      "type": "data",
      "time": 16
    },
    {
      "row": 0,
      "type": "armor",
      "time": 17
    },
    {
      "row": 4,
      "type": "data",
      "time": 19
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 22
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 22.25
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 22.5
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 22.75
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 23
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 23.25
    },
    {
      "row": 3,
      "type": "charge",
      "time": 25
    },
    {
      "row": 3,
      "type": "charge",
      "time": 28.5
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36.25
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36.5
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36.75
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37.25
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37.5
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37.75
    },
    {
      "row": 2,
      "type": "armor",
      "time": 38
    },
    {
      "row": 4,
      "type": "charge",
      "time": 39
    },
    {
      "row": 4,
      "type": "charge",
      "time": 42.5
    },
    {
      "row": 4,
      "type": "charge",
      "time": 46
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 53
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 53.25
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 53.5
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 53.75
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 54
    },
    {
      "row": 0,
      "type": "charge",
      "time": 54
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 54.25
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 54.5
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 54.75
    },
    {
      "row": 2,
      "type": "data",
      "time": 55
    },
    {
      "row": 0,
      "type": "charge",
      "time": 57.5
    },
    {
      "row": 0,
      "type": "charge",
      "time": 61
    }
  ]
});
if(typeof module==='object'&&module.exports)module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
