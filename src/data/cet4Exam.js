/**
 * 大学英语四级「真题语料」数据
 * ----------------------------------------------------------------------------
 * ⚠️ 真实性声明：本文件的语料来自**公开发布的历年四级真题及官方/主流机构参考答案**
 *   （新东方、新东方在线、可可英语等公开真题解析），包括：
 *     1. 选词填空（15选10）真题原文 + 词库 + 标准答案
 *     2. 段落翻译真题原文 + 参考译文
 *     3. 阅读真题原句（用作「真题例句」）
 *   这些是**真实考题文本**，不是AI生成的仿真题。
 *   参考译文里个别明显笔误（如 broader→broaden）已按原意订正，其余保持原样。
 *
 * 与 src/data/highFreqPhrases.js 的区别：
 *   - 本文件 = 真题原文（真实考题）
 *   - phrases 文件 = 常用搭配整理（教学向，非真题）
 *
 * 用途：
 *   - BANKED_PASSAGES  → 练习模式「选词填空（15选10）」
 *   - TRANSLATION_ITEMS → 练习模式「汉译英句子翻译」
 *   - EXAM_SENTENCES    → 词条卡片「真题例句」
 */

/** 选词填空真题：空格用 §0§ ~ §9§ 标记，answers 按顺序给出正确选项字母 */
export const BANKED_PASSAGES = [
  {
    id: 'ir2026',
    title: '工业革命对工人阶级生活水平的影响',
    source: '2026年6月四级真题（第三套）选词填空',
    text: `One of the biggest controversies over the Industrial Revolution is how it affected the working class. The oldest debates were over whether the standards of living rose or fell. Those that believed they fell claimed that the capitalists §0§ every ounce of surplus they could from the working class. Those that believed the standards of living rose claimed that the environment was consumer-friendly, with more and more goods §1§ to the working class every year.
Today's historians agree that overall, the standards of living §2§. They do not agree, however, on when this improvement §3§.
In an effort to solve this controversy, historians have attempted to define §4§ what "standard of living" means. They all seem to agree that it should mean happiness, but happiness is impossible to measure. Instead, historians §5§ use "real income" as the measure for the standards of living. Real income is money §6§ and then adjusted according to the cost of living. However, it does not take into account unemployment, pollution, health, life expectancy, or free time.
After §7§ debate and analysis of the average income, historians have agreed to disagree on whether there was rapid or slow economic growth during the Industrial Revolution. Instead, they have decided to §8§ how the Industrial Revolution was affected by other events. They have determined that the Industrial Revolution had an overall positive §9§, but it quite possibly was neutralized by negative events such as wars, high taxes, and rapid population growth.`,
    wordBank: [
      { key: 'A', word: 'available', pos: 'adj.', cn: '可获得的，可供使用的' },
      { key: 'B', word: 'deteriorating', pos: 'adj.', cn: '不断恶化的' },
      { key: 'C', word: 'earned', pos: 'v.', cn: '挣得（过去分词）' },
      { key: 'D', word: 'effect', pos: 'n.', cn: '影响，效果' },
      { key: 'E', word: 'enhance', pos: 'v.', cn: '增强，提高' },
      { key: 'F', word: 'exactly', pos: 'adv.', cn: '精确地，确切地' },
      { key: 'G', word: 'exhausting', pos: 'adj.', cn: '冗长的；令人筋疲力尽的' },
      { key: 'H', word: 'experience', pos: 'v./n.', cn: '经历；经验' },
      { key: 'I', word: 'increased', pos: 'v.', cn: '提高，上升（过去式）' },
      { key: 'J', word: 'interpret', pos: 'v.', cn: '解读，阐释' },
      { key: 'K', word: 'occurred', pos: 'v.', cn: '发生（过去式）' },
      { key: 'L', word: 'peculiar', pos: 'adj.', cn: '奇特的' },
      { key: 'M', word: 'probably', pos: 'adv.', cn: '大概，或许' },
      { key: 'N', word: 'squeezed', pos: 'v.', cn: '压榨，榨取（过去式）' },
      { key: 'O', word: 'typically', pos: 'adv.', cn: '通常，一般' }
    ],
    answers: ['N', 'A', 'I', 'K', 'F', 'O', 'C', 'G', 'J', 'D']
  },
  {
    id: 'coffee2026',
    title: '基因如何影响人对咖啡苦味的敏感度',
    source: '2026年6月四级真题（第二套）选词填空',
    text: `It may sound surprising, but people who are super-sensitive to coffee's bitter taste actually drink more of it, a new study finds.
This sensitivity isn't §0§ a matter of taste, either, but rather is influenced by a person's genetic makeup, the researchers said in the study. "You'd expect that people who are particularly sensitive to the bitter taste of caffeine would drink less coffee," said study senior researcher Marilyn Cornelis. "The §1§ results of our study suggest coffee consumers acquire a taste for or an ability to detect the bitterness of caffeine due to the learned positive §2§ brought out by caffeine."
Put another way, people who have a §3§ ability to taste the bitterness of coffee learn to associate "good things with it," Cornelis said. This finding is surprising, given that bitterness often serves as a warning mechanism to §4§ people to spit out harmful substances, scientists said.
Researchers conducted the study to understand how genetics influences people's §5§ of tea, coffee and alcohol which tend to taste bitter, said lead study researcher Jue Sheng Ong. "While all bitter flavors may seem the same, we §6§ the bitterness of Brussels sprouts, quinine and caffeine §7§," Ong told Live Science. "The degree to which we find these flavors bitter is, in part, determined by your genes."
People with the genes to taste the bitterness of green vegetables are more likely to prefer tea to coffee. In §8§, people who were more sensitive to quinine's bitter flavors and those found in green vegetables tended to §9§ coffee.`,
    wordBank: [
      { key: 'A', word: 'addition', pos: 'n.', cn: '增加；此外' },
      { key: 'B', word: 'approximately', pos: 'adv.', cn: '大约' },
      { key: 'C', word: 'avoid', pos: 'v.', cn: '避开，回避' },
      { key: 'D', word: 'consumption', pos: 'n.', cn: '消耗；饮用' },
      { key: 'E', word: 'converted', pos: 'v.', cn: '转换' },
      { key: 'F', word: 'convince', pos: 'v.', cn: '使确信；促使' },
      { key: 'G', word: 'heightened', pos: 'adj.', cn: '增强的，提高的' },
      { key: 'H', word: 'emission', pos: 'n.', cn: '排放' },
      { key: 'I', word: 'opposite', pos: 'adj./n.', cn: '相反（的）' },
      { key: 'J', word: 'perceive', pos: 'v.', cn: '感知，察觉' },
      { key: 'K', word: 'prospect', pos: 'n.', cn: '前景' },
      { key: 'L', word: 'reinforcement', pos: 'n.', cn: '强化，增强效应' },
      { key: 'M', word: 'separately', pos: 'adv.', cn: '分别地' },
      { key: 'N', word: 'simply', pos: 'adv.', cn: '仅仅，只不过' },
      { key: 'O', word: 'targeted', pos: 'adj.', cn: '目标导向的' }
    ],
    answers: ['N', 'I', 'L', 'G', 'F', 'D', 'J', 'M', 'A', 'C']
  },
  {
    id: 'community2015',
    title: '把社区资源带进课堂',
    source: '2015年6月四级真题（第一套）选词填空',
    text: `As a teacher, you could bring the community into your classroom in many ways. The parents and grandparents of your students are resources and §0§ for their children. They can be §1§ teachers of their own traditions and histories. Immigrant parents could talk about their country of §2§ and why they emigrated to the United States. Parents can be invited to talk about their jobs or a community project. Parents, of course, are not the only community resources. Employees at local businesses and staff at community agencies have §3§ information to share in classrooms.
Field trips provide another opportunity to know the community. Many students don't have the opportunity to §4§ concerts or visit museums or historical sites except through field trips. A school district should have §5§ for selecting and conducting field trips. Families must be made §6§ of field trips and give permission for their children to participate.
Through school projects, students can learn to be §7§ in community projects ranging from planting trees to cleaning up a park to assisting elderly people. Students, §8§ older ones, might conduct research on a community need that could lead to action by a city council or state government. Some schools require students to provide community service by §9§ in a nursing home, child care center or government agency. These projects help students understand their responsibility to the larger community.`,
    wordBank: [
      { key: 'A', word: 'assets', pos: 'n.', cn: '资产；宝贵的人或物' },
      { key: 'B', word: 'attend', pos: 'v.', cn: '出席，参加' },
      { key: 'C', word: 'aware', pos: 'adj.', cn: '意识到的' },
      { key: 'D', word: 'especially', pos: 'adv.', cn: '尤其，特别' },
      { key: 'E', word: 'excellent', pos: 'adj.', cn: '优秀的' },
      { key: 'F', word: 'expensive', pos: 'adj.', cn: '昂贵的' },
      { key: 'G', word: 'guidelines', pos: 'n.', cn: '指导方针' },
      { key: 'H', word: 'involved', pos: 'adj.', cn: '参与的' },
      { key: 'I', word: 'joining', pos: 'v.', cn: '加入' },
      { key: 'J', word: 'naturally', pos: 'adv.', cn: '自然地' },
      { key: 'K', word: 'observe', pos: 'v.', cn: '观察' },
      { key: 'L', word: 'origin', pos: 'n.', cn: '起源，祖籍' },
      { key: 'M', word: 'recruited', pos: 'v.', cn: '招募' },
      { key: 'N', word: 'up-to-date', pos: 'adj.', cn: '最新的' },
      { key: 'O', word: 'volunteering', pos: 'v.', cn: '志愿服务' }
    ],
    answers: ['A', 'E', 'L', 'N', 'B', 'G', 'C', 'H', 'D', 'O']
  },
  {
    id: 'tv2015',
    title: '久坐看电视的健康代价',
    source: '2015年6月四级真题（第二套）选词填空',
    text: `It's our guilty pleasure: Watching TV is the most common everyday activity, after work and sleep, in many parts of the world. Americans view five hours of TV each day, and while we know that spending so much time sitting §0§ can lead to obesity and other diseases, researchers have now quantified just how §1§ being a couch potato can be.
In an analysis of data from eight large §2§ published studies, a Harvard-led group reported in the Journal of the American Medical Association that for every two hours per day spent channel §3§, the risk of developing Type 2 diabetes rose 20% over 8.5 years, the risk of heart disease increased 15% over a §4§, and the odds of dying prematurely §5§ 13% during a seven-year follow-up. All of these §6§ are linked to a lack of physical exercise.
But compared with other sedentary activities, like knitting, viewing TV may be especially §7§ at promoting unhealthy habits. For one, the sheer number of hours we pass watching TV dwarfs the time we spend on anything else. And other studies have found that watching ads for beer and popcorn may make you more likely to §8§ them.
Even so, the authors admit that they didn't compare different sedentary activities to §9§ whether TV watching was linked to a greater risk of diabetes, heart disease or early death compared with, say, reading.`,
    wordBank: [
      { key: 'A', word: 'climbed', pos: 'v.', cn: '上升' },
      { key: 'B', word: 'consume', pos: 'v.', cn: '消费，吃喝' },
      { key: 'C', word: 'decade', pos: 'n.', cn: '十年' },
      { key: 'D', word: 'determine', pos: 'v.', cn: '确定' },
      { key: 'E', word: 'effective', pos: 'adj.', cn: '有效的' },
      { key: 'F', word: 'harmful', pos: 'adj.', cn: '有害的' },
      { key: 'G', word: 'outcomes', pos: 'n.', cn: '结果' },
      { key: 'H', word: 'passively', pos: 'adv.', cn: '被动地' },
      { key: 'I', word: 'previously', pos: 'adv.', cn: '先前地' },
      { key: 'J', word: 'resume', pos: 'v.', cn: '恢复' },
      { key: 'K', word: 'suffered', pos: 'v.', cn: '遭受' },
      { key: 'L', word: 'surfing', pos: 'v.', cn: '（频道）切换' },
      { key: 'M', word: 'term', pos: 'n.', cn: '期限' },
      { key: 'N', word: 'terminals', pos: 'n.', cn: '终端' },
      { key: 'O', word: 'twisting', pos: 'v.', cn: '扭曲' }
    ],
    answers: ['H', 'F', 'I', 'L', 'C', 'A', 'G', 'E', 'B', 'D']
  },
  {
    id: 'choice2024',
    title: '选择悖论：选项越多越难选',
    source: '近年四级真题选词填空',
    text: `People tend to want as many choices as possible. They believe this will maximize their §0§ of making the best decision. But research shows that, when it comes to actually making a §1§ from all of these choices, people can become §2§ and avoid making a decision altogether. Even worse, when people finally do decide, they are generally less satisfied with their decision and feel more regretful over whatever choice they made.
Why does this happen? Research shows that when people choose from many options, they §3§ more in the decision, but feel less confident in their ability to decide well. In other words, when we are §4§ with more choices, making the "right" or "correct" decision begins to feel more §5§ and, at the same time, more difficult to do. This may contribute to the deep fear that we will make the wrong decision.
How can we solve this problem? I believe this fear could be tempered by putting decisions into perspective. It might help to remember that many of the choices you make, such as what to have for lunch, will not §6§ much in the future and that, even more important choices, like accepting a new job, can §7§ be changed. It could also help to §8§ these situations with clear guidelines and ideas of what you want from the §9§ of options, which can narrow the possible choices, and also make you more confident about your ability to make the right decision.`,
    wordBank: [
      { key: 'A', word: 'approximately', pos: 'adv.', cn: '大约' },
      { key: 'B', word: 'case', pos: 'n.', cn: '情况，案例' },
      { key: 'C', word: 'chance', pos: 'n.', cn: '机会，可能性' },
      { key: 'D', word: 'confused', pos: 'adj.', cn: '困惑的' },
      { key: 'E', word: 'crucial', pos: 'adj.', cn: '至关重要的' },
      { key: 'F', word: 'deposited', pos: 'v.', cn: '存放，存储' },
      { key: 'G', word: 'enter', pos: 'v.', cn: '进入，介入' },
      { key: 'H', word: 'invest', pos: 'v.', cn: '投入（时间、精力）' },
      { key: 'I', word: 'matter', pos: 'v.', cn: '要紧，有重大影响' },
      { key: 'J', word: 'presented', pos: 'v.', cn: '展示；使面对' },
      { key: 'K', word: 'range', pos: 'n.', cn: '一系列；范围' },
      { key: 'L', word: 'regular', pos: 'adj.', cn: '常规的' },
      { key: 'M', word: 'seize', pos: 'v.', cn: '抓住' },
      { key: 'N', word: 'selection', pos: 'n.', cn: '选择，挑选' },
      { key: 'O', word: 'ultimately', pos: 'adv.', cn: '最终' }
    ],
    answers: ['C', 'N', 'D', 'H', 'J', 'E', 'I', 'O', 'G', 'K']
  },
  {
    id: 'asmr2024',
    title: 'ASMR 音乐与阿尔茨海默症',
    source: '近年四级真题选词填空',
    text: `Some music inspires you to move your feet, some inspires you to get out there and change the world. In any case, it's §0§ to say that music moves people in special ways.
If you're especially into a piece of music, your brain does something called Autonomous Sensory Meridian Response (ASMR), which §1§ to you like a sting in your brain. It turns out that ASMR is pretty special. According to a §2§ published study in The Journal of Prevention of Alzheimer's Disease, the part of your brain responsible for ASMR doesn't get lost to Alzheimer's. Alzheimer's §3§ to put people into layers of confusion, and the study confirms that music can sometimes §4§ lift people out of the Alzheimer's haze and bring them back to (at least a likeness of) normality if only for a short while.
ASMR is powerful stuff! This phenomenon has been §5§ several times but rarely studied properly. One of the most famous examples of this is the story of 92-year-old Henry Dryer, who comes out of dementia while listening to songs from his youth.
Jeff Anderson, associate professor in Radiology at the University of Utah and §6§ author on the study, says "In our society, the diagnoses of dementia are §7§ resources to the maximum. No one says playing music will be a cure for Alzheimer's disease, but it might make the symptoms more §8§, decrease the cost of care and improve a patient's §9§ of life."`,
    wordBank: [
      { key: 'A', word: 'actually', pos: 'adv.', cn: '实际上，竟然' },
      { key: 'B', word: 'consequently', pos: 'adv.', cn: '因此' },
      { key: 'C', word: 'contributing', pos: 'adj.', cn: '参与的；撰稿的' },
      { key: 'D', word: 'fair', pos: 'adj.', cn: '说得过去的，合理的' },
      { key: 'E', word: 'feels', pos: 'v.', cn: '感觉，仿佛' },
      { key: 'F', word: 'manageable', pos: 'adj.', cn: '可控制的，易处理的' },
      { key: 'G', word: 'mends', pos: 'v.', cn: '修复' },
      { key: 'H', word: 'observed', pos: 'v.', cn: '观察到' },
      { key: 'I', word: 'phase', pos: 'n.', cn: '阶段' },
      { key: 'J', word: 'plotting', pos: 'v.', cn: '密谋' },
      { key: 'K', word: 'quality', pos: 'n.', cn: '质量' },
      { key: 'L', word: 'recently', pos: 'adv.', cn: '最近' },
      { key: 'M', word: 'taxing', pos: 'v.', cn: '消耗，压榨' },
      { key: 'N', word: 'tends', pos: 'v.', cn: '倾向于，往往' },
      { key: 'O', word: 'yielded', pos: 'v.', cn: '产生' }
    ],
    answers: ['D', 'E', 'L', 'N', 'A', 'H', 'C', 'M', 'F', 'K']
  }
]

