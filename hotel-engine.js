(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Hotel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const IDS=['shen','lin','zhou','xu'],POWERS=['heat','archive','radio'];
const bi=(zh,en)=>({zh,en}),pick=(x,l)=>x[l==='en'?'en':'zh'];
const guests={shen:{name:bi('沈砚','Shen Yan'),role:bi('退休水闸值班员','Retired sluice operator')},lin:{name:bi('林乔','Lin Qiao'),role:bi('记者，洪灾失踪者的妹妹','Reporter; her brother went missing in the flood')},zhou:{name:bi('周弥','Zhou Mi'),role:bi('承包公司的电工','Contractor electrician')},xu:{name:bi('许岚','Xu Lan'),role:bi('前急救护士','Former emergency nurse')}};
const evidence={
 booking:{title:bi('用死者名字订的房','A reservation in a dead man’s name'),text:bi('四间房由许岚预订，付款姓名是七年前身亡的丈夫。召集信上的墨水与登记簿一致。她在召集当事人，不是伪造一个活人。公开事故摘要附在登记页：撤离警报20:50，开闸21:10。','Xu booked all four rooms under her late husband’s name. The invitation ink matches the register. She assembled the witnesses; no dead guest is alive. The attached public report lists an evacuation siren at 20:50 and the gate opening at 21:10.')},
 key:{title:bi('黄铜钥匙','The brass key'),text:bi('沈砚交出的黄铜钥匙开启档案柜。前台的银色总钥匙只能开客房，不能开这个柜子。','Shen’s brass key opens the archive cabinet. The silver master key at reception opens bedrooms, not this cabinet.')},
 keys:{title:bi('借用簿与钥匙架','The borrowing book and key rack'),text:bi('借用簿上有林乔的签名，登记的是银色总钥匙。钥匙架标签写“客房”；档案柜旁的锁具登记标注“黄铜专用钥匙”，并画有不同的齿形。','Lin signed the borrowing book for the silver master key. Its rack is labelled “Bedrooms.” The lock register beside the archive cabinet specifies a dedicated brass key and shows a different tooth pattern.')},
 log:{title:bi('原始开闸日志：21:10','Original gate log: 21:10'),text:bi('原始记录写21:10执行开闸，旁边是“撤离确认未收到”的铅笔记号。公开报告声称20:50已响撤离警报。你已抄下记录，原件仍需保护。','The original records the gate opening at 21:10, with a pencil note: “Evacuation confirmation not received.” The public report claims the siren sounded at 20:50. You copied the entry; the original still needs protection.')},
 medical:{title:bi('伤员卡：21:18','Triage card: 21:18'),text:bi('许岚带来的原始伤员卡写21:18接收首批伤员，备注“警报未响”。它独立于水闸日志，证明开闸时撤离尚未完成。','Xu’s original triage card records the first injured arrivals at 21:18: “No siren yet.” Independent of the gate log, it shows the evacuation was not complete when the gate opened.')},
 tape:{title:bi('电台录音：21:40','Radio recording: 21:40'),text:bi('旅馆旧应急录音的报时与警报同轨：21:40才首次鸣响。录音带标签是当年原封签；它与公开报告相差50分钟。','The hotel’s emergency recording carries the time signal and the first siren on the same track: 21:40. Its original dated seal remains intact, contradicting the public report by fifty minutes.')},
 order:{title:bi('取回委托，不是维修单','A retrieval order, not a repair order'),text:bi('承包公司的信要求周弥在第三夜结束前“取回旧开闸日志，避免非正式流转”。信封内还有一把档案柜备用黄铜钥匙。没有杀人指令。','The company orders Zhou to recover the old gate log before the third night ends, preventing “unofficial circulation.” A spare brass archive key is enclosed. It contains no order to kill.')},
 admission:{title:bi('沈砚的承认','Shen’s admission'),text:bi('沈砚承认他收到“先开闸，警报马上补”的电话，事后签了倒填时间的报告。他不是不知情，但不是那个打电话的人。','Shen admits receiving a call: “Open the gate; the siren will follow.” He later signed the backdated report. He knew what happened, but was not the caller.')},
 copy:{title:bi('记者的备份照片','The reporter’s backup'),text:bi('林乔拍下原日志与封签，备份由你保管。它不能替代出庭原件，但即使原件被带走，也能支持公开核查。','Lin photographed the original log and its seal, leaving a backup with you. It cannot replace the original at a hearing, but can support public scrutiny if the original disappears.')}
};
const messages={
 opening:bi('暴风雪封住山路，四位客人带着同一封信抵达。登记簿上却出现一个七年前死去的名字。第三夜结束后的清晨，清雪车才会来。你有三夜，决定让谁见面、把电留给哪里，以及什么值得被带下山。','A blizzard closes the mountain road. Four guests arrive with the same invitation, but the register bears a man’s name who died seven years ago. The snowplow will arrive after the third night. You have three nights to decide who meets, where power goes, and what leaves the mountain.'),
 night1:bi('第一夜 · 总钥匙失踪了一会儿。周弥指向林乔：“她借过总钥匙。”沈砚没有接话。','Night One · The master key briefly disappeared. Zhou points at Lin: “She borrowed the master key.” Shen says nothing.'),
 night2:bi('第二夜 · 许岚终于说：“我等了七年，不想再等一句‘记录遗失’。”周弥的车明早仍不会来。','Night Two · Xu finally says, “I waited seven years. I will not accept ‘records missing’ again.” Zhou’s car still cannot reach the hotel tomorrow.'),
 night3:bi('第三夜 · 清雪队确认天亮通路。周弥开始收拾工具箱；若原日志仍未封存，他会在最后一个时段后带走它。','Night Three · The snowplow confirms the road will open at dawn. Zhou packs his toolbox. If the original log is not secured, he will take it after the final time slot.'),
 hallMeet:bi('大厅里，许岚把一张旧伤员卡推到沈砚面前。他的茶杯停在半空。两人现在可以被一起听见。','In the hall, Xu slides an old triage card toward Shen. His cup stops halfway to his mouth. You can now overhear them together.'),
 archiveMeet:bi('档案室里，林乔拦住周弥的工具箱：“修电为什么要找纸？”他压低了声音。','In the archive, Lin blocks Zhou’s toolbox. “Why does an electrician need paper?” He lowers his voice.'),
 corridorMeet:bi('相邻房门之间，林乔叫住沈砚。他没有退回房内。走廊里有一次不经其他人的谈话机会。','Between adjacent doors, Lin stops Shen. He does not retreat. There is a chance to overhear them privately in the corridor.'),
 shenTalk:bi('沈砚把黄铜钥匙放下：“柜里有原件。你可以看，但别只挑对我有利的那页。”','Shen sets down a brass key. “The original is in the cabinet. Read it, but do not choose only the page that helps me.”'),
 shenAgain:bi('沈砚：“我签过那张假报告。若许岚愿意坐在旁边，我会在听证会上说清楚。”','Shen: “I signed the false report. If Xu sits beside me, I will say so at a hearing.”'),
 xuTalk:bi('许岚打开医疗包：“我丈夫没回来。但这张卡不是为他写的，是当晚所有伤员的时间。”','Xu opens her medical bag. “My husband never came home. But this card was not written for him. It records the time for everyone injured that night.”'),
 linTalk:bi('林乔：“我借钥匙是想问沈砚，我哥哥最后去了哪里。我想报道，不想靠猜。给我两份能对上的记录，我会署名。”','Lin: “I borrowed the key to ask Shen where my brother went. I want to report facts, not guesses. Give me two records that agree, and I will put my name on it.”'),
 zhouTalk:bi('周弥：“公司让我来取一份旧档案。我知道你们会怎么想，所以没说。我不会伤人，但也不想空手回去。”','Zhou: “The company sent me for an old file. I knew what you would think, so I said nothing. I will not hurt anyone, but I do not want to go back empty-handed.”'),
 emptyListen:bi('你听到了脚步和风声，没有足以记录的新对话。这个时段已经过去。','You hear footsteps and the wind, but no new conversation worth recording. The time slot has passed.'),
 locked:bi('档案柜锁着。灯光足够，但你还需要沈砚的黄铜钥匙。','The archive cabinet is locked. There is enough light, but you still need Shen’s brass key.'),
 dark:bi('这里没有供电。你看不清封签与数字，不能把猜测记作证据。','There is no power here. You cannot read the seals or numbers, and will not record a guess as evidence.'),
 caught:bi('周弥还在房内。他拦住你：“想问就问，别翻我的东西。”他的信任下降，这个时段已经过去。','Zhou is still in his room. “Ask me. Do not search my belongings.” His trust falls, and the time slot passes.'),
 secure:bi('你把原日志封入旅馆保险柜，登记封签。周弥可以离开，但不能再悄悄带走原件。','You seal the original log inside the hotel safe and register the seal. Zhou can leave, but cannot quietly take the original.'),
 noLog:bi('先找到原日志，才能封存它。你不能封存一条传闻。','Find the original log before securing it. A rumor cannot be locked in a safe.'),
 stolen:bi('最后的脚步停在档案柜前。周弥把未封存的原日志收进工具箱。你的笔记还在，但原件已离开你的控制。','The last footsteps stop at the archive cabinet. Zhou packs the unsecured original into his toolbox. Your notes remain, but the original is no longer in your custody.'),
 saved:bi('周弥看了一眼保险柜，空着手回房。天亮后，原件会由你决定去向。','Zhou looks at the safe and returns to his room empty-handed. At dawn, you will decide where the original goes.'),
 next:bi('这一夜结束了。山路仍封着，你可以重新分房与调配两路电力。','The night ends. The road remains closed. You may reassign rooms and allocate two power circuits.'),
 decision:bi('天亮，清雪车到了。三夜的记录不会自动变成正义。你要决定如何使用它们。下方明确列出每条路线所需条件；证据不足仍可以选择，但会有相应后果。','At dawn, the snowplow arrives. Three nights of records do not become justice on their own. Decide how to use them. Each route states its requirements; you may choose without sufficient evidence, but the consequences will differ.')
};
const endings={
 published:{title:bi('结局 · 山下收到的声音','Ending · The valley hears'),text:bi('林乔署名的报道把开闸日志与独立时间记录并列公开。承包公司无法再把时间差叫作笔误。许岚第一次不必独自讲述那一夜；沈砚也必须面对自己签下的报告。案件进入公开核查，谁下令的那通电话仍要继续追查。','Lin publishes the gate entry beside an independent time record. The company can no longer dismiss the discrepancy as a typo. Xu no longer tells the story alone; Shen must face the report he signed. The case enters public review. The caller’s identity still requires investigation.')},
 hearing:{title:bi('结局 · 同一张桌子','Ending · At the same table'),text:bi('你带着封存原件、沈砚与许岚下山。两人共同签署陈述，申请重开事故听证。没有一夜之间的定罪，但证据链与出庭者都在。林乔暂缓发稿，等他们先说完。','You descend with the sealed original, Shen and Xu. They sign a joint statement requesting a reopened hearing. There is no overnight conviction, but both the evidence chain and witnesses are present. Lin holds her article until they have spoken.')},
 concealed:{title:bi('结局 · 仍然亮着的旅馆','Ending · The hotel stays lit'),text:bi('你决定不把记录送下山，并将原件交回承包公司。周弥收好了工具箱；许岚把伤员卡放回包里，退掉了明年的房间。旅馆恢复了安静，那张20:50的公开报告也继续留在档案中。这是一次选择，不是谜底不存在。','You decide not to send the records down the mountain and return the original to the company. Zhou closes his toolbox. Xu puts away the triage card and cancels next year’s room. The hotel grows quiet, and the public report still reads 20:50. This was a choice, not the absence of a truth.')},
 failed:{title:bi('结局 · 没有对上的时间','Ending · The times do not add up'),text:bi('你试图推动指认，却缺少这条路线需要的独立记录、可靠交接或愿意署名的人。争论盖过了证据。清雪车带走四位客人，案子仍然悬着。回看证据板：钥匙的用途、21:10与21:18或21:40，能告诉你下一次该把行动花在哪里。','You push for an accusation without the independent records, secure custody or willing witnesses required for that route. Argument overwhelms evidence. The snowplow takes the four guests away, leaving the case unresolved. Revisit the board: the keys, 21:10, and either 21:18 or 21:40 show where your next attempt could use its actions.')}
};
Object.assign(messages,{
 busy:bi('这位客人正在与别人交谈，不能进行单独问话。你可以在对应地点聆听，或等另一个时段。没有行动被消耗。','This guest is in a conversation and cannot be interviewed privately. Listen at that location or wait for another time slot. No action was spent.'),
 'deduction-key':bi('推断成立：钥匙记录与黄铜钥匙说明或档案实物相互印证：银钥匙不适配档案锁。借客房钥匙不能单独证明盗取日志。','Supported: the key record, checked against the brass key description or the archive itself, establishes that the silver key does not fit the archive lock. Borrowing a bedroom key does not establish log theft.'),
 'deduction-evacuation':bi('推断成立：21:10已经开闸；21:18，许岚仍在东堤闸屋接收未撤出的居民。两份按同一电台报时校准的记录互相支持。','Supported: the gate opened at 21:10. At 21:18, Xu was still receiving residents who had not left the east-bank gatehouse. Both records were calibrated to the same radio time signal.'),
 'deduction-timing':bi('推断成立：开闸日志记21:10，原封应急录音在21:40才录到首次警报。它们使用同一电台报时，不能用钟慢来解释。','Supported: the gate log says 21:10, and the sealed emergency recording captures the first siren at 21:40. Both use the same radio time signal; a slow clock cannot explain the gap.'),
 'compare-wrong':bi('这两份材料还不支持所选主张。动机或借钥匙记录不能证明警报时刻；请找同一事件的独立时间记录，或钥匙与实际档案锁的对应。你的夜间行动没有减少。','These records do not support that claim. Motive or a borrowed key cannot establish the siren time. Look for independent time records or the match between a key and the actual archive lock. No night action was spent.'),
 'confront-needed':bi('先在证据板用两条原始记录支持具体主张。没有行动被消耗。','First support a specific claim with two original records on the evidence board. No action was spent.'),
 shenTalk:bi('沈砚：“别拿林乔借钥匙的事问我。柜子是另一把锁。”他把黄铜钥匙推过来。“你可以看值班记录。问责任，先把时间对清楚。”','Shen: “Do not ask me about Lin borrowing a key. The cabinet has a different lock.” He slides over a brass key. “Read the duty log. Before you ask about blame, get the times straight.”'),
 xuTalk:bi('许岚：“我带了当晚的卡。上面写的是地点和时间，不是谁有罪。你看完再问我。”她仍不肯谈为什么寄出那四封信。','Xu: “I brought the card from that night. It records places and times, not who is guilty. Read it before you ask.” She will not yet explain the four invitations.'),
 zhouTalk:bi('周弥：“我是来处理公司旧物的。你要问事故，屋里有比我更清楚的人。”他把工具箱往脚边拉了拉。','Zhou: “I am here to handle old company property. Others here know more about the accident.” He draws the toolbox closer.'),
 linTalk:bi('林乔：“是我借了银钥匙。我哥哥最后被人看见时，在沈砚值班的闸屋。我不会只凭他的表情写稿；拿两份能对上的记录来。”','Lin: “I borrowed the silver key. My brother was last seen at the gatehouse where Shen worked. I will not write a story from his expression. Bring me two records that agree.”'),
 'xu-confirm':bi('许岚对照你的记录，终于点头：“是我寄的信。沈砚不回我的信，但每年仍给阿衡交忌日的花钱。我用丈夫的名字订房，是要他知道这件事还没结束。卡上的十二个人，当时真的没撤出去。我愿意作证。”','Xu checks your findings and nods. “I sent the letters. Shen ignores mine, but still pays for flowers on my husband Aheng’s anniversary. I booked under his name so Shen would know this was not over. Those twelve people on the card had not evacuated. I will testify.”'),
 'lin-confirm':bi('林乔把两条时间摆在一起：“这才值得署名。”她为原日志拍照留备份。“你决定公开，还是先让他们作证；我不会替你选。”','Lin places the two times side by side. “This is worth putting my name on.” She photographs the original for a backup. “Publish, or let them testify first. I will not choose for you.”'),
 'hall-whisper':bi('许岚：“十二个人还在闸屋，你怎么能说撤完了？”沈砚：“先别在这里。”她把伤员卡留在桌上，但没有得到回答。','Xu: “Twelve people were still in the gatehouse. How could you say it was cleared?” Shen: “Not here.” She leaves the triage card on the table, without an answer.'),
 'corridor-whisper':bi('林乔问的不是借钥匙，而是她哥哥最后所在的位置。沈砚给了她档案柜钥匙；若你已有能核对的时间线，她会当场为原件留备份。','Lin asks about her brother’s last location, not the borrowed key. Shen gives her the archive key. If you already have a verified timeline, she makes a backup of the original there.')
});
evidence.booking.text=bi('付款人是许岚，订房姓名是已故的许衡。随信附着沈砚每年为许衡订花的收据。信上只写“请别再让阿衡等”。公开事故摘要：警报20:50，开闸21:10。尚需向许岚核实她的目的。','Xu Lan paid for the rooms under the name of her late husband, Xu Heng. The invitation includes Shen’s yearly flower receipts for him and reads, “Please do not keep Aheng waiting.” The public summary lists the siren at 20:50 and the gate opening at 21:10. Xu’s purpose still needs checking.');
evidence.log.text=bi('黄铜锁柜中原日志：开闸21:10，备注“撤离确认未收到”。值班签入栏写当晚20:00按县电台报时校钟。公开摘要写20:50警报、21:10开闸。你抄下了原文，尚未封存原件。','In the brass-lock cabinet: gate opened 21:10; note, “Evacuation confirmation not received.” The duty sign-in records clock synchronization to county radio at 20:00. The public summary says siren 20:50, gate 21:10. You copied the entry but have not secured the original.');
evidence.medical.text=bi('原卡地点栏：东堤闸屋。21:18，十二名居民仍滞留，进水后开始转移；许岚签名见证“现场未听到警报”。卡背注明护士表当晚20:00按县电台报时校准。这是现场记录，不是撤离后在医院补填。','Original location: east-bank gatehouse. At 21:18, twelve residents remained; movement began after water entered. Xu signed “No siren heard on site.” The reverse notes her watch was synchronized to county radio at 20:00. This is an on-site record, not a later hospital entry.');
evidence.tape.text=bi('当年原封签录音连续保留县电台报时。21:40的报时后，背景首次出现撤离警报；此前的录音没有中断。它与日志、护士表使用相同时间基准。','The originally sealed recording continuously captures county-radio time signals. The first evacuation siren appears after the 21:40 signal; the preceding recording is uninterrupted. It shares the time reference used by the duty log and nurse’s watch.');
Object.assign(messages,{
 'shen-pending':bi('沈砚：“钥匙已经给你了。柜里的记录不会变。先把它和别处的时间对上，再问我当晚为什么没停下来。”','Shen: “You have the key. The record in the cabinet will not change. Compare it with a time recorded elsewhere, then ask why I did not stop that night.”'),
 'shen-acknowledged':bi('沈砚：“我已经承认签了那张假报告，不会再收回。现在要决定的，是把我的陈述交给记者，还是和许岚一起带到听证桌上。”','Shen: “I have admitted signing the false report. I will not take that back. Now we must decide whether my statement goes to the reporter or to a hearing with Xu.”'),
 'shen-reconfirm':bi('沈砚在陈述末尾补上姓名：“时间和责任，我都说过了。请保留原件，让别人能核对，不要只剩我的一句话。”','Shen signs his statement. “I have spoken about the timing and my responsibility. Preserve the original so others can check it, rather than relying on my word.”'),
 'xu-pending':bi('许岚：“伤员卡在你手里。那十二个人不是数字。先确认他们为什么还在那里，我才愿意把这件事交给你往下办。”','Xu: “You have the triage card. Those twelve people are not just numbers. Establish why they were still there before asking me to trust you with what happens next.”'),
 'xu-cooperating':bi('许岚：“信是我寄的，名字也是我借用丈夫的。我已经解释过。现在我愿意作证，但请别把居民的名字当作吸引眼球的标题。”','Xu: “I sent the letters and used my husband’s name. I have explained why. I will testify now, but do not turn the residents’ names into a headline.”'),
 'xu-reconfirm':bi('许岚把伤员卡装进透明袋：“我会带这张原卡下山。公开报道和听证不是同一回事；你选哪条路，都请把伤员的时间原样留下。”','Xu slips the triage card into a clear sleeve. “I will take this original down the mountain. Publication and a hearing are different paths. Whichever you choose, preserve the recorded times exactly.”'),
 'lin-cooperating':bi('林乔：“备份已经留好了，我也答应署名。接下来不缺一句更狠的话，缺的是你决定：先让大家读到，还是先让当事人坐到同一张桌前。”','Lin: “The backup is safe, and I have agreed to put my name on it. We do not need a harsher accusation now. We need your choice: let everyone read it first, or let the witnesses sit together first.”'),
 'lin-reconfirm':bi('林乔重新核对照片与封签记录：“副本不等于原件。报道可以靠它继续，但如果要听证，原日志仍然值得保护。”','Lin checks the photographs against the seal record. “A copy is not the original. It can keep a report alive, but the original still matters if you want a hearing.”'),
 'lin-sealed-copy':bi('林乔按旅馆登记程序核对封签，为已封存原件拍摄存证：“封签不拆，副本另留。公开和听证，你还有两种选择。”','Following the hotel’s custody procedure, Lin checks the seal and photographs the secured record. “Keep the seal intact and the copy separate. Publication and a hearing can both remain options.”'),
 'zhou-exposed':bi('周弥：“你已经看过委托了，我没必要再说是来修电。公司要原件；至于你们抄了什么，我管不住。”','Zhou: “You have seen the order. There is no point pretending this is electrical work. The company wants the original. I cannot control what you have copied.”'),
 'zhou-blocked':bi('周弥朝保险柜看了一眼：“你已经登记封签，我不能把它说成随手取回的旧物。天亮时，交不交给我，是你的决定。”','Zhou glances at the safe. “With the seal registered, I cannot call this a casual recovery of old property. At dawn, whether you hand it to me is your decision.”'),
 'hall-accountability':bi('暖炉旁，许岚没有再问沈砚是否知情。她问：“你肯把刚才承认的话写下来吗？”沈砚把杯子放下，开始找笔。','By the hearth, Xu no longer asks whether Shen knew. “Will you put what you admitted in writing?” Shen sets down his cup and reaches for a pen.'),
 'hall-aligned':bi('大厅里，沈砚和许岚在核对各自要带下山的材料。两人仍坐得很远，但这一次没有谁先离开。','In the hall, Shen and Xu check what each will take down the mountain. They still sit far apart, but neither leaves first this time.'),
 'hall-after-admission':bi('许岚：“我听到你承认了。别替那十二个人解释，只把你知道的时间写清。”沈砚：“好。这次按原记录写。”','Xu: “I heard your admission. Do not speak for those twelve people. Write the times you know.” Shen: “All right. This time, from the original record.”'),
 'hall-plan':bi('许岚要保留伤员卡原件，沈砚同意带署名陈述。两人把材料分开收好：同一条时间线，需要彼此独立的来源。','Xu will keep the original triage card; Shen agrees to bring a signed statement. They pack them separately: the same timeline needs independent sources.'),
 'archive-watched':bi('档案室里，林乔已经在周弥面前摊开记录。她不再问他为什么找纸，只盯着他的工具箱有没有合上。','In the archive, Lin has laid out the records in front of Zhou. She no longer asks why he wants paper; she watches whether he closes his toolbox.'),
 'archive-secured':bi('档案柜空了，原件在保险柜。周弥站在门口，林乔提醒他：“封签有登记。今晚没有能悄悄拿走的东西。”','The cabinet is empty; the original is in the safe. Zhou stands in the doorway. Lin reminds him, “The seal is registered. There is nothing to take quietly tonight.”'),
 'archive-known-order':bi('周弥重复委托上的“取回”二字。林乔反问：“既然只是旧物，为什么非要今晚？”没有新文件出现，但两人的立场已明。','Zhou repeats the order’s word, “recover.” Lin asks, “If it is just old property, why tonight?” No new document appears, but their positions are clear.'),
 'corridor-accountability':bi('相邻房门间，林乔问沈砚愿不愿把已承认的内容署名。他没有躲开：“你可以记，但别省掉我签过假报告那一句。”','Between adjacent doors, Lin asks Shen to sign what he has admitted. He does not retreat. “Write it down, but do not omit that I signed the false report.”'),
 'corridor-backed-up':bi('走廊里，林乔确认备份仍在。沈砚问她会不会把报道写成结案，她回答：“不会。记录证明了什么，就写到哪里。”','In the corridor, Lin confirms the backup is safe. Shen asks whether she will write as though the case is closed. “No. Only as far as the records support,” she replies.'),
 'night3-secured':bi('第三夜 · 清雪队确认本夜结束后的清晨通路。周弥收拾工具箱时，看见保险柜上的登记封签；原件已不在他能悄悄取走的地方。','Night Three · The snowplow confirms the road will open at dawn after this night. While packing, Zhou notices the registered safe seal; the original is no longer within quiet reach.'),
 'review-log-secured':bi('你复核抄录的21:10与校时说明。原日志已在保险柜，封签仍完整；这次查看没有改变保管状态。','You review the copied 21:10 entry and clock calibration. The original remains sealed in the safe; this review does not change its custody.'),
 'review-log-open':bi('21:10与“撤离确认未收到”仍在同一页。原件还在档案柜，抄录不等于保护。','21:10 and “Evacuation confirmation not received” remain on the same page. The original is still in the cabinet; copying is not protection.'),
 'review-booking-confirmed':bi('你把订房付款、订花收据和许岚的解释放在一起。她使用亡夫名字，是要让一直回避她的沈砚回应旧事。这个疑点已经核实。','You place the booking payment, flower receipts and Xu’s explanation together. She used her late husband’s name to make the evasive Shen respond. This question is now checked.'),
 'review-booking-open':bi('许岚付款、许衡署名、沈砚订花，这三个名字仍连在同一份材料里。她的动机还需要本人解释。','Xu Lan paid, Xu Heng’s name was used, and Shen bought the flowers. Those links remain in the records; Xu still needs to explain her purpose.')
});
function currentEvidence(s,id){
 let text=evidence[id].text;
 if(id==='log')text=bi('原记录：开闸21:10，备注“撤离确认未收到”；值班钟于20:00按县电台校准。公开摘要写20:50警报。','Original entry: gate opened at 21:10; “Evacuation confirmation not received.” The duty clock was synchronized to county radio at 20:00. The public summary places the siren at 20:50.');
 if(id==='log'){
  const custody=s.phase==='ended'&&s.ending==='concealed'?bi('当前去向：原件归承包公司；没有留作本次核查。','Current custody: the original is with the company, not retained for this review.'):
   s.flags.originalLost?bi('当前保管：未封存原件已被周弥取走。','Current custody: Zhou has taken the unsecured original.'):
   s.flags.secured?bi('当前保管：原件已封存，登记封签有效。','Current custody: the original is secured under a registered seal.'):
   bi('当前保管：原件仍在档案柜，尚未封存。','Current custody: the original remains in the cabinet, unsecured.');
  text=bi(text.zh+' '+custody.zh+(s.flags.copied?' 另有林乔照片备份。':''),text.en+' '+custody.en+(s.flags.copied?' Lin’s photographic backup also exists.':''));
 }
 if(id==='booking'&&s.trust.xu>0)text=bi('付款与订花收据已和许岚的解释核对。她用亡夫许衡（阿衡）的名字召集沈砚：他回避她，却仍年年为死者订花。预订身份与召集目的已确认，不是死者复生。','The payment and flower receipts have been checked against Xu’s explanation. She used her late husband Xu Heng’s name, Aheng, to summon Shen: he avoided her but still sent memorial flowers every year. The booking identity and purpose are confirmed; no dead guest has returned.');
 return text;
}
const QUESTIONS={
 key:{label:bi('借用的钥匙能说明什么？','What does borrowing the key establish?'),description:bi('先分清客房与档案柜的锁，再判断借钥匙能支持多大范围的指认。','Distinguish the bedroom and archive locks before deciding how far the borrowed key supports an accusation.'),answer:'separate-locks',pair:['keys','log'],alternatives:[['keys','key']],explanations:[
 {id:'silver-proves-theft',label:bi('借过总钥匙，就能确认拿走日志','Borrowing the master key proves the log was taken'),description:bi('林乔持有能进入相关区域的钥匙，借用记录将她与日志失窃联系起来。','Lin held a key to the relevant area; the borrowing record links her to the missing log.')},
 {id:'separate-locks',label:bi('锁具不同，借客房钥匙不足以证明取走日志','Different locks: a bedroom key does not establish log theft'),description:bi('银钥匙对应客房锁，档案柜另有钥匙；借用记录仅能确认客房出入条件。','The silver key serves the bedrooms and the cabinet has another key; the borrowing record establishes access to bedrooms.')},
 {id:'no-one-entered',label:bi('总钥匙打不开档案柜，所以没人进去过','The master key cannot open the cabinet, so nobody entered'),description:bi('银钥匙不适配档案柜，因此这次借钥匙期间档案柜没有被打开。','The silver key does not fit the cabinet, so the cabinet remained unopened during this borrowing.')}
 ]},
 evacuation:{label:bi('开闸时，东堤处于什么状态？','What was happening on the east bank when the gate opened?'),description:bi('核对地点、人员和校时方式；受伤记录不自动等于撤离记录。','Check location, people and clock calibration. An injury record is not automatically an evacuation record.'),answer:'not-cleared',pair:['log','medical'],explanations:[
 {id:'all-safe',label:bi('登记伤员意味着居民已经安全撤走','Recording injuries means residents had already evacuated safely'),description:bi('21:18记录的是撤离后的接收情况，居民当时已经离开危险区域。','The 21:18 entry records reception after evacuation, when the residents were already outside the danger area.')},
 {id:'clock-error',label:bi('只是两只钟不同步，无需质疑撤离','The clocks differed, so the evacuation need not be questioned'),description:bi('两份记录使用不同的钟，八分钟之差可能来自时钟偏差。','The two records use different clocks; the eight-minute gap may come from their offsets.')},
 {id:'not-cleared',label:bi('开闸后仍有人滞留东堤，撤离未完成','People remained on the east bank after opening; evacuation was incomplete'),description:bi('21:18记录中的居民仍在东堤，晚于日志所记的21:10开闸。','The residents in the 21:18 entry were still on the east bank, after the log’s 21:10 opening.')}
 ]},
 timing:{label:bi('警报与开闸，谁在前？','Which came first: the siren or the gate opening?'),description:bi('将连续录音和开闸记录对照，不用公开摘要代替原始记录。','Compare the continuous recording and operating log rather than substituting the public summary for either.'),answer:'siren-late',pair:['log','tape'],explanations:[
 {id:'siren-late',label:bi('先开闸，后响实际撤离警报','The gate opened before the actual evacuation siren'),description:bi('日志记录21:10开闸，录音记录21:40首次响起撤离警报。','The log records opening at 21:10; the recording places the first evacuation siren at 21:40.')},
 {id:'siren-before',label:bi('警报已经先响，公开摘要没有问题','The siren sounded first, so the public summary is accurate'),description:bi('摘要记20:50警报；录音中的21:40可能是后来再次鸣响。','The summary lists a 20:50 siren; the recorded 21:40 sound may have been a later repetition.')},
 {id:'both-false',label:bi('两份记录不一致，所以两份都是伪造','The records differ, so both must be fabricated'),description:bi('日志与录音呈现的时序不同于公开摘要，可能都是事后改写的材料。','The sequence in the log and recording differs from the public summary; both may have been altered afterward.')}
 ]}
};
function questionOpen(s,id){return s.deductions.includes(id)||(id==='key'?has(s,'keys'):id==='evacuation'?(has(s,'log')||has(s,'medical')):has(s,'tape'));}
Object.assign(messages,{
 'compare-records-key':bi('这组材料还不能同时核实借用钥匙的用途与档案柜的锁具。查看已有的钥匙记录及实物说明；人物动机不能代替开锁能力。没有消耗行动。','These records do not jointly establish the borrowed key’s use and the cabinet lock. Review the key records and physical-key description; motive cannot substitute for access. No action was spent.'),
 'compare-records-evacuation':bi('这组材料还不能同时确定开闸时间与东堤居民当时的去留。寻找记录地点、人员状态及可核对时间的独立来源。没有消耗行动。','These records do not jointly establish the opening time and whether east-bank residents had left. Look for an independent source recording location, residents and comparable times. No action was spent.'),
 'compare-records-timing':bi('这组材料还不能同时确定开闸时间与实际首次警报时间。公开摘要是待核查的说法；需要能与操作记录对照的独立警报记录。没有消耗行动。','These records do not jointly establish the opening time and the first actual siren. The public summary is the claim being checked; an independent siren record is needed alongside the operating record. No action was spent.'),
 'compare-select':bi('先选定一个疑问下的具体解释。系统不会替你选答案；这次没有消耗行动。','Select an explicit explanation for a question first. No answer is selected for you, and no action was spent.'),
 'compare-select-records':bi('需要两条不同、已经取得的材料来检验解释。没有消耗行动。','Choose two different records you have actually acquired to test the explanation. No action was spent.'),
 'wrong-silver-proves-theft':bi('借用记录能证明林乔取得过银钥匙，但钥匙架与实际档案锁显示它打不开日志柜。它不能单独证明她取走日志，也不能证明她从未进入客房。','The borrowing record shows Lin had the silver key, but the rack and actual archive lock show it cannot open the log cabinet. That does not prove she took the log, nor that she never entered a bedroom.'),
 'wrong-no-one-entered':bi('一把银钥匙打不开，不等于所有人都无法开启。你已经见到对应档案锁的黄铜钥匙；钥匙限制不能推成“无人进入”。','One silver key failing to fit does not mean nobody could open the cabinet. You have seen the brass key matching its lock. A key limitation cannot establish that nobody entered.'),
 'wrong-all-safe':bi('伤员卡的地点是东堤闸屋，不是山下医院。卡上写十二人仍滞留、进水后开始转移；它不支持“已经安全撤完”。','The card’s location is the east-bank gatehouse, not a hospital in the valley. It records twelve residents remaining and movement beginning after water entered. It does not support a completed safe evacuation.'),
 'wrong-clock-error':bi('这不是未经校准的两只钟：日志签入栏与卡背都记录当晚20:00对县电台报时校准。需要回应现场人员仍滞留的内容，而不能只归因于钟慢。','These are not two unchecked clocks. The log sign-in and card reverse both record synchronization to county radio at 20:00. You must account for the residents still present, not simply blame a slow clock.'),
 'wrong-siren-before':bi('20:50来自公开摘要，而原封连续录音直到21:40才出现首次警报；日志记21:10开闸。用摘要覆盖两条原始记录，会绕开你正在核查的矛盾。','20:50 comes from the public summary, while the sealed continuous recording first captures the siren at 21:40 and the log records opening at 21:10. Letting the summary override both originals evades the contradiction you are checking.'),
 'wrong-both-false':bi('21:10开闸与21:40警报可以同时为真：它们记录的是两个不同事件。先后不一致于公开摘要，不等于原始材料彼此矛盾，更不能直接证明双双伪造。','A 21:10 opening and 21:40 siren can both be true: they record different events. Disagreeing with the public summary is not the same as contradicting each other, and does not establish that both were forged.')
});
function create(){return {version:1,night:1,phase:'planning',slot:0,rooms:['shen','lin','zhou','xu'],power:['heat','archive'],trust:{shen:0,lin:0,zhou:0,xu:0},deductions:[],evidence:[],flags:{secured:false,originalLost:false,radioReady:false,copied:false},history:['opening'],ending:null};}
function positions(s){const p={};for(const id of IDS)p[id]='room-'+s.rooms.indexOf(id);if(s.phase==='planning')return p;if(s.slot===1){for(const id of ['shen','xu'])if(s.power.includes('heat'))p[id]='hall';for(const id of ['lin','zhou'])p[id]=s.power.includes('archive')?'archive':'hall';}if(s.slot===2){p.zhou='archive';p.xu=s.power.includes('heat')?'hall':p.xu;if(Math.abs(s.rooms.indexOf('shen')-s.rooms.indexOf('lin'))===1){p.shen=p.lin='corridor';}else{p.shen=s.power.includes('heat')?'hall':p.shen;p.lin=s.power.includes('archive')?'archive':'hall';}}return p;}
function add(s,id){if(!s.evidence.includes(id)){s.evidence.push(id);s.history.push('e:'+id);}}
function has(s,id){return s.evidence.includes(id);}
function signalMeeting(s){const p=positions(s);if(p.shen==='hall'&&p.xu==='hall')s.history.push(has(s,'admission')?(s.trust.xu>0?'hall-aligned':'hall-accountability'):'hallMeet');if(p.lin==='archive'&&p.zhou==='archive')s.history.push(s.flags.secured?'archive-secured':s.trust.lin>0?'archive-watched':'archiveMeet');if(p.lin==='corridor'&&p.shen==='corridor')s.history.push(s.flags.copied?'corridor-backed-up':has(s,'admission')?'corridor-accountability':'corridorMeet');}
function advance(s){s.slot++;if(s.slot<3){signalMeeting(s);return;}if(s.night<3){s.night++;s.slot=0;s.phase='planning';s.history.push('next');}else{s.phase='decision';s.slot=2;if(!s.flags.secured){s.flags.originalLost=true;s.history.push('stolen');}else s.history.push('saved');s.history.push('decision');}}
function proof(s){return s.deductions.includes('evacuation')||s.deductions.includes('timing');}
function requirements(s){return {publish:proof(s)&&s.trust.lin>=1&&s.flags.radioReady&&(s.flags.secured||s.flags.copied),hearing:proof(s)&&s.flags.secured&&s.trust.shen>=1&&s.trust.xu>=1,conceal:true};}
function reduce(state,a){validate(state);const s=JSON.parse(JSON.stringify(state));if(!a||typeof a!=='object'||s.phase==='ended')return s;
 if(a.type==='compare'){
  const q=QUESTIONS[a.hypothesis],ids=a.evidenceIds;
  if(!q||!questionOpen(s,a.hypothesis)||!q.explanations.some(e=>e.id===a.explanationId)){s.history.push('compare-select');return s;}
  if(!Array.isArray(ids)||ids.length!==2||new Set(ids).size!==2||!ids.every(id=>has(s,id))){s.history.push('compare-select-records');return s;}
  if(![q.pair,...(q.alternatives||[])].some(pair=>pair.every(id=>ids.includes(id))))s.history.push('compare-records-'+a.hypothesis);
  else if(a.explanationId!==q.answer)s.history.push('wrong-'+a.explanationId);
  else {if(!s.deductions.includes(a.hypothesis))s.deductions.push(a.hypothesis);s.history.push('deduction-'+a.hypothesis);}
  return s;
 }
 if(s.phase==='planning'){
  if(a.type==='assign'&&IDS.includes(a.guestId)&&Number.isInteger(a.room)&&a.room>=0&&a.room<4){const old=s.rooms.indexOf(a.guestId),other=s.rooms[a.room];s.rooms[a.room]=a.guestId;s.rooms[old]=other;}
  if(a.type==='power'&&POWERS.includes(a.id)){const i=s.power.indexOf(a.id);if(i>=0)s.power.splice(i,1);else if(s.power.length<2)s.power.push(a.id);}
  if(a.type==='begin'){s.phase='night';s.slot=0;s.history.push(s.night===3&&s.flags.secured?'night3-secured':'night'+s.night);if(s.power.includes('radio'))s.flags.radioReady=true;}
  return s;
 }
 if(s.phase==='decision'&&a.type==='finish'&&['publish','hearing','conceal'].includes(a.choice)){const ok=requirements(s)[a.choice];s.ending=a.choice==='conceal'?'concealed':ok?(a.choice==='publish'?'published':'hearing'):'failed';s.phase='ended';return s;}
 if(s.phase!=='night')return s;let used=true;const p=positions(s);
 if(a.type==='talk'&&IDS.includes(a.guestId)){
  const id=a.guestId;if(!p[id].startsWith('room-')&&p[id]!=='hall'){s.history.push('busy');return s;}
  if(id==='shen'){s.history.push(has(s,'admission')?'shen-acknowledged':has(s,'key')?'shen-pending':'shenTalk');add(s,'key');}
  if(id==='xu'){s.history.push(s.trust.xu>0?'xu-cooperating':has(s,'medical')?'xu-pending':'xuTalk');add(s,'medical');}
  if(id==='lin')s.history.push(s.trust.lin>0?'lin-cooperating':'linTalk');
  if(id==='zhou')s.history.push(s.flags.secured?'zhou-blocked':has(s,'order')?'zhou-exposed':'zhouTalk');
 }
 else if(a.type==='confront'&&['shen','xu','lin'].includes(a.guestId)){
  if(!p[a.guestId].startsWith('room-')&&p[a.guestId]!=='hall'){s.history.push('busy');return s;}
  if(!proof(s)){s.history.push('confront-needed');used=false;}
  else {const id=a.guestId,already=s.trust[id]>0;s.trust[id]=Math.min(3,s.trust[id]+1);
   if(id==='shen'){s.history.push(has(s,'admission')?'shen-reconfirm':'shenAgain');add(s,'admission');}
   if(id==='xu')s.history.push(already?'xu-reconfirm':'xu-confirm');
   if(id==='lin'){s.history.push(already?'lin-reconfirm':s.flags.secured?'lin-sealed-copy':'lin-confirm');if(!s.flags.originalLost){s.flags.copied=true;add(s,'copy');}}
  }
 }
 else if(a.type==='inspect'){
  if(a.target==='register'){if(has(s,'booking'))s.history.push(s.trust.xu>0?'review-booking-confirmed':'review-booking-open');add(s,'booking');}else if(a.target==='desk')add(s,'keys');
  else if(a.target==='archive'){if(!s.power.includes('archive'))s.history.push('dark');else if(!has(s,'key'))s.history.push('locked');else {if(has(s,'log'))s.history.push(s.flags.secured?'review-log-secured':'review-log-open');add(s,'log');}}
  else if(a.target==='radio'){if(!s.power.includes('radio'))s.history.push('dark');else add(s,'tape');}
  else if(a.target==='zhou-room'){if(p.zhou==='room-'+s.rooms.indexOf('zhou')){s.trust.zhou=Math.max(-2,s.trust.zhou-1);s.history.push('caught');}else add(s,'order');}
  else used=false;
 }
 else if(a.type==='listen'&&['hall','archive','corridor'].includes(a.target)){
  if(a.target==='hall'&&p.shen==='hall'&&p.xu==='hall'){s.history.push(has(s,'admission')?(s.trust.xu>0?'hall-plan':'hall-after-admission'):'hall-whisper');add(s,'medical');}
  else if(a.target==='archive'&&p.lin==='archive'&&p.zhou==='archive'){if(has(s,'order'))s.history.push(s.flags.secured?'archive-secured':'archive-known-order');add(s,'order');}
  else if(a.target==='corridor'&&p.lin==='corridor'&&p.shen==='corridor'){add(s,'key');s.history.push(s.flags.copied?'corridor-backed-up':has(s,'admission')?'corridor-accountability':'corridor-whisper');if(proof(s)){s.flags.copied=true;add(s,'copy');s.trust.lin=Math.min(3,s.trust.lin+1);}}
  else s.history.push('emptyListen');
 }
 else if(a.type==='secure'){if(has(s,'log')){s.flags.secured=true;s.history.push('secure');}else s.history.push('noLog');}
 else used=false;
 if(used)advance(s);return s;
}
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(o,k));
function validate(s){
 if(!exact(s,['version','night','phase','slot','rooms','power','trust','deductions','evidence','flags','history','ending'])||s.version!==1||!Number.isInteger(s.night)||s.night<1||s.night>3||!['planning','night','decision','ended'].includes(s.phase)||!Number.isInteger(s.slot)||s.slot<0||s.slot>2)throw Error('Invalid hotel state');
 if(!Array.isArray(s.rooms)||s.rooms.length!==4||new Set(s.rooms).size!==4||!s.rooms.every(x=>IDS.includes(x))||!Array.isArray(s.power)||s.power.length>2||new Set(s.power).size!==s.power.length||!s.power.every(x=>POWERS.includes(x)))throw Error('Invalid hotel layout');
 if(!Array.isArray(s.deductions)||new Set(s.deductions).size!==s.deductions.length||!s.deductions.every(id=>['key','evacuation','timing'].includes(id)))throw Error('Invalid deductions');
 if(!exact(s.trust,IDS)||!IDS.every(id=>Number.isInteger(s.trust[id])&&s.trust[id]>=-2&&s.trust[id]<=3)||!Array.isArray(s.evidence)||new Set(s.evidence).size!==s.evidence.length||!s.evidence.every(id=>evidence[id]))throw Error('Invalid hotel records');
 if(!exact(s.flags,['secured','originalLost','radioReady','copied'])||!Object.values(s.flags).every(x=>typeof x==='boolean')||!Array.isArray(s.history)||s.history.length>150||!s.history.every(id=>typeof id==='string'&&(messages[id]||id.startsWith('e:')&&evidence[id.slice(2)])))throw Error('Invalid hotel history');
 if((s.phase==='planning'&&s.slot!==0)||(['decision','ended'].includes(s.phase)&&(s.night!==3||s.slot!==2))||(s.phase==='ended'?!endings[s.ending]:s.ending!==null))throw Error('Invalid hotel ending');
 if(s.flags.secured&&!has(s,'log')||s.flags.copied!==has(s,'copy')||s.flags.copied&&!has(s,'log')||s.flags.originalLost&&!['decision','ended'].includes(s.phase)||s.flags.originalLost&&s.flags.secured)throw Error('Invalid hotel evidence chain');
 if(!s.deductions.every(id=>[QUESTIONS[id].pair,...(QUESTIONS[id].alternatives||[])].some(pair=>pair.every(e=>has(s,e)))))throw Error('Deduction lacks evidence');
 return JSON.parse(JSON.stringify(s));
}
function encode(s){return JSON.stringify({app:'seventh-night-hotel',format:1,state:validate(s)});}
function decode(text){if(typeof text!=='string'||text.length>50000)throw Error('Invalid hotel save');const data=JSON.parse(text);if(!exact(data,['app','format','state'])||data.app!=='seventh-night-hotel'||data.format!==1)throw Error('Invalid hotel save');return validate(data.state);}
function getView(state,lang='zh'){
 const s=validate(state),l=lang==='en'?'en':'zh',t=x=>pick(x,l),p=positions(s),actions=[];
 const locations={hall:bi('暖炉大厅','Hearth hall'),archive:bi('档案室','Archive'),corridor:bi('客房走廊','Bedroom corridor'),register:bi('入住登记簿','Guest register'),desk:bi('前台钥匙架','Reception key rack'),radio:bi('应急电台','Emergency radio'),'zhou-room':bi('周弥的房间','Zhou’s room')};
 const loc=id=>id.startsWith('room-')?(l==='en'?'Room ':'客房 ')+(Number(id.slice(5))+1):t(locations[id]||bi(id,id));
 const addAction=(action,label,description,disabled=false,extra={})=>actions.push({action,label:t(label),description:t(description),disabled,...extra});
 if(s.phase==='planning')addAction({type:'begin'},bi('开始这一夜','Begin this night'),bi('确认分房和电路。今晚有3次行动，开始后不可调整。','Confirm rooms and circuits. You have three actions; arrangements lock for this night.'));
 if(s.phase==='night'){
  for(const id of IDS)addAction({type:'talk',guestId:id},bi('与'+guests[id].name.zh+'交谈','Talk to '+guests[id].name.en),bi('消耗1行动。前往其当前位置单独询问。档案室/走廊的群体交谈需改为聆听；当前在'+loc(p[id])+'。','Costs 1 action. Visit for a private interview. Group conversations in the archive/corridor require listening instead. Currently in '+loc(p[id])+'.'),!p[id].startsWith('room-')&&p[id]!=='hall',{locationName:loc(p[id]),targetLabel:t(guests[id].name)});
  for(const id of ['shen','xu','lin'])addAction({type:'confront',guestId:id},bi('拿记录追问'+guests[id].name.zh,'Present findings to '+guests[id].name.en),bi('消耗1行动。先在证据板用两条记录建立时间矛盾，再请其解释或合作。','Costs 1 action. First establish a timing contradiction on the evidence board, then ask for an explanation or cooperation.'),!proof(s)||(!p[id].startsWith('room-')&&p[id]!=='hall'),{locationName:loc(p[id]),targetLabel:t(guests[id].name)});
  const descriptions={register:bi('消耗1行动。核对预订者、召集信与公开事故摘要。','Costs 1 action. Compare the booking, invitation and public accident summary.'),desk:bi('消耗1行动。核对钥匙用途和借用记录。','Costs 1 action. Check which locks the keys open and who borrowed them.'),archive:bi('消耗1行动。需要档案灯和黄铜钥匙；读取原始操作记录。','Costs 1 action. Requires archive light and brass key; read the original operating record.'),radio:bi('消耗1行动。需要电台供电；核对旧应急录音的时间。','Costs 1 action. Requires radio power; check the old emergency recording.'),'zhou-room':bi('消耗1行动。翻检来访委托；若主人还在，会被制止并失去信任。','Costs 1 action. Search for the visit order. If Zhou is present, he stops you and loses trust.')};
  for(const target of Object.keys(descriptions))addAction({type:'inspect',target},bi('查看'+locations[target].zh,'Inspect '+locations[target].en),descriptions[target],target==='archive'&&(!s.power.includes('archive')||!has(s,'key'))||target==='radio'&&!s.power.includes('radio'),{locationName:loc(target),targetLabel:loc(target)});
  for(const target of ['hall','archive','corridor'])addAction({type:'listen',target},bi('在'+locations[target].zh+'聆听','Listen in the '+locations[target].en),bi('消耗1行动。只有此刻实际相遇的人会留下对话；先查看客人位置。','Costs 1 action. Only people actually meeting here can be overheard. Check their current locations first.'),false,{locationName:loc(target),targetLabel:loc(target)});
  addAction({type:'secure'},bi('封存原日志','Secure the original log'),bi('消耗1行动。保护已找到的原件，防止第三夜被取走。','Costs 1 action. Protect the discovered original from removal on the third night.'),!has(s,'log')||s.flags.secured);
 }
 if(s.phase==='decision'){
  const r=requirements(s),suffix=ok=>l==='en'?(ok?' Ready.':' Requirements NOT met; this will fail.'):(ok?' 条件已满足。':' 条件尚未满足，贸然选择会失败。');
  addAction({type:'finish',choice:'publish'},bi('交给林乔公开报道','Publish with Lin'),bi('需要证据板已确认的撤离/警报矛盾、林乔信任≥1、曾给电台供电、封存原件或照片备份。'+suffix(r.publish),'Requires a confirmed evacuation/siren deduction, Lin trust ≥1, radio powered at least once, and secured original or photo backup.'+suffix(r.publish)));
  addAction({type:'finish',choice:'hearing'},bi('共同申请重开听证','Request a joint hearing'),bi('需要证据板已确认的撤离/警报矛盾、封存原件、沈砚与许岚信任各≥1。不需要电台。'+suffix(r.hearing),'Requires a confirmed evacuation/siren deduction, secured original, and Shen and Xu trust each ≥1. No radio needed.'+suffix(r.hearing)));
  addAction({type:'finish',choice:'conceal'},bi('交回日志，不再公开','Return the log and remain silent'),bi('始终可选。保住表面平静，但放弃这次公开核查和共同听证。','Always available. Preserves surface calm but abandons this opportunity for public review or a joint hearing.'));
 }
 const roomDescriptions=[bi('与二号房相邻。','Adjacent to Room 2.'),bi('与一、三号房相邻。','Adjacent to Rooms 1 and 3.'),bi('与二、四号房相邻。','Adjacent to Rooms 2 and 4.'),bi('与三号房相邻。','Adjacent to Room 3.')];
 const powerText={heat:{label:bi('暖炉大厅','Hall heating'),description:bi('中段把沈砚与许岚聚到大厅，可听到共同回忆。','Brings Shen and Xu together in the middle slot for shared recollections.')},archive:{label:bi('档案灯','Archive light'),description:bi('可读取档案，中段林乔与周弥会来到档案室。','Makes records readable; Lin and Zhou visit the archive in the middle slot.')},radio:{label:bi('应急电台','Emergency radio'),description:bi('可读取旧录音并准备公开发稿；占用一路电。','Enables the old recording and prepares public transmission; uses one circuit.')}};
 return {title:t(bi('第七夜旅馆','The Seventh Night Hotel')),subtitle:t(bi('三夜完整短篇 · 暴雪中的旧案','A complete three-night mystery in a blizzard')),phase:s.phase,night:s.night,slot:s.slot,actionsLeft:s.phase==='night'?3-s.slot:0,phaseLabel:t(s.phase==='planning'?bi('安排今晚','Plan the night'):s.phase==='night'?bi('夜间行动','Night actions'):s.phase==='decision'?bi('天亮的决定','The dawn decision'):bi('故事结束','Story complete')),objective:t(has(s,'log')||has(s,'medical')||has(s,'tape')?bi('你已拿到当年的原始记录。找出它们能支持什么解释，再决定向谁追问。','You have original records from that night. Work out which explanations they support, then decide whom to question.'):bi('谁借过总钥匙？为什么四位客人因同一封信来到这里？从客人的说法与旅馆记录开始。','Who borrowed the master key? Why did the same letter bring all four guests here? Start with their accounts and the hotel records.')),guests:IDS.map(id=>({id,name:t(guests[id].name),role:t(guests[id].role),room:s.rooms.indexOf(id),location:p[id],locationName:loc(p[id]),trust:s.trust[id]})),rooms:s.rooms.map((guestId,index)=>({id:index,index,name:(l==='en'?'Room ':'客房 ')+(index+1),description:t(roomDescriptions[index]),guestId})),power:POWERS.map(id=>({id,label:t(powerText[id].label),description:t(powerText[id].description),on:s.power.includes(id)})),evidence:s.evidence.map(id=>({id,title:t(evidence[id].title),text:t(currentEvidence(s,id))})),history:s.history.map(id=>id.startsWith('e:')?{id,title:t(evidence[id.slice(2)].title),text:t(evidence[id.slice(2)].text)}:{id,title:t(bi('旅馆通讯','Hotel journal')),text:t(messages[id])}),actions,hypotheses:Object.entries(QUESTIONS).filter(([id])=>questionOpen(s,id)).map(([id,q])=>({id,label:t(q.label),description:t(q.description),solved:s.deductions.includes(id),explanations:q.explanations.map(e=>({id:e.id,label:t(e.label),description:t(e.description)}))})),deductions:s.deductions.map(id=>({id,label:t(({key:bi('钥匙指认被排除','Key accusation ruled out'),evacuation:bi('撤离尚未完成','Evacuation was incomplete'),timing:bi('警报晚于开闸','Siren followed gate opening')})[id]),text:t(messages['deduction-'+id])})),requirements:requirements(s),ending:s.ending?{id:s.ending,title:t(endings[s.ending].title),text:s.ending==='concealed'?(s.flags.secured?t(bi('你打开保险柜，将仍由你保管的原日志交给周弥。','You open the safe and hand Zhou the original that remained in your custody.')):t(bi('周弥已经拿走了未封存的原日志。你选择不拦下他，也不公开手头的笔记。','Zhou has already taken the unsecured original. You choose not to stop him or publish the notes in your possession.')))+' '+t(bi('许岚把伤员卡放回包里，退掉了明年的房间。旅馆恢复安静，公开报告仍写着20:50。你放弃了这次核查，而不是证明旧案不存在。','Xu puts away the triage card and cancels next year’s room. The hotel grows quiet, and the public report still says 20:50. You abandoned this opportunity for review; you did not prove there was no case.')):t(endings[s.ending].text)}:null};
}
const apply=(state,action)=>{const next=reduce(state,action);next.history=next.history.slice(-120);return next;};
return Object.freeze({create,reduce:apply,getView,positions,requirements,validate,encode,decode});
});
