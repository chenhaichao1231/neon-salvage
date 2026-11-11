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
// Main 5: overlapping active fronts, using only existing enemies and ordinary survival.
E.levels.push({
  "name": {
    "zh": "交叠的战线",
    "en": "Overlapping fronts"
  },
  "brief": {
    "zh": "第2行重甲与第4行集群交叠，随后第1、5行同时受压。第3行只有开场两只数据团；闲置守卫可留守，或用唯一一次半价撤回补强。",
    "en": "Lane 2 armor overlaps lane 4 crowds, then lanes 1 and 5 face pressure together. Lane 3 ends after two opening blobs. Keep idle guards or use the one half-cost withdrawal to reinforce."
  },
  "phaseStarts": [
    4,
    14,
    32,
    52
  ],
  "spawns": [
    {
      "row": 2,
      "type": "data",
      "time": 4
    },
    {
      "row": 2,
      "type": "data",
      "time": 7
    },
    {
      "row": 1,
      "type": "armor",
      "time": 8
    },
    {
      "row": 0,
      "type": "data",
      "time": 10
    },
    {
      "row": 1,
      "type": "armor",
      "time": 13
    },
    {
      "row": 0,
      "type": "data",
      "time": 14
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 14
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 14.3
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 14.6
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 14.9
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 15.2
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 15.5
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 15.8
    },
    {
      "row": 4,
      "type": "data",
      "time": 16
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 16.1
    },
    {
      "row": 1,
      "type": "armor",
      "time": 18
    },
    {
      "row": 4,
      "type": "data",
      "time": 19
    },
    {
      "row": 3,
      "type": "charge",
      "time": 20
    },
    {
      "row": 3,
      "type": "charge",
      "time": 23
    },
    {
      "row": 1,
      "type": "armor",
      "time": 32
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 32
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 32.3
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 32.6
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 32.9
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 33.2
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 33.5
    },
    {
      "row": 0,
      "type": "charge",
      "time": 34
    },
    {
      "row": 3,
      "type": "charge",
      "time": 35
    },
    {
      "row": 1,
      "type": "armor",
      "time": 36
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36.3
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36.6
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 36.9
    },
    {
      "row": 0,
      "type": "charge",
      "time": 37
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37.2
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37.5
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 37.8
    },
    {
      "row": 3,
      "type": "charge",
      "time": 38
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 38.1
    },
    {
      "row": 0,
      "type": "charge",
      "time": 40
    },
    {
      "row": 4,
      "type": "charge",
      "time": 40
    },
    {
      "row": 4,
      "type": "charge",
      "time": 43
    },
    {
      "row": 0,
      "type": "armor",
      "time": 52
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 52
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 52.3
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 52.6
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 52.9
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 53.2
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 53.5
    },
    {
      "row": 0,
      "type": "charge",
      "time": 54
    },
    {
      "row": 4,
      "type": "charge",
      "time": 55
    },
    {
      "row": 0,
      "type": "charge",
      "time": 57
    },
    {
      "row": 4,
      "type": "charge",
      "time": 58
    }
  ]
});
// Main 6: mixed pursuit changes target order through existing enemy movement.
E.levels.push({
  "name": {
    "zh": "交错的追兵",
    "en": "Interleaved pursuit"
  },
  "brief": {
    "zh": "第1、3、5行装甲先到，较快的冲锋与碎片随后追来，前排目标可能变化。兼顾清甲与追兵，给后续补强留钱；第2、4行后期仍有数据团。",
    "en": "Armor leads lanes 1, 3 and 5; faster chargers and fragments follow, so target order can change. Balance armor damage with covering pursuers and save for reinforcements. Lanes 2 and 4 still have later blobs."
  },
  "phaseStarts": [
    4,
    16,
    36,
    48
  ],
  "spawns": [
    {
      "row": 0,
      "type": "armor",
      "time": 4
    },
    {
      "row": 1,
      "type": "data",
      "time": 7
    },
    {
      "row": 0,
      "type": "armor",
      "time": 8
    },
    {
      "row": 0,
      "type": "charge",
      "time": 10
    },
    {
      "row": 2,
      "type": "armor",
      "time": 10
    },
    {
      "row": 1,
      "type": "data",
      "time": 11
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 12
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 12.4
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 12.8
    },
    {
      "row": 3,
      "type": "data",
      "time": 13
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 13.2
    },
    {
      "row": 0,
      "type": "charge",
      "time": 14
    },
    {
      "row": 2,
      "type": "armor",
      "time": 14
    },
    {
      "row": 2,
      "type": "charge",
      "time": 16
    },
    {
      "row": 4,
      "type": "armor",
      "time": 16
    },
    {
      "row": 3,
      "type": "data",
      "time": 17
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 18
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 18.4
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 18.8
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 19.2
    },
    {
      "row": 2,
      "type": "charge",
      "time": 20
    },
    {
      "row": 4,
      "type": "armor",
      "time": 20
    },
    {
      "row": 4,
      "type": "charge",
      "time": 22
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 24
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 24.4
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 24.8
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 25.2
    },
    {
      "row": 4,
      "type": "charge",
      "time": 26
    },
    {
      "row": 1,
      "type": "data",
      "time": 31
    },
    {
      "row": 0,
      "type": "armor",
      "time": 36
    },
    {
      "row": 3,
      "type": "data",
      "time": 37
    },
    {
      "row": 0,
      "type": "charge",
      "time": 42
    },
    {
      "row": 2,
      "type": "armor",
      "time": 42
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 44
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 44.4
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 44.8
    },
    {
      "row": 0,
      "type": "swarm",
      "time": 45.2
    },
    {
      "row": 0,
      "type": "charge",
      "time": 46
    },
    {
      "row": 2,
      "type": "charge",
      "time": 48
    },
    {
      "row": 4,
      "type": "armor",
      "time": 48
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 50
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 50.4
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 50.8
    },
    {
      "row": 1,
      "type": "data",
      "time": 51
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 51.2
    },
    {
      "row": 2,
      "type": "charge",
      "time": 52
    },
    {
      "row": 4,
      "type": "charge",
      "time": 54
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 56
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 56.4
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 56.8
    },
    {
      "row": 3,
      "type": "data",
      "time": 57
    },
    {
      "row": 4,
      "type": "swarm",
      "time": 57.2
    },
    {
      "row": 4,
      "type": "charge",
      "time": 58
    }
  ]
});
// Main 7: middle lanes change armor and crowd roles with the original rules.
E.levels.push({
  "name": {
    "zh": "轮换的围攻",
    "en": "Rotating siege"
  },
  "brief": {
    "zh": "54名敌人围攻三条中路：第2行重甲、第4行密集碎片先到；随后第3行重甲、第2行碎片；最后第4行重甲、第3行碎片。第1、5行无敌人。原来的专长未必适合下一轮，预留补给，决定下一次补强。",
    "en": "54 enemies rotate through the three middle lanes: armor in lane 2 and dense fragments in lane 4, then armor in lane 3 and fragments in lane 2, then armor in lane 4 and fragments in lane 3. Lanes 1 and 5 stay empty. An early specialty may not suit the next push; reserve supplies for the next reinforcement."
  },
  "phaseStarts": [
    4,
    20,
    36
  ],
  "spawns": [
    {
      "row": 1,
      "type": "armor",
      "time": 4
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 6
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 6.3
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 6.6
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 6.9
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 7.2
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 7.5
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 7.8
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 8.1
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 8.4
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 8.7
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 9
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 9.3
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 9.6
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 9.9
    },
    {
      "row": 1,
      "type": "armor",
      "time": 10
    },
    {
      "row": 3,
      "type": "swarm",
      "time": 10.2
    },
    {
      "row": 1,
      "type": "armor",
      "time": 16
    },
    {
      "row": 2,
      "type": "armor",
      "time": 20
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 22
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 22.3
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 22.6
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 22.9
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 23.2
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 23.5
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 23.8
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 24.1
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 24.4
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 24.7
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 25
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 25.3
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 25.6
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 25.9
    },
    {
      "row": 2,
      "type": "armor",
      "time": 26
    },
    {
      "row": 1,
      "type": "swarm",
      "time": 26.2
    },
    {
      "row": 2,
      "type": "armor",
      "time": 32
    },
    {
      "row": 3,
      "type": "armor",
      "time": 36
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 38
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 38.3
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 38.6
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 38.9
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 39.2
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 39.5
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 39.8
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 40.1
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 40.4
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 40.7
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 41
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 41.3
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 41.6
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 41.9
    },
    {
      "row": 3,
      "type": "armor",
      "time": 42
    },
    {
      "row": 2,
      "type": "swarm",
      "time": 42.2
    },
    {
      "row": 3,
      "type": "armor",
      "time": 48
    }
  ]
});
if(typeof module==='object'&&module.exports)module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
