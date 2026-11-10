# 拾荒争夺 / Salvage Skirmish

这不是原生存模式的新任务清单，而是一套尚在迭代的共享资源机制。原「自由航行」仍可选择。

## 一块残骸，互相排斥的用途

- 拖回原点回收站或已建前哨：你和货物都留在同一站内 1.5 秒后计入收益。重物更值钱，也让拖船更慢。
- 留作掩体：只挡住敌方子弹；敌弹会损坏货物、降低出售价值。友方主炮、炮台和反射子弹直接穿过，不会损伤货物。
- 投掷攻击：按当前移动方向掷出，质量决定伤害。命中后消耗，未命中也会碎裂，不能再卖。
- 给炮台供能：靠近炮台主动交付，将货物换成有限弹药，不再获得出售收入。炮台射弹会穿过货物，不会损坏货物掩体。

Q 可以切换主炮自动射击，但无需停火保护货物。跃迁会放下拖载物，因此逃命与保货不总是同一个选择。

## 动态竞争

另一名拾荒者会寻找同一批货物并拖向自己的撤离点。攻击会令其放下原来的货物，而不是生成复制品。放任它离开，会永久失去那件货物；但追击也占用时间、火力和安全路线。

这是一个新模式原型，并不意味着这些策略已经平衡，或已证明比旧模式有趣。有限的敌人类型、资源用途与局内成长仍会继续扩展；没有多人联网。

---

This is an evolving shared-resource system, not another sequence of survival objectives. The original Free Flight mode remains available.

## One wreck, mutually exclusive uses

- Tow it to the origin recycler or a purchased outpost: both pilot and cargo must remain inside the same site for 1.5 seconds. Heavy cargo is worth more but slows towing.
- Keep it as cover: it blocks hostile projectiles, whose damage lowers sale value. Friendly main-gun, turret and reflected shots pass through without damaging cargo.
- Throw it as a weapon: throw along your movement heading; mass determines impact damage. It is consumed on impact or eventually shatters after a miss, so it cannot also be sold.
- Power a turret: deliberately deliver cargo near a turret to exchange it for finite ammunition instead of sale income. Turret projectiles pass through cargo without damaging it.

Q toggles the automatic main gun, but you do not need to cease fire to protect cargo. Dashing drops the tow, so escaping danger and retaining cargo are not always the same decision.

## Dynamic competition

A rival scavenger pursues the same cargo and tows it toward its own exit. Damage makes it drop the original item, never a duplicate. Letting it escape permanently removes that item, but chasing it costs time, firepower and a safe route.

This is a new-mode prototype, not a claim that these strategies are balanced or proven more enjoyable than the previous mode. Enemy variety, resource uses and run progression still need expansion. There is no online multiplayer.


## 第七码头：一次选择，两种物理任务

首章供电选择完成后，在失联站进入第七码头。货运艇固定出现，100 米内按 G 联系。两条路线本局不可切换，完成结果永久保存；失败后可以重试。

- **供能 / 护航**：你和拖载货物都须靠近艇，且普通货物剩余价值至少 12。系统消耗这同一件货物，不能同时出售、投掷或给炮台供能。艇随后向原点移动，掠夺者追击；敌弹与接触会扣除其实际船体。艇到达原点才完成，不按等待时间直接发奖。
- **拆卸 / 拖运**：艇内唯一黑匣子被放进场上，物品身份不变。E 抓取后将飞船和匣子一起拖进原点，停留 1.5 秒才交付；前哨、转运点不能代交，普通货物结算不会把它卖掉。匣子仍可能被损坏、抢走或因错误使用而丢失；失败可重试。
- **首章影响**：居住区为返航艇提供一次濒毁恢复至 40 船体的援助；工坊提供一次最多 30 船体修补及更快返航。不是无限修复，也不免疫攻击。

成功护航后的转运点，每局最多自动交付一件带到设施内的普通手持货物，按剩余价值计入本局银行，立即消费原物。它不是第二个无限回收站。成功回收黑匣子后的监听台，持续在全场自由普通货物中按剩余价值选最高者，价值相同时选离玩家更近者；排除拖载、竞争者持有、已投掷和剧情物品。扫描只提示位置，不增加价值或复制资源。

新设施从下次拾荒出航生效，适用于剧情与自由拾荒。两项永久结果不能同时取得，也不能完成后重新选择。第七码头本身不额外赠送章节合金，回报是后续设施用途。

码头进度独立保存。format 3/4 备份包含码头；旧 format 1/2 导入保留当前码头结果。当前内容只是可玩章节增量，不代表后续空间站调查或完整战役已经实现。

## Dock Seven: one choice, two physical objectives

After choosing Chapter One’s power line, enter Dock Seven from the station. The freighter appears at a fixed location; press G within 100 metres. Routes cannot be switched during an attempt. Successful outcomes persist, while failed attempts can be retried.

- **Fuel / escort:** both pilot and held cargo must be near the ship, and the ordinary cargo must retain at least 12 value. Fuel consumes that exact object; it cannot also be sold, thrown or fed to a turret. The ship then travels toward the origin while raiders pursue it. Hostile shots and contact reduce its actual hull. Arrival completes the objective, not elapsed time alone.
- **Detach / tow:** the hold’s unique black box enters the field with its identity intact. Grab it with E and bring both pilot and box inside the origin for 1.5 seconds. An outpost or transfer point cannot deliver it, and normal cargo banking cannot sell it. The box can still be damaged, stolen or lost through misuse; failure permits another attempt.
- **Chapter One consequences:** habitat support grants one near-destruction recovery to 40 hull; workshop support grants one repair of up to 30 hull and faster travel. Neither is unlimited repair or immunity.