/**
 * 汉译英真题：按句拆分的真题翻译原文 + 参考译文
 * keywords 用于判分（用户译文需覆盖的关键词组，小写）
 */
export const TRANSLATION_ITEMS = [
  {
    id: 't2018a1',
    src: '2018年6月四级真题·翻译（乘飞机出行）',
    cn: '过去，乘飞机出行对大多数中国人来说是难以想象的。',
    en: 'In the past, traveling by plane was unimaginable for most Chinese people.',
    keywords: ['in the past', 'unimaginable', 'travel']
  },
  {
    id: 't2018a2',
    src: '2018年6月四级真题·翻译（乘飞机出行）',
    cn: '如今，随着经济的发展和生活水平的提高，越来越多的中国人包括许多农民和外出务工人员都能乘飞机出行。',
    en: "Today, with the development of China's economy and the improvement of people's living standards, more and more Chinese people, including many farmers and migrant workers, can travel by air.",
    keywords: ['economy', 'living standards', 'migrant workers', 'travel by air']
  },
  {
    id: 't2018a3',
    src: '2018年6月四级真题·翻译（乘飞机出行）',
    cn: '他们可以乘飞机到达所有大城市，还有很多城市也在筹建机场。',
    en: 'They can fly to all major cities, and many other cities are also planning to build airports.',
    keywords: ['major cities', 'airports']
  },
  {
    id: 't2018a4',
    src: '2018年6月四级真题·翻译（乘飞机出行）',
    cn: '航空服务不断改进，而且经常会有廉价机票。',
    en: 'Air services continue to improve and there are often cheap flights.',
    keywords: ['air services', 'cheap flights']
  },
  {
    id: 't2018a5',
    src: '2018年6月四级真题·翻译（乘飞机出行）',
    cn: '近年来，节假日期间选择乘飞机外出旅游的人数在不断增加。',
    en: 'In recent years, the number of people choosing to travel by air during holidays has been increasing.',
    keywords: ['in recent years', 'number of people', 'increasing']
  },
  {
    id: 't2014b1',
    src: '2014年12月四级真题·翻译（第1套·旅游）',
    cn: '越来越多的中国年轻人正对旅游产生兴趣，这是近年来的新趋势。',
    en: 'More and more Chinese young people are getting interested in traveling, which is a new trend recently.',
    keywords: ['more and more', 'young people', 'traveling', 'trend']
  },
  {
    id: 't2014b2',
    src: '2014年12月四级真题·翻译（第1套·旅游）',
    cn: '年轻游客数量的不断增加，可以归因于他们迅速提高的收入和探索外部世界的好奇心。',
    en: 'The increasing number of young travelers can be attributed to the rapid growth of income and the curiosity to explore the outside world.',
    keywords: ['attributed to', 'income', 'curiosity', 'explore']
  },
  {
    id: 't2014b3',
    src: '2014年12月四级真题·翻译（第1套·旅游）',
    cn: '随着旅行增多，年轻人在大城市和著名景点花的时间少了，他们反而更为偏远的地方所吸引。',
    en: 'With more travel, youngsters spend more time in remote areas rather than big cities and famous resorts.',
    keywords: ['remote areas', 'big cities']
  },
  {
    id: 't2014b4',
    src: '2014年12月四级真题·翻译（第1套·旅游）',
    cn: '最近调查显示，很多年轻人想要通过旅行体验不同的文化、丰富知识、拓宽视野。',
    en: 'Recent survey showed that many young people want to experience different cultures, enlarge knowledge, and broaden their horizons through traveling.',
    keywords: ['survey', 'cultures', 'knowledge', 'horizons']
  }
]

