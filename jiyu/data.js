/* 技遇 · 技能互换平台
 * 演示数据。所有人名、评价与交换记录均为虚构，仅用于产品展示。
 */
(function (root) {
  const categories = [
    { id: 'all', label: '全部', color: '#1F1B14', tint: '#EDE6D8' },
    { id: 'image', label: '影像', color: '#C24F2C', tint: '#F2DED3' },
    { id: 'music', label: '音乐', color: '#304D86', tint: '#DEE4F0' },
    { id: 'code', label: '编程', color: '#4D6546', tint: '#E2E8D9' },
    { id: 'lang', label: '语言', color: '#9B4B60', tint: '#F0DCE1' },
    { id: 'craft', label: '手作', color: '#8D642C', tint: '#F1E4CA' },
    { id: 'body', label: '身心', color: '#65558C', tint: '#E8E1F0' },
    { id: 'express', label: '表达', color: '#786021', tint: '#EFE4C6' }
  ];

  const skills = [
    { id: 'portrait-photo', label: '人像摄影', category: 'image' },
    { id: 'phone-photo', label: '手机摄影', category: 'image' },
    { id: 'retouch', label: '修图调色', category: 'image' },
    { id: 'video-edit', label: '视频剪辑', category: 'image' },
    { id: 'motion', label: '动效设计', category: 'image' },

    { id: 'fingerstyle', label: '指弹吉他', category: 'music' },
    { id: 'ukulele', label: '尤克里里', category: 'music' },
    { id: 'vocal', label: '流行演唱', category: 'music' },
    { id: 'theory', label: '基础乐理', category: 'music' },
    { id: 'drums', label: '打鼓', category: 'music' },

    { id: 'python', label: 'Python 入门', category: 'code' },
    { id: 'data', label: '数据分析', category: 'code' },
    { id: 'frontend', label: '前端开发', category: 'code' },
    { id: 'ai', label: 'AI 工作流', category: 'code' },

    { id: 'spanish', label: '西班牙语', category: 'lang' },
    { id: 'english', label: '英语口语', category: 'lang' },
    { id: 'japanese', label: '日语', category: 'lang' },
    { id: 'french', label: '法语', category: 'lang' },

    { id: 'latte', label: '咖啡拉花', category: 'craft' },
    { id: 'baking', label: '烘焙', category: 'craft' },
    { id: 'pottery', label: '陶艺', category: 'craft' },
    { id: 'flower', label: '花艺', category: 'craft' },
    { id: 'illustration', label: '手绘插画', category: 'craft' },

    { id: 'yoga', label: '瑜伽', category: 'body' },
    { id: 'pilates', label: '普拉提', category: 'body' },
    { id: 'meditation', label: '冥想', category: 'body' },

    { id: 'layout', label: '版式设计', category: 'express' },
    { id: 'speech', label: '演讲表达', category: 'express' },
    { id: 'writing', label: '写作', category: 'express' },
    { id: 'xiaohongshu', label: '小红书运营', category: 'express' }
  ];

  const slots = ['工作日晚', '周末下午', '周末晚', '时间灵活'];
  const formats = ['线上', '线下'];
  const cities = ['杭州', '上海', '北京', '成都', '深圳', '广州', '苏州'];

  function teach(skill, outcome) {
    return { skill: skill, outcome: outcome };
  }

  const me = {
    id: 'me',
    name: '林小满',
    role: '品牌设计师 / 独立摄影师',
    city: '杭州',
    initials: '满',
    avatarColor: '#1F3A6E',
    avatarBg: '#DDE3F0',
    bio: '白天做品牌，晚上拍照。正在把「想学清单」一件件划掉。',
    teaches: [
      teach('portrait-photo', '独立完成一组自然光人像'),
      teach('retouch', '建立一套自己的调色流程'),
      teach('layout', '完成一张能发布的海报')
    ],
    wants: [
      { skill: 'fingerstyle', note: '想完整弹唱一首喜欢的歌' },
      { skill: 'video-edit', note: '把旅行素材剪成 3 分钟短片' },
      { skill: 'spanish', note: '旅行时能应付点单和问路' },
      { skill: 'python', note: '做一个自动整理照片的小工具' }
    ],
    formats: ['线上', '线下'],
    slots: ['工作日晚', '周末下午'],
    coins: 6,
    rating: 4.9,
    swaps: 4,
    joined: '2026.03',
    response: '通常 1 小时内回复',
    verified: ['实名认证', '摄影作品认证', '守约印章'],
    receivedReviews: [
      {
        by: '老鹿',
        role: '咖啡师',
        stars: 5,
        text: '小满教东西很细，先让你看懂光，再让你自己拍。两次课之后，我的咖啡照片终于不再像外卖图鉴。'
      },
      {
        by: '南乔',
        role: '视频编导',
        stars: 5,
        text: '从字体到网格，她把版式讲得像搭积木，还陪我把提案排到了能发给客户的版本。'
      },
      {
        by: '周青',
        role: '插画师',
        stars: 5,
        text: '她拍人像时不急着按快门，先和你聊天。成片很像我，不像模板。'
      }
    ]
  };

  const peers = [
    {
      id: 'azhe',
      name: '阿哲',
      role: '独立音乐人 / 吉他手',
      city: '杭州',
      initials: '哲',
      avatarColor: '#8A2F16',
      avatarBg: '#F1D9CA',
      bio: '写歌，也教人把喜欢的歌弹下来。比起炫技，我更在意你能不能弹出自己的情绪。',
      teaches: [
        teach('fingerstyle', '完整弹唱 3 首指弹编配'),
        teach('theory', '看懂常见和弦进行，自己移调')
      ],
      wants: ['portrait-photo', 'retouch'],
      goal: '想拍一组能放进新专辑内页的胶片人像。',
      formats: ['线上', '线下'],
      slots: ['工作日晚', '周末下午'],
      rating: 4.9,
      swaps: 18,
      verified: ['实名认证', '作品认证', '守约印章'],
      response: '通常 1 小时内回复',
      active: '今天活跃',
      lastActive: 1,
      reviews: [
        { by: '南乔', stars: 5, text: '他把我最怕的乐理拆成了三句话，居然真的听懂了。' },
        { by: '小野', stars: 5, text: '不催进度，但每次都让你多会一点。吉他课像一起完成一件小作品。' }
      ]
    },
    {
      id: 'nqiao',
      name: '南乔',
      role: '品牌视频编导',
      city: '上海',
      initials: '乔',
      avatarColor: '#213C72',
      avatarBg: '#D9E2F1',
      bio: '把复杂的事剪成 90 秒。喜欢和没有基础的人一起，从第一条时间线开始。',
      teaches: [
        teach('video-edit', '从素材整理到完成一支 3 分钟短片'),
        teach('motion', '做一组可用的动态标题')
      ],
      wants: ['layout', 'xiaohongshu'],
      goal: '想给工作室做一套更有辨识度的视觉封面。',
      formats: ['线上'],
      slots: ['工作日晚', '周末下午'],
      rating: 4.8,
      swaps: 12,
      verified: ['实名认证', '作品认证'],
      response: '通常 3 小时内回复',
      active: '今天活跃',
      lastActive: 3,
      reviews: [
        { by: '阿哲', stars: 5, text: '从素材整理到第一版粗剪，她只让我做一件事：先决定这支片子想让人记住什么。' },
        { by: '可可', stars: 4, text: '讲得清楚，也有耐心。改我的片子像改自己的。' }
      ]
    },
    {
      id: 'aye',
      name: '阿野',
      role: '西语译者 / 老师',
      city: '成都',
      initials: '野',
      avatarColor: '#3F5436',
      avatarBg: '#DFE7D7',
      bio: '在拉美住过六年，教西语的方式是先把嘴张开。摄影是最近认真想学的第二语言。',
      teaches: [
        teach('spanish', '完成 5 分钟的旅行西语对话'),
        teach('english', '从「能听懂」练到「敢开口」')
      ],
      wants: ['phone-photo', 'retouch'],
      goal: '想用手机拍出有故事的旅行照片。',
      formats: ['线上'],
      slots: ['工作日晚', '周末晚'],
      rating: 5,
      swaps: 9,
      verified: ['实名认证', '语言证书'],
      response: '通常 2 小时内回复',
      active: '2 小时前活跃',
      lastActive: 2,
      reviews: [
        { by: '程睿', stars: 5, text: '第一节课就开口说了十分钟西语，她真的有办法让你不怕丢脸。' },
        { by: '老鹿', stars: 5, text: '会按你的旅行场景教，不是照本宣科。' }
      ]
    },
    {
      id: 'cheng',
      name: '程睿',
      role: '产品设计师',
      city: '深圳',
      initials: '睿',
      avatarColor: '#6D4A1F',
      avatarBg: '#F2E2C8',
      bio: '白天画界面，晚上写代码。喜欢把抽象的想法做成能点开的东西。',
      teaches: [
        teach('python', '做出一个能自动整理文件的小工具'),
        teach('ai', '用 AI 工作流完成一个真实小项目')
      ],
      wants: ['layout', 'speech'],
      goal: '想学会把方案讲得让非设计师也听得懂。',
      formats: ['线上'],
      slots: ['工作日晚', '周末下午'],
      rating: 4.7,
      swaps: 8,
      verified: ['实名认证', '作品认证'],
      response: '通常 5 小时内回复',
      active: '昨天活跃',
      lastActive: 20,
      reviews: [
        { by: '阿野', stars: 5, text: '他会先问你到底想做什么，再把 Python 讲到够用为止。' },
        { by: '南乔', stars: 4, text: '帮我搭了一个自动整理素材的小脚本，省了一晚上的时间。' }
      ]
    },
    {
      id: 'jiang',
      name: '姜姜',
      role: '自由插画师',
      city: '杭州',
      initials: '姜',
      avatarColor: '#7C3249',
      avatarBg: '#F2DCE2',
      bio: '画植物和城市角落。最近想把画印成布，正在认真学怎么排得更好看。',
      teaches: [
        teach('illustration', '完成一张自己的小插画并印成明信片'),
        teach('flower', '做一束适合带回家的季节花')
      ],
      wants: ['layout', 'phone-photo'],
      goal: '想给自己的插画做一套能卖出去的包装和卡片。',
      formats: ['线上', '线下'],
      slots: ['工作日晚', '周末下午'],
      rating: 4.9,
      swaps: 15,
      verified: ['实名认证', '作品认证', '守约印章'],
      response: '通常 2 小时内回复',
      active: '今天活跃',
      lastActive: 4,
      reviews: [
        { by: '珂珂', stars: 5, text: '她会一直陪到你的手敢下笔。画完不像她的，像你的。' },
        { by: '阿野', stars: 5, text: '花艺课很有耐心，配色审美在线。' }
      ]
    },
    {
      id: 'laolu',
      name: '老鹿',
      role: '咖啡师 / 小店店主',
      city: '杭州',
      initials: '鹿',
      avatarColor: '#5A4730',
      avatarBg: '#E9E1D2',
      bio: '在社区开了一间小咖啡店，教过很多人拉出第一片叶子。不着急，奶泡会等你。',
      teaches: [
        teach('latte', '拉出一片稳定的叶子'),
        teach('baking', '独立完成一盘可颂')
      ],
      wants: ['retouch', 'phone-photo'],
      goal: '想把店里的咖啡和甜点拍得更有食欲一点。',
      formats: ['线下'],
      slots: ['周末下午', '工作日晚'],
      rating: 4.9,
      swaps: 24,
      verified: ['实名认证', '门店认证'],
      response: '通常 4 小时内回复',
      active: '今天活跃',
      lastActive: 2,
      reviews: [
        { by: '阿野', stars: 5, text: '两次课拉出第一片叶子。他教你看奶泡状态，不是背步骤。' },
        { by: '阿哲', stars: 5, text: '在老鹿店里上课像在朋友家，放松，但很认真。' }
      ]
    },
    {
      id: 'chengzi',
      name: '橙子',
      role: '中学西语老师',
      city: '北京',
      initials: '橙',
      avatarColor: '#73561A',
      avatarBg: '#F6E6BE',
      bio: '把西语教成一件轻松的事。最近沉迷咖啡，想认真学拉花，已经买好练习豆了。',
      teaches: [
        teach('spanish', '掌握旅行和点单场景的实用西语'),
        teach('english', '开口完成一次 3 分钟英语自我介绍')
      ],
      wants: ['latte', 'baking'],
      goal: '想给朋友做一杯有叶子的拿铁。',
      formats: ['线上'],
      slots: ['工作日晚', '周末晚'],
      rating: 4.8,
      swaps: 6,
      verified: ['实名认证', '教师认证'],
      response: '通常 1 小时内回复',
      active: '今天活跃',
      lastActive: 1,
      reviews: [
        { by: '珂珂', stars: 5, text: '橙子老师会一直鼓励你开口，课堂气氛非常轻。' },
        { by: '程睿', stars: 4, text: '用一部电影学西语，比背单词有用。' }
      ]
    },
    {
      id: 'keke',
      name: '珂珂',
      role: '英语老师 / 口语教练',
      city: '杭州',
      initials: '珂',
      avatarColor: '#303C68',
      avatarBg: '#E0E2EE',
      bio: '不背单词，先把话聊起来。业余在学人像摄影，想拍出朋友真正喜欢的样子。',
      teaches: [
        teach('english', '能开口完成一次英文会议发言'),
        teach('speech', '把一次分享的结构讲清楚')
      ],
      wants: ['portrait-photo', 'retouch'],
      goal: '想学会用自然光拍朋友，而不是只拍风景。',
      formats: ['线上', '线下'],
      slots: ['工作日晚', '周末下午'],
      rating: 4.9,
      swaps: 11,
      verified: ['实名认证', '教师认证', '守约印章'],
      response: '通常 2 小时内回复',
      active: '今天活跃',
      lastActive: 5,
      reviews: [
        { by: '姜姜', stars: 5, text: '终于敢在会议上开口说英语了，珂珂的课特别实用。' },
        { by: '阿野', stars: 4, text: '纠音很细，但不会让人尴尬。' }
      ]
    }
  ];

  const exchanges = [
    {
      id: 'ex-zhe',
      peerId: 'azhe',
      status: 'active',
      mode: 'swap',
      mySkill: 'portrait-photo',
      theirSkill: 'fingerstyle',
      myGoal: '能独立完成一组窗光人像，并完成基础调色。',
      theirGoal: '完整弹唱《晴天》的指弹版本。',
      sessionsTotal: 4,
      sessionMinutes: 90,
      format: '线上',
      window: '10.10 - 11.14',
      place: '腾讯会议',
      createdAt: '2026-10-06',
      sessions: [
        { label: '第 1 节', topics: '光线与构图 / 和弦起手式', date: '10.11 周六 · 19:00', done: true },
        { label: '第 2 节', topics: '窗光人像与基础调色 / 分解和弦', date: '10.18 周六 · 19:00', done: true },
        { label: '第 3 节', topics: '夜景人像实拍 / 《晴天》主歌', date: '10.31 周六 · 19:00', done: false },
        { label: '第 4 节', topics: '作品复盘与互评 / 完整弹唱录制', date: '11.07 周六 · 19:00', done: false }
      ],
      messages: [
        { from: 'them', text: '上周的作业我练完了，C 和弦换 F 还是有点卡。', at: '10.19 20:14' },
        { from: 'me', text: '正常，先别追速度。周六我们只练一件事：让换和弦的手不抬太高。', at: '10.19 20:26' },
        { from: 'them', text: '好。对了，你上次说的窗光人像，我找了家里两个位置，周六拍给你看。', at: '10.19 20:31' },
        { from: 'system', text: '下一次交换：10 月 31 日（周六）19:00 · 线上', at: '' }
      ],
      reviewByMe: null
    },
    {
      id: 'ex-ye',
      peerId: 'aye',
      status: 'incoming',
      mode: 'swap',
      mySkill: 'portrait-photo',
      theirSkill: 'spanish',
      myGoal: '旅行时能应付点单、问路和十分钟自我介绍。',
      theirGoal: '拍出一组有氛围的咖啡馆人像，并学会基础调色。',
      sessionsTotal: 4,
      sessionMinutes: 90,
      format: '线上',
      window: '10.27 - 11.30',
      place: '线上会议',
      createdAt: '2026-10-24',
      sessions: [
        { label: '第 1 节', topics: '自然光基础 / 发音与自我介绍', date: '接受后约定', done: false },
        { label: '第 2 节', topics: '构图三件事 / 点单与问路', date: '接受后约定', done: false },
        { label: '第 3 节', topics: 'Lightroom 调色 / 十个旅行场景', date: '接受后约定', done: false },
        { label: '第 4 节', topics: '作品复盘 / 五分钟西语小考', date: '接受后约定', done: false }
      ],
      messages: [
        { from: 'them', text: '看到你拍的那组咖啡馆人像，正是我想学的风格。我可以用西语课和你换，4 次，每次 1.5 小时。', at: '10.24 21:18' },
        { from: 'system', text: '阿野发来一份交换提案，等你回应', at: '' }
      ],
      reviewByMe: null
    },
    {
      id: 'ex-qiao',
      peerId: 'nqiao',
      status: 'pending',
      mode: 'swap',
      mySkill: 'layout',
      theirSkill: 'video-edit',
      myGoal: '把旅行素材剪成一支 3 分钟短片。',
      theirGoal: '完成一套能用在工作室主页的版式。',
      sessionsTotal: 3,
      sessionMinutes: 90,
      format: '线上',
      window: '11 月起 · 时间灵活',
      place: '线上会议',
      createdAt: '2026-10-24',
      sessions: [
        { label: '第 1 节', topics: '素材整理与故事线 / 版式基础', date: '待对方确认', done: false },
        { label: '第 2 节', topics: '粗剪与节奏 / 网格与字体', date: '待对方确认', done: false },
        { label: '第 3 节', topics: '成片复盘 / 封面定稿', date: '待对方确认', done: false }
      ],
      messages: [
        { from: 'me', text: '看到你的旅行短片，剪辑节奏很喜欢。我用版式设计和你换视频剪辑，可以吗？', at: '10.24 22:06' },
        { from: 'system', text: '提案已送达，等待南乔回应', at: '' }
      ],
      reviewByMe: null
    },
    {
      id: 'ex-lu',
      peerId: 'laolu',
      status: 'review',
      mode: 'swap',
      mySkill: 'retouch',
      theirSkill: 'latte',
      myGoal: '拉出一片稳定的叶子。',
      theirGoal: '建立一套自己的照片调色流程。',
      sessionsTotal: 4,
      sessionMinutes: 60,
      format: '线下 · 老鹿咖啡',
      window: '9.20 - 10.12',
      place: '老鹿咖啡（拱墅区）',
      createdAt: '2026-09-18',
      completedAt: '2026-10-12',
      sessions: [
        { label: '第 1 节', topics: '光比与基础调色 / 奶泡状态', date: '09.21 周一 · 19:00', done: true },
        { label: '第 2 节', topics: '食物照片调色 / 融合练习', date: '09.28 周一 · 19:00', done: true },
        { label: '第 3 节', topics: '成片复盘 / 拉叶子', date: '10.05 周一 · 19:00', done: true },
        { label: '第 4 节', topics: '作品集整理 / 独立出品', date: '10.12 周一 · 19:00', done: true }
      ],
      messages: [
        { from: 'them', text: '第一次拉花能出叶子，多谢你教我看对比度哈哈。', at: '10.12 20:02' },
        { from: 'me', text: '下次记得奶泡别打太厚。你的叶子比我第一次好多了。', at: '10.12 20:10' },
        { from: 'system', text: '交换已完成 · 2026.10.12', at: '' }
      ],
      reviewByMe: null
    }
  ];

  const stories = [
    {
      quote: '我本来只想学个修图，结果顺手把店里的菜单和照片墙都重做了一遍。',
      name: '老鹿',
      meta: '咖啡师 · 用拉花换修图',
      tone: 'peach'
    },
    {
      quote: '签约之后最有用的一句是：先决定这支片子想让人记住什么。',
      name: '南乔',
      meta: '视频编导 · 用剪辑换版式',
      tone: 'blue'
    },
    {
      quote: '第一次觉得「教别人」不是消耗，是把自己会的东西重新想明白一遍。',
      name: '阿野',
      meta: '西语译者 · 用西语换摄影',
      tone: 'sage'
    }
  ];

  root.SWAP_DATA = {
    categories: categories,
    skills: skills,
    slots: slots,
    formats: formats,
    cities: cities,
    me: me,
    peers: peers,
    exchanges: exchanges,
    stories: stories,
    storageKey: 'jiyu-skillswap-demo-v1'
  };
})(globalThis);