After a successful escort, the transfer point automatically banks at most one ordinary held cargo item brought within its radius per run, consuming the original and crediting remaining value. It is not an unlimited second recycler. After black-box recovery, the listening post continuously chooses the highest remaining-value free ordinary cargo across the field, breaking ties by proximity to the player. Held, rival-owned, thrown and story objects are excluded. Scanning only reveals a location: it adds no value and duplicates nothing.

The resulting facility appears on later story and free salvage runs. The two permanent outcomes are mutually exclusive and cannot be reselected after completion. Dock Seven awards no extra chapter-alloy payout; its reward is the facility’s future function.

Dock progress is saved separately. Format 3/4 backups include it; legacy format 1/2 imports retain the current Dock outcome. This is a playable chapter increment, not a claim that the later station investigation or a complete campaign already exists.


## 误导广播：改动争夺场地，而非复制资源

所有拾荒模式每局有三台独立中继，初始无电、默认聚拢。玩家在 90 米内按 H 控制；供能时玩家及拖载货物都须在该台 90 米内。只接受仍有价值的普通货物，不接受剧情物品、竞争者持有物或已投掷物。

供能立即移除原物并清空拖载，不能同时拿去入账、投掷、压机或炮台。充能秒数为「剩余货值 × 1.5」，单台上限 60 秒，超额浪费；面板在消耗前显示增加和浪费的秒数。三台各自耗电，没电便不提供效果。有电时免费改频，每次成功切换锁定 5 秒；切到相同频道不算一次操作。暂停/面板时间不推进场上供能计时。

- **聚拢范围 250 米**：加速拉动自由普通残骸，保留原物身份；不动玩家拖货、竞争者货物、投掷物或剧情物品。多个聚拢台覆盖同一物体时选择最近有效台，不复制货物。
- **引敌范围 380 米**：普通敌人可改追聚拢台；首领和竞争者不参与这一引诱，距玩家不足 90 米的敌人仍优先追玩家。敌人到台附近后恢复追击，并有 8 秒不再受引诱的间隔，不能用中继永久关住敌人。第七码头护航中，普通敌人的中继引诱也可能改变其返航路线上的威胁。
- **屏蔽范围 250 米**：使自由普通货物不再成为竞争者的可选目标；不清除现有敌人，不提供护盾，不移动货物，也不能从竞争者手上夺回原物。剧情货物不受这项保护。

成功供能或改频至少一次，并在船体仍存活时主动撤离，首次解锁免费布局工程。玩家可回失联站在中央、西侧、东侧中选择一台中继的下局位置，另两台保持不变。没有解锁费用、合金奖励或伤害加成；后续可免费重新选择。每局中继供能重置，永久保留的是工程解锁和布局，而非本局资源。

可以完全忽略广播继续玩原有拾荒，不需要逐台激活或完成三连任务。format 4 整包备份保存广播解锁和布局；导入 format 1/2/3 不覆盖当前广播状态。当前仅增加场地交互与调查线索，广播背后的后续调查、可重复动态遭遇与长期内容仍在开发。

## Misleading Broadcast: change the contested field, never duplicate resources

Every salvage run has three independent relays, initially unpowered and set to Gather. Press H within 90 metres; feeding requires both player and held cargo within that distance. Relays accept valuable ordinary cargo, not story items, rival-owned objects or thrown cargo.

Feeding immediately removes the original and releases the tow. That item cannot also be banked, thrown, pressed into hull repair or supplied to a turret. Charge is remaining value × 1.5 seconds, capped at 60 per relay with overflow wasted. The panel previews added and wasted seconds before consumption. Each relay drains independently and stops working when empty. Switching a powered relay is free, with a five-second lock after each successful change; selecting its existing channel is not another action. Pausing or opening the controls does not advance field charge time.

- **Gather, 250-metre field:** accelerates free ordinary wrecks toward the relay while preserving object identity. Held, rival-owned, thrown and story objects are excluded. Overlapping fields choose the nearest effective relay rather than duplicating cargo.
- **Lure, 380-metre range:** ordinary enemies can pursue a Gather relay. Bosses and rivals ignore this lure; enemies within 90 metres of the player still prioritize the player. Enemies reaching the relay resume pursuit and cannot be lured again for eight seconds. A relay cannot permanently trap them. During a Dock Seven escort, the lure can also change ordinary threats along the return route.
- **Jam, 250-metre field:** makes free ordinary cargo ineligible for the rival’s targeting. It clears no enemies, provides no shield, moves no cargo and cannot take an object from the rival’s tow. Story cargo receives no such protection.

Successfully feed or retune at least once and extract while alive to unlock free relay engineering. Back at Silent Station, choose Central, West or East for one relay’s position next run; the other two remain unchanged. There is no purchase fee, alloy award or damage bonus, and the layout can be changed freely on later visits. Relay charge resets each run: only the engineering unlock and layout persist, not spent resources.

Ignoring the broadcast does not block ordinary salvage or extraction. There is no required three-relay activation chain. Format 4 full backups preserve the broadcast unlock and layout; importing formats 1/2/3 leaves current broadcast state unchanged. This currently adds field interactions and investigation clues; the later investigation, repeatable dynamic encounters and long-term content remain under development.