/**
 * 真题例句：来自四级真题阅读/选词填空原文的真实句子
 * w = 关联单词（用于挂到词条卡片上）
 */
export const EXAM_SENTENCES = [
  { w: 'controversy', en: 'One of the biggest controversies over the Industrial Revolution is how it affected the working class.', cn: '关于工业革命最大的争议之一，是它如何影响工人阶级。', src: '2026年6月真题·选词填空' },
  { w: 'squeeze', en: 'Those that believed they fell claimed that the capitalists squeezed every ounce of surplus they could from the working class.', cn: '认为生活水平下降的人称，资本家从工人阶级身上榨取了每一分剩余价值。', src: '2026年6月真题·选词填空' },
  { w: 'effect', en: 'They have determined that the Industrial Revolution had an overall positive effect, but it quite possibly was neutralized by negative events.', cn: '他们认定工业革命总体上有积极影响，但很可能被负面事件抵消了。', src: '2026年6月真题·选词填空' },
  { w: 'overall', en: "Today's historians agree that overall, the standards of living increased.", cn: '如今的历史学家一致认为，总体上生活水平提高了。', src: '2026年6月真题·选词填空' },
  { w: 'convince', en: 'This finding is surprising, given that bitterness often serves as a warning mechanism to convince people to spit out harmful substances.', cn: '这一发现令人意外，因为苦味通常是一种预警机制，促使人们吐出有害物质。', src: '2026年6月真题·选词填空' },
  { w: 'harmful', en: 'Bitterness often serves as a warning mechanism to convince people to spit out harmful substances.', cn: '苦味通常作为一种预警机制，促使人们吐出有害物质。', src: '2026年6月真题·选词填空' },
  { w: 'sensitive', en: 'In addition, people who were more sensitive to quinine\'s bitter flavors tended to avoid coffee.', cn: '此外，对奎宁苦味更敏感的人往往不喝咖啡。', src: '2026年6月真题·选词填空' },
  { w: 'determine', en: 'The degree to which we find these flavors bitter is, in part, determined by your genes.', cn: '我们觉得这些味道有多苦，在一定程度上由基因决定。', src: '2026年6月真题·选词填空' },
  { w: 'community', en: 'As a teacher, you could bring the community into your classroom in many ways.', cn: '作为老师，你可以用很多方式把社区带进课堂。', src: '2015年6月真题·选词填空' },
  { w: 'asset', en: 'The parents and grandparents of your students are resources and assets for their children.', cn: '学生的父母和祖父母，是孩子们的资源与财富。', src: '2015年6月真题·选词填空' },
  { w: 'aware', en: 'Families must be made aware of field trips and give permission for their children to participate.', cn: '必须让家长知晓实地考察活动，并允许孩子参加。', src: '2015年6月真题·选词填空' },
  { w: 'permission', en: 'Families must be made aware of field trips and give permission for their children to participate.', cn: '家长须被告知实地考察事宜，并准许孩子参与。', src: '2015年6月真题·选词填空' },
  { w: 'volunteer', en: 'Some schools require students to provide community service by volunteering in a nursing home.', cn: '一些学校要求学生在养老院做志愿服务来完成社区服务。', src: '2015年6月真题·选词填空' },
  { w: 'participate', en: 'Families must give permission for their children to participate.', cn: '家长必须准许孩子参加。', src: '2015年6月真题·选词填空' },
  { w: 'outcome', en: 'All of these outcomes are linked to a lack of physical exercise.', cn: '所有这些结果都与缺乏体育锻炼有关。', src: '2015年6月真题·选词填空' },
  { w: 'physical', en: 'All of these outcomes are linked to a lack of physical exercise.', cn: '这些结果都和缺少身体锻炼相关。', src: '2015年6月真题·选词填空' },
  { w: 'effective', en: 'Viewing TV may be especially effective at promoting unhealthy habits.', cn: '看电视可能在养成不健康习惯方面尤其"有效"。', src: '2015年6月真题·选词填空' },
  { w: 'consume', en: 'Watching ads for beer and popcorn may make you more likely to consume them.', cn: '看啤酒和爆米花的广告，可能让你更想去消费它们。', src: '2015年6月真题·选词填空' },
  { w: 'matter', en: 'Many of the choices you make, such as what to have for lunch, will not matter much in the future.', cn: '你做的许多选择，比如午餐吃什么，将来并不要紧。', src: '近年真题·选词填空' },
  { w: 'range', en: 'It could also help to enter these situations with clear guidelines and ideas of what you want from the range of options.', cn: '带着清晰的准则、明确自己想从这一系列选项中得到什么，也会有帮助。', src: '近年真题·选词填空' },
  { w: 'invest', en: 'When people choose from many options, they invest more in the decision, but feel less confident.', cn: '当人们从众多选项中挑选时，会在决策上投入更多，却更不自信。', src: '近年真题·选词填空' },
  { w: 'phenomenon', en: 'This phenomenon has been observed several times but rarely studied properly.', cn: '这一现象已被观察到多次，却很少得到严谨研究。', src: '近年真题·选词填空' },
  { w: 'observe', en: 'This phenomenon has been observed several times but rarely studied properly.', cn: '该现象被多次观察到，但极少被认真研究。', src: '近年真题·选词填空' },
  { w: 'publish', en: "According to a recently published study in The Journal of Prevention of Alzheimer's Disease, the part of your brain responsible for ASMR doesn't get lost to Alzheimer's.", cn: '根据最近发表在《阿尔茨海默病预防期刊》上的研究，大脑中负责 ASMR 的部分不会因阿尔茨海默病而丧失。', src: '近年真题·选词填空' },
  { w: 'survey', en: 'But in early 2007, June agreed to take part in a survey of 35 Americans from seven states.', cn: '但在2007年初，June 同意参加一项覆盖七个州35名美国人的调查。', src: '2014年12月真题·选词填空' },
  { w: 'necessarily', en: 'The simple presence of these chemicals does not necessarily indicate a health risk.', cn: '这些化学物质的简单存在，并不一定意味着有健康风险。', src: '2014年12月真题·选词填空' },
  { w: 'indicate', en: 'The simple presence of these chemicals does not necessarily indicate a health risk.', cn: '仅仅存在这些化学物质并不必然表示有健康风险。', src: '2014年12月真题·选词填空' },
  { w: 'conduct', en: 'A large, ongoing study conducted by the Centers for Disease Control and Prevention has found 148 chemicals in Americans of all ages.', cn: '美国疾控中心正在进行的一项大型研究发现，各年龄段美国人身上有148种化学物质。', src: '2014年12月真题·选词填空' },
  { w: 'facility', en: 'Great Barrier Island has no public facilities, and the 950 people living there rely on solar and wind energy.', cn: '大堡礁岛没有公共设施，住在那里的950人依赖太阳能和风能。', src: '2026年6月真题·长篇阅读' },
  { w: 'remote', en: 'They found there was more light pollution on the northern side coming from Fiji than Auckland to the south.', cn: '他们发现北侧来自斐济的光污染比南边的奥克兰更多。', src: '2026年6月真题·长篇阅读' }
]
