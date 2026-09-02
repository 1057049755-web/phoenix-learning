/* ================= 凤凰花·智学 网页原型 · 模拟数据 ================= */
const MATH_BOOKS = {"1":{"上":["第一单元 准备课","第二单元 位置","第三单元 1~5的认识和加减法","第四单元 认识图形（一）","第五单元 6~10的认识和加减法","第六单元 11~20各数的认识","第七单元 认识钟表","第八单元 20以内的进位加法"],"下":["第一单元 认识图形（二）","第二单元 20以内的退位减法","第三单元 分类与整理","第四单元 100以内数的认识","第五单元 认识人民币","第六单元 100以内的加法和减法（一）","第七单元 找规律"]},"2":{"上":["第一单元 长度单位","第二单元 100以内的加法和减法（二）","第三单元 角的初步认识","第四单元 表内乘法（一）","第五单元 观察物体（一）","第六单元 表内乘法（二）"],"下":["第一单元 数据收集整理","第二单元 表内除法（一）","第三单元 图形的运动（一）","第四单元 表内除法（二）","第五单元 混合运算","第六单元 有余数的除法","第七单元 万以内数的认识","第八单元 克和千克"]},"3":{"上":["第一单元 时、分、秒","第二单元 万以内的加法和减法（一）","第三单元 测量","第四单元 万以内的加法和减法（二）","第五单元 倍的认识","第六单元 多位数乘一位数","第七单元 长方形和正方形","第八单元 分数的初步认识"],"下":["第一单元 位置与方向（一）","第二单元 除数是一位数的除法","第三单元 复式统计表","第四单元 两位数乘两位数","第五单元 面积","第六单元 年、月、日","第七单元 小数的初步认识"]},"4":{"上":["第一单元 大数的认识","第二单元 公顷和平方千米","第三单元 角的度量","第四单元 三位数乘两位数","第五单元 平行四边形和梯形","第六单元 除数是两位数的除法","第七单元 条形统计图","第八单元 数学广角——优化"],"下":["第一单元 四则运算","第二单元 观察物体（二）","第三单元 运算定律","第四单元 小数的意义和性质","第五单元 三角形","第六单元 小数的加法和减法","第七单元 图形的运动（二）","第八单元 平均数与条形统计图"]},"5":{"上":["第一单元 小数乘法","第二单元 位置","第三单元 小数除法","第四单元 可能性","第五单元 简易方程","第六单元 多边形的面积","第七单元 数学广角——植树问题"],"下":["第一单元 观察物体（三）","第二单元 因数与倍数","第三单元 长方体和正方体","第四单元 分数的意义和性质","第五单元 图形的运动（三）","第六单元 分数的加法和减法","第七单元 折线统计图","第八单元 数学广角——找次品"]},"6":{"上":["第一单元 分数乘法","第二单元 位置与方向（二）","第三单元 分数除法","第四单元 比","第五单元 圆","第六单元 百分数（一）","第七单元 扇形统计图","第八单元 数学广角——数与形"],"下":["第一单元 负数","第二单元 百分数（二）","第三单元 圆柱与圆锥","第四单元 比例","第五单元 数学广角——鸽巢问题"]},"7":{"上":["第一章 有理数","第二章 整式的加减","第三章 一元一次方程","第四章 几何图形初步"],"下":["第五章 相交线与平行线","第六章 实数","第七章 平面直角坐标系","第八章 二元一次方程组","第九章 不等式与不等式组","第十章 数据的收集、整理与描述"]},"8":{"上":["第十一章 三角形","第十二章 全等三角形","第十三章 轴对称","第十四章 整式的乘法与因式分解","第十五章 分式"],"下":["第十六章 二次根式","第十七章 勾股定理","第十八章 平行四边形","第十九章 一次函数","第二十章 数据的分析"]},"9":{"上":["第二十一章 一元二次方程","第二十二章 二次函数","第二十三章 旋转","第二十四章 圆","第二十五章 概率初步"],"下":["第二十六章 反比例函数","第二十七章 相似","第二十八章 锐角三角函数","第二十九章 投影与视图"]}};
const CHINESE_BOOKS = {"1":{"上":["第一单元 识字与拼音","第二单元 课文（一）","第三单元 课文（二）","第四单元 识字与写字（二）","第五单元 课文（三）"],"下":["第一单元 识字","第二单元 课文（一）","第三单元 课文（二）","第四单元 课文（三）","第五单元 识字（二）","第六单元 课文（四）"]},"2":{"上":["第一单元 课文（一）","第二单元 识字","第三单元 课文（二）","第四单元 课文（三）","第五单元 课文（四）","第六单元 课文（五）"],"下":["第一单元 课文（一）","第二单元 课文（二）","第三单元 识字","第四单元 课文（三）","第五单元 课文（四）","第六单元 课文（五）"]},"3":{"上":["第一单元 学校生活","第二单元 金秋时节","第三单元 童话世界","第四单元 阅读策略","第五单元 观察发现","第六单元 祖国山河"],"下":["第一单元 可爱的生灵","第二单元 寓言故事","第三单元 中华优秀传统文化","第四单元 观察与发现","第五单元 想象","第六单元 多彩童年"]},"4":{"上":["第一单元 自然之美","第二单元 提问策略","第三单元 观察","第四单元 神话故事","第五单元 把事情写清楚","第六单元 成长故事"],"下":["第一单元 田园生活","第二单元 科技之光","第三单元 现代诗歌","第四单元 动物朋友","第五单元 习作单元","第六单元 成长"]},"5":{"上":["第一单元 万物有灵","第二单元 阅读速度","第三单元 民间故事","第四单元 家国情怀","第五单元 说明文","第六单元 舐犊情深"],"下":["第一单元 童年往事","第二单元 古典名著","第三单元 综合性学习","第四单元 家国情怀","第五单元 习作单元","第六单元 思维火花"]},"6":{"上":["第一单元 触摸自然","第二单元 革命岁月","第三单元 阅读策略","第四单元 小说","第五单元 习作单元","第六单元 保护环境"],"下":["第一单元 民风民俗","第二单元 外国文学","第三单元 习作单元","第四单元 理想与信念","第五单元 科学精神","第六单元 综合性学习"]},"7":{"上":["第一单元 四季美景","第二单元 至爱亲情","第三单元 学习生活","第四单元 人生之舟","第五单元 动物与人","第六单元 想象之翼"],"下":["第一单元 群星闪耀","第二单元 家国情怀","第三单元 凡人小事","第四单元 修身正己","第五单元 生活哲理","第六单元 科幻探险"]},"8":{"上":["第一单元 新闻","第二单元 回忆性散文","第三单元 山水诗文","第四单元 散文","第五单元 说明文","第六单元 品格志趣"],"下":["第一单元 民俗","第二单元 事理说明文","第三单元 古诗文","第四单元 演讲","第五单元 游记","第六单元 哲思"]},"9":{"上":["第一单元 现代诗","第二单元 议论文","第三单元 古典诗文","第四单元 小说","第五单元 议论文（二）","第六单元 古典小说"],"下":["第一单元 诗歌","第二单元 小说（二）","第三单元 古诗文（二）","第四单元 剧本","第五单元 文言文（二）","第六单元 古诗文（三）"]}};
const ENGLISH_BOOKS = {"1":{"上":["Unit 1 Greetings","Unit 2 Body","Unit 3 Colours","Unit 4 Numbers"],"下":["Unit 1 Animals","Unit 2 Family","Unit 3 Food","Unit 4 Weather"]},"2":{"上":["Unit 1 School","Unit 2 Toys","Unit 3 Seasons","Unit 4 Time"],"下":["Unit 1 My Day","Unit 2 Shopping","Unit 3 My Friends","Unit 4 Sports"]},"3":{"上":["Unit 1 Hello!","Unit 2 Colours","Unit 3 Look at me!","Unit 4 We love animals","Unit 5 Let's eat!","Unit 6 Happy birthday!"],"下":["Unit 1 Welcome back to school!","Unit 2 My family","Unit 3 At the zoo","Unit 4 Where is my car?","Unit 5 Do you like pears?","Unit 6 How many?"]},"4":{"上":["Unit 1 My classroom","Unit 2 My schoolbag","Unit 3 My friends","Unit 4 My home","Unit 5 Dinner's ready","Unit 6 Meet my family!"],"下":["Unit 1 My school","Unit 2 What time is it?","Unit 3 Weather","Unit 4 At the farm","Unit 5 My clothes","Unit 6 Shopping"]},"5":{"上":["Unit 1 What's he like?","Unit 2 My week","Unit 3 What would you like?","Unit 4 What can you do?","Unit 5 There is a big bed","Unit 6 In a nature park"],"下":["Unit 1 My day","Unit 2 My favourite season","Unit 3 My school calendar","Unit 4 When is the art show?","Unit 5 Whose dog is it?","Unit 6 Work quietly!"]},"6":{"上":["Unit 1 How can I get there?","Unit 2 Ways to go to school","Unit 3 My weekend plan","Unit 4 I have a pen pal","Unit 5 What does he do?","Unit 6 How do you feel?"],"下":["Unit 1 How tall are you?","Unit 2 Last weekend","Unit 3 Where did you go?","Unit 4 Then and now"]},"7":{"上":["Starter Unit 1 Good morning!","Starter Unit 2 What's this in English?","Starter Unit 3 What color is it?","Unit 1 My name's Gina.","Unit 2 This is my sister.","Unit 3 Is this your pencil?","Unit 4 Where's my schoolbag?","Unit 5 Do you have a soccer ball?","Unit 6 Do you like bananas?","Unit 7 How much are these socks?","Unit 8 When is your birthday?","Unit 9 My favorite subject is science."],"下":["Unit 1 Can you play the guitar?","Unit 2 What time do you go to school?","Unit 3 How do you get to school?","Unit 4 Don't eat in class.","Unit 5 Why do you like pandas?","Unit 6 I'm watching TV.","Unit 7 It's raining!","Unit 8 Is there a post office near here?","Unit 9 What does he look like?","Unit 10 I'd like some noodles.","Unit 11 How was your school trip?","Unit 12 What did you do last weekend?"]},"8":{"上":["Unit 1 Where did you go on vacation?","Unit 2 How often do you exercise?","Unit 3 I'm more outgoing than my sister.","Unit 4 What's the best movie theater?","Unit 5 Do you want to watch a game show?","Unit 6 I'm going to study computer science.","Unit 7 Will people have robots?","Unit 8 How do you make a banana milk shake?","Unit 9 Can you come to my party?","Unit 10 If you go to the party, you'll have a great time!"],"下":["Unit 1 What's the matter?","Unit 2 I'll help to clean up the city parks.","Unit 3 Could you please clean your room?","Unit 4 Why don't you talk to your parents?","Unit 5 What were you doing when the rainstorm came?","Unit 6 An old man tried to move the mountains.","Unit 7 What's the highest mountain in the world?","Unit 8 Have you read Treasure Island yet?","Unit 9 Have you ever been to a museum?","Unit 10 I've had this bike for three years."]},"9":{"全":["Unit 1 How can we become good learners?","Unit 2 I think that mooncakes are delicious!","Unit 3 Could you please tell me where the restrooms are?","Unit 4 I used to be afraid of the dark.","Unit 5 What are the shirts made of?","Unit 6 When was it invented?","Unit 7 Teenagers should be allowed to choose their own clothes.","Unit 8 It must belong to Carla.","Unit 9 I like music that I can dance to.","Unit 10 You're supposed to shake hands.","Unit 11 Sad movies make me cry.","Unit 12 Life is full of the unexpected.","Unit 13 We're trying to save the earth!","Unit 14 I remember meeting all of you in Grade 7."]}};

window.MOCK = {

  roles: {
    admin:   { label: '管理端', desc: '全校 / 全平台组织、权限与数据治理' },
    academic:{ label: '教务处', desc: '校级排课、师生导入与班级运行' },
    teacher: { label: '老师', desc: '班级教学、批改、学情与学生导入' },
    student: { label: '学生（轻量端）', desc: '作业反馈、资源浏览' }
  },

  navModules: {
    teacher: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'paper', label: '命题组卷', route: '#/paper', icon: 'paper' },
      { key: 'grading', label: '批改中心', route: '#/grading', icon: 'grading' },
      { key: 'resources', label: '资源与语料', route: '#/resources', icon: 'book' },
      { key: 'analytics', label: '学情报告', route: '#/analytics', icon: 'chart' },
      { key: 'admin', label: '我的班级', route: '#/admin?tab=members', icon: 'members' }
    ],
    academic: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'paper', label: '命题组卷', route: '#/paper', icon: 'paper' },
      { key: 'grading', label: '批改中心', route: '#/grading', icon: 'grading' },
      { key: 'resources', label: '资源与语料', route: '#/resources', icon: 'book' },
      { key: 'analytics', label: '校级学情', route: '#/analytics', icon: 'chart' },
      { key: 'admin', label: '校级管理', route: '#/admin', icon: 'school' }
    ],
    admin: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'admin', label: '学校管理', route: '#/admin', icon: 'school' },
      { key: 'resources', label: '资料审核', route: '#/resources', icon: 'book' }
    ],
    student: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'knowledge', label: '知识点讲解', route: '#/knowledge', icon: 'knowledge' },
      { key: 'wrongbook', label: '错题本', route: '#/wrongbook', icon: 'wrong' },
      { key: 'grading', label: '批改反馈', route: '#/grading', icon: 'grading' },
      { key: 'resources', label: '学习资源', route: '#/resources', icon: 'book' },
      { key: 'plan', label: '我的学习计划', route: '#/analytics/students/plan', icon: 'plan' }
    ]
  },

  sidebar: {
    paper: [
      { label: '教材章节入口', route: '#/paper', icon: 'book' },
      { label: '知识点图谱', route: '#/paper?tab=graph', icon: 'graph' },
      { label: '我的试卷', route: '#/paper/mine', icon: 'mine', count: 12 },
      { label: '组卷模板', route: '#/paper/templates', icon: 'template' }
    ],
    grading: [
      { label: '上传与队列', route: '#/grading', icon: 'upload' },
      { label: '待复核', route: '#/grading?tab=review', icon: 'review', count: 3 },
      { label: '已完成', route: '#/grading?tab=done', icon: 'done' },
      { label: '评分标准', route: '#/grading/rubric', icon: 'rubric' }
    ],
    resources: [
      { label: '资源检索', route: '#/resources', icon: 'search' },
      { label: '我的收藏', route: '#/resources?tab=fav', icon: 'fav' },
      { label: '上传资源', route: '#/resources/upload', icon: 'upload' },
      { label: '教学语料库', route: '#/corpus', icon: 'book' }
    ],
    analytics: [
      { label: '班级概览', route: '#/analytics', icon: 'chart' },
      { label: '学生明细', route: '#/analytics/students', icon: 'student' },
      { label: '导出报告', route: '#/analytics/export', icon: 'export' }
    ],
    admin: [
      { label: '成员管理', route: '#/admin', icon: 'members' },
      { label: '班级管理', route: '#/admin?tab=classes', icon: 'class' },
      { label: '公告管理', route: '#/admin?tab=notices', icon: 'notice' },
      { label: '权限设置', route: '#/admin?tab=permissions', icon: 'perm' }
    ],
    help: [
      { label: '新手引导', route: '#/help', icon: 'guide' },
      { label: '常见问题', route: '#/help?tab=faq', icon: 'faq' },
      { label: '培训材料', route: '#/help?tab=materials', icon: 'train' }
    ],
    knowledge: [
      { label: '全部知识点', route: '#/knowledge', icon: 'knowledge' },
      { label: '数学', route: '#/knowledge?sub=math', icon: 'graph' },
      { label: '语文', route: '#/knowledge?sub=zh', icon: 'book' },
      { label: '英语', route: '#/knowledge?sub=en', icon: 'book' },
      { label: '我的错题本', route: '#/wrongbook', icon: 'wrong' }
    ],
    wrongbook: [
      { label: '错题本', route: '#/wrongbook', icon: 'wrong' },
      { label: '知识点讲解', route: '#/knowledge', icon: 'knowledge' },
      { label: '我的学习计划', route: '#/analytics/students/plan', icon: 'plan' }
    ],
    plan: [
      { label: '我的学习计划', route: '#/analytics/students/plan', icon: 'plan' },
      { label: '错题本', route: '#/wrongbook', icon: 'wrong' },
      { label: '知识点讲解', route: '#/knowledge', icon: 'knowledge' }
    ],
    home: []
  },

  /* ---------- 1-9 年级 · 语数英 · 多版本教材目录 ---------- */
  TEXTBOOKS: {
    math: {
      name: '数学',
      versions: [
        { id: "renjiao", name: "人教版", desc: "全国使用最广", default: true, books: MATH_BOOKS },
        { id: "beishida", name: "北师大版", desc: "华东地区广泛使用", books: MATH_BOOKS },
        { id: "sujiao", name: "苏教版", desc: "江苏、浙江等地使用", books: MATH_BOOKS },
        { id: "huashi", name: "华师大版", desc: "华东师大社（初中）", books: MATH_BOOKS },
        { id: "qingdao", name: "青岛版", desc: "山东等地使用", books: MATH_BOOKS },
        { id: "xishi", name: "西师版", desc: "西南地区使用", books: MATH_BOOKS },
        { id: "jijiao", name: "冀教版", desc: "河北等地使用", books: MATH_BOOKS },
        { id: "beijing", name: "北京版", desc: "北京地区使用", books: MATH_BOOKS },
        { id: "hujiao", name: "沪教版", desc: "上海地区使用", books: MATH_BOOKS }
      ]
    },
    chinese: {
      name: '语文',
      versions: [
        { id: "tongbian", name: "统编版（人教）", desc: "全国统一使用", default: true, books: CHINESE_BOOKS },
        { id: "sujiao", name: "苏教版", desc: "江苏教育社", books: CHINESE_BOOKS },
        { id: "beijing", name: "北京版", desc: "北京地区使用", books: CHINESE_BOOKS },
        { id: "hunan", name: "湘教版", desc: "湖南等地使用", books: CHINESE_BOOKS },
        { id: "jijiao", name: "冀教版", desc: "河北等地使用", books: CHINESE_BOOKS }
      ]
    },
    english: {
      name: '英语',
      versions: [
        { id: "pep", name: "人教版（PEP）", desc: "全国使用最广", default: true, books: ENGLISH_BOOKS },
        { id: "waiyan", name: "外研版", desc: "外研社，全国多省使用", books: ENGLISH_BOOKS },
        { id: "yilin", name: "译林版（牛津）", desc: "江苏等地使用", books: ENGLISH_BOOKS },
        { id: "jijiao", name: "冀教版", desc: "河北等地使用", books: ENGLISH_BOOKS },
        { id: "beishida", name: "北师大版", desc: "部分地区使用", books: ENGLISH_BOOKS },
        { id: "renai", name: "仁爱版", desc: "湖南等地使用", books: ENGLISH_BOOKS },
        { id: "hujiao", name: "沪教版", desc: "上海地区使用", books: ENGLISH_BOOKS }
      ]
    }
  },

  /* ---------- 整卷模板（按地区中考 / 期末 / 单元测试的题型与难度分布） ---------- */
  PAPER_PRESETS: {
    math: [
      {
        id: 'unit', name: '单元测试卷', region: '通用', total: 100, time: 90,
        sections: [
          { type: '选择题', count: 8, points: 3, diff: { 易: 0.5, 中: 0.35, 难: 0.15 } },
          { type: '判断题', count: 5, points: 2, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '填空题', count: 6, points: 4, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '解答题', count: 6, points: [6, 6, 7, 7, 8, 8], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      },
      {
        id: 'final', name: '期末测试卷', region: '通用', total: 120, time: 100,
        sections: [
          { type: '选择题', count: 10, points: 4, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '填空题', count: 8, points: 4, diff: { 易: 0.35, 中: 0.45, 难: 0.2 } },
          { type: '解答题', count: 6, points: [6, 6, 8, 8, 10, 10], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      },
      {
        id: 'zk_xm', name: '厦门中考模拟卷', region: '福建·厦门', total: 150, time: 120,
        sections: [
          { type: '选择题', count: 10, points: 4, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '填空题', count: 6, points: 4, diff: { 易: 0.35, 中: 0.45, 难: 0.2 } },
          { type: '解答题', count: 9, points: [8, 8, 8, 8, 8, 10, 10, 12, 14], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      },
      {
        id: 'zk_fj', name: '福建中考模拟卷', region: '福建', total: 150, time: 120,
        sections: [
          { type: '选择题', count: 10, points: 4, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '填空题', count: 6, points: 4, diff: { 易: 0.35, 中: 0.45, 难: 0.2 } },
          { type: '解答题', count: 9, points: [8, 8, 8, 8, 8, 10, 10, 12, 14], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      }
    ],
    chinese: [
      {
        id: 'unit', name: '单元测试卷', region: '通用', total: 100, time: 90,
        sections: [
          { type: '选择题', count: 8, points: 3, diff: { 易: 0.5, 中: 0.35, 难: 0.15 } },
          { type: '填空题', count: 6, points: 3, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '阅读题', count: 2, points: 10, diff: { 易: 0.2, 中: 0.5, 难: 0.3 } },
          { type: '解答题', count: 5, points: [7, 7, 7, 8, 9], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      },
      {
        id: 'zk', name: '中考模拟卷', region: '福建·厦门', total: 150, time: 120,
        sections: [
          { type: '选择题', count: 12, points: 3, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '填空题', count: 8, points: 2, diff: { 易: 0.35, 中: 0.45, 难: 0.2 } },
          { type: '阅读题', count: 4, points: [9, 9, 10, 10], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } },
          { type: '解答题', count: 5, points: [10, 10, 12, 14, 14], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      }
    ],
    english: [
      {
        id: 'unit', name: '单元测试卷', region: '通用', total: 100, time: 90,
        sections: [
          { type: '选择题', count: 15, points: 2, diff: { 易: 0.5, 中: 0.35, 难: 0.15 } },
          { type: '填空题', count: 5, points: 2, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '阅读题', count: 3, points: 10, diff: { 易: 0.2, 中: 0.5, 难: 0.3 } },
          { type: '解答题', count: 4, points: [6, 6, 8, 10], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      },
      {
        id: 'zk', name: '中考模拟卷', region: '福建·厦门', total: 120, time: 120,
        sections: [
          { type: '选择题', count: 15, points: 2, diff: { 易: 0.4, 中: 0.4, 难: 0.2 } },
          { type: '填空题', count: 5, points: 2, diff: { 易: 0.35, 中: 0.45, 难: 0.2 } },
          { type: '阅读题', count: 4, points: 10, diff: { 易: 0.2, 中: 0.5, 难: 0.3 } },
          { type: '解答题', count: 5, points: [6, 7, 8, 9, 10], diff: { 易: 0.2, 中: 0.5, 难: 0.3 } }
        ]
      }
    ]
  },

  permissions: [
    { action: '命题 / 组卷', teacher: true, academic: true, admin: true },
    { action: 'AI 出题', teacher: true, academic: true, admin: true },
    { action: '批改复核与评分修正', teacher: true, academic: true, admin: false },
    { action: '跨班级学情查看', teacher: false, academic: true, admin: true },
    { action: '导出成绩单 / 报告', teacher: true, academic: true, admin: true },
    { action: '导入学生账号', teacher: true, academic: true, admin: true },
    { action: '导入教师账号', teacher: false, academic: true, admin: true },
    { action: '成员 / 班级 / 权限管理', teacher: true, academic: true, admin: true },
    { action: '发布 / 编辑 / 撤回学校公告', teacher: false, academic: true, admin: true },
    { action: '查看未授权资源', teacher: false, academic: false, admin: true }
  ],

  guides: [
    { title: '绑定班级', desc: '加入学校空间并绑定任课班级' },
    { title: '导入学生', desc: '按模板批量导入或邀请学生' },
    { title: '首次命题', desc: '双入口选知识点，AI 一键出题' },
    { title: '首次批改', desc: '上传答卷，AI 预批改后人工复核' },
    { title: '查看报告', desc: '生成学情报告并下钻学生明细' }
  ],

  faqs: [
    { q: '为什么我切换教材版本后，题目还能复用？', a: '平台采用“底层知识点索引、上层教材兼容”的混合策略：题目只挂在课标知识点图谱上，教材章节映射表负责把“人教版/北师大版章节”翻译成知识点，因此更换教材版本不影响资源复用。' },
    { q: 'AI 批改的结果可靠吗？怎么保证质量？', a: 'AI 生成内容一律标注“AI 生成”，批改结果必须经过教师人工复核后才可发布；低分与低置信度答卷会被优先标记，所有修正操作都会写入审计日志。' },
    { q: '弱网或断网时还能用吗？', a: '网页版会自动检测网络状态，弱网时切换简化模式（隐藏图表与高清图），批改任务进入队列，联网后自动重试；完全离线场景建议使用学生端 App。' },
    { q: '学生数据如何保护？', a: '遵循未成年人数据最小化采集原则，默认脱敏展示，导出与分享受权限控制，删除操作符合未成年人个人信息保护要求。' }
  ],

  /* ---------- 学生端：知识点讲解库 ---------- */
  KNOWLEDGE: [
    {
      id: 'make10', subject: 'math', grade: '1-2 年级', tag: '数与运算',
      title: '凑十法',
      brief: '把 8+5 变成 8+2+3：先凑出 10，再往上加，算得又快又稳。',
      how: ['看大数：8 还差几到 10？差 2。', '拆小数：把 5 拆成 2 和 3。', '先凑十：8+2=10；再加剩下的 3：10+3=13。'],
      example: '计算 9+6。把 6 拆成 1 和 5：9+1=10，10+5=15。',
      why: '把 10 叫作“最友好的整十数”。20 以内的加法都先回到 10，就像先回“家”再出发，不容易数错。',
      tip: '口诀：看大数，拆小数，凑成十，加剩数。',
      variation: '8+7=？ 14+6=？ 用凑十法各写一遍过程。',
      pitfall: '拆小数时拆错数，或者凑成 10 后忘记把剩下的数加上。'
    },
    {
      id: 'break10', subject: 'math', grade: '1-2 年级', tag: '数与运算',
      title: '破十法',
      brief: '算 15-7：先把 15 拆成 10 和 5，用 10 去减 7，再把剩下的加回来。',
      how: ['拆被减数：15 拆成 10 和 5。', '破十：10-7=3。', '把剩下的加回来：3+5=8。'],
      example: '16-8：16 拆成 10 和 6，10-8=2，2+6=8。',
      why: '减法最难的是“个位不够减”。一个直观的思路是：先借来一个整十，减完再还回去，和竖式的“退位”是同一件事。',
      tip: '口诀：看个位，不够减，拆十位，减完加回个位。',
      variation: '14-9=？ 12-5=？ 用破十法写过程。',
      pitfall: '破十后忘记把个位剩下的数加回来。'
    },
    {
      id: 'barmodel', subject: 'math', grade: '1-6 年级', tag: '应用题',
      title: '画图法解应用题（条形图模型）',
      brief: '把题目里的数量画成一根根“条形”，一眼看出谁多谁少、要求什么。',
      how: ['读题：圈出已知数量和问题。', '画条：每个数量画一条等宽的条，长短表示多少。', '标问号：在要求的条上画“？”。', '列式：看条与条的和差关系写出算式。'],
      example: '小明有 12 支笔，小红比小明多 5 支。小红有几支？画两条：小明 12、小红 12+5 → 17 支。',
      why: '这是“画图建模”：把文字变成图形，再让图形“说出”算式。大量应用题都适合先画图再列式。',
      tip: '和比多少用“长条相并”，差比多少用“长条相减”，先画整体再标已知。',
      variation: '一箱苹果 30 个，吃了一些后剩 12 个，吃了几个？画条图再列式。',
      pitfall: '把“多 5 支”误当成小红有 5 支；画图时忘标单位。'
    },
    {
      id: 'placevalue', subject: 'math', grade: '1-4 年级', tag: '数与运算',
      title: '位值与数感',
      brief: '同一个数字在不同位置代表不同大小：37 里的 3 是“3 个十”，不是“3”。',
      how: ['看数位：从右往左是个、十、百、千。', '拆数：37 = 30 + 7 = 3 个十 + 7 个一。', '用实物验证：3 捆小棒（每捆 10 根）+ 7 根。'],
      example: '406 里有几个百、几个十、几个一？4 个百、0 个十、6 个一。',
      why: '用“十进组块”让数“看得见”：满十个就捆成一捆。数感就是先懂“位值”，再谈计算。',
      tip: '写数前先问：每个数字在哪个数位，代表几个什么？',
      variation: '用位值拆 580、909；比大小 407 和 470 哪个大？为什么？',
      pitfall: '406 中间的 0 漏写，或把“十位上的 0”当成没有。'
    },
    {
      id: 'equalgroups', subject: 'math', grade: '2-3 年级', tag: '乘法除法',
      title: '乘法是“相同的组”',
      brief: '3×4 就是“3 组，每组 4 个”，不是硬背口诀，而是先看组和每组的个数。',
      how: ['找组：3×4 表示 3 组。', '找每组的个数：每组 4 个。', '数总数：4+4+4=12，所以 3×4=12。'],
      example: '每排坐 5 人，坐 4 排，共几人？4 组每组 5 人 → 5×4=20。',
      why: '把乘法先教成“相同的组”，再教口诀；除法反过来：“把总数分成相同的组，每组几个 / 分几组”。先懂意义，口诀才不白背。',
      tip: '遇到乘法先问两句：有几组？每组几个？',
      variation: '12 个苹果平均装 3 盘，每盘几个？用“分组”的话讲一遍。',
      pitfall: '3×4 与 4×3 的“组”和“每组的个数”不同，但总数相同。'
    },
    {
      id: 'fractionintro', subject: 'math', grade: '3-5 年级', tag: '分数',
      title: '分数入门：把一个整体平均分',
      brief: '3/4 表示“把一个整体平均分成 4 份，取其中 3 份”。分数条能直接“看”出大小。',
      how: ['找整体：先确定“1”是谁（一个圆、一张饼、一条带子）。', '平均分：按分母分份数（4 份）。', '取分子：拿 3 份就是 3/4。'],
      example: '一块蛋糕平均切成 5 块，吃了 2 块，吃了这块蛋糕的几分之几？2/5。',
      why: '用“分数条”（fraction bars）把 1/2、1/3、1/4 排在一起，谁大谁小一眼可见；再用“等分披萨”让分数像积木一样可拼。',
      tip: '先问“1 是什么”，再看“平均分成了几份”“取了几份”。',
      variation: '1/2 和 2/4 一样大吗？画两条分数条比一比。',
      pitfall: '没有平均分就写分数；把“份数”和“取数”写反。'
    },
    {
      id: 'fractionops', subject: 'math', grade: '5-6 年级', tag: '分数',
      title: '分数运算：同分母才直接加减',
      brief: '1/4+1/4=2/4，因为单位一样（都是四分之一）；1/4+1/3 要先变成同分母。',
      how: ['看分母：分母相同直接分子相加（分母不变）。', '分母不同：找最小公倍数，通分成同分母。', '约分：结果能约就约到最简。'],
      example: '1/3+1/6：通分成 2/6+1/6=3/6=1/2。',
      why: '把分数想成“钱币”：只有面值（分母）相同的才能直接合。用分数条一拼，为什么通分就一目了然。',
      tip: '加法看“单位”是否相同；乘法才“分子乘分子、分母乘分母”。',
      variation: '2/5+1/10=？ 3/4-1/8=？ 写通分过程。',
      pitfall: '分子分母一起加；约分不彻底。'
    },
    {
      id: 'areamodel', subject: 'math', grade: '3-5 年级', tag: '图形与测量',
      title: '周长与面积：铺瓷砖与围栅栏',
      brief: '周长是“围一圈”的长度（像栅栏），面积是“铺满”的大小（像瓷砖）。',
      how: ['看问题：围一圈→周长；铺满→面积。', '周长：把四条边加起来（长方形 =（长+宽）×2）。', '面积：数一数铺了多少个 1×1 的小方格（长×宽）。'],
      example: '长 5、宽 3 的长方形：周长 (5+3)×2=16，面积 5×3=15。',
      why: '用“铺瓷砖”验证面积、用“围栅栏”理解周长，两个概念从此不混。',
      tip: '问自己：这道题要我“围一圈”还是“铺满”？',
      variation: '周长都是 20 的两个长方形，面积一定一样吗？举例说明。',
      pitfall: '把周长算成面积；长方形周长忘乘 2。'
    },
    {
      id: 'workproblem', subject: 'math', grade: '4-6 年级', tag: '应用题',
      title: '工程问题：先算“每天做多少”',
      brief: '甲 10 天做完，就是每天做总量的 1/10；两人合作，把每天的“效率”加起来。',
      how: ['把总工作量看成 1。', '算效率：甲每天 1/10，乙每天 1/15。', '合作：1/10+1/15=1/6，所以 1÷(1/6)=6 天。'],
      example: '甲 6 天完成、乙 12 天完成，合作几天？1/6+1/12=1/4 → 4 天。',
      why: '“归一法”的核心是：先算“一份是多少、一天做多少”，再算整体。工程问题本质上就是“效率相加”。',
      tip: '记住：总量 ÷ 每天效率 = 天数；合作就是效率相加。',
      variation: '合作 2 天后剩下的由乙单独做，还需几天？（先算还剩多少）',
      pitfall: '直接把 10 和 15 平均；忘记把总工作量看成 1。'
    },
    {
      id: 'balance', subject: 'math', grade: '6-7 年级', tag: '方程',
      title: '解方程：天平保持平衡',
      brief: '方程像一架天平：两边同时加、减、乘、除同一个数，天平仍平衡，未知数就能“孤零零”留在一边。',
      how: ['把方程看成天平：等号两边必须一样重。', '两边同时做同一操作（先加减，再乘除）。', '直到左边只剩 x，右边就是答案。'],
      example: '2x-3=7：两边同时 +3 → 2x=10；两边同时 ÷2 → x=5。',
      why: '用真实天平演示“等式的性质”：你在左边拿走 3，右边也必须拿走 3。这样移项就不是背口诀，而是“保持平衡”。',
      tip: '每一步都写“两边同时……”，最后把答案代回去检验。',
      variation: '3(x-2)=x+4：先去括号，再按天平法解。',
      pitfall: '只在一边做操作；移项忘记变号。'
    },
    {
      id: 'negativenum', subject: 'math', grade: '7 年级', tag: '有理数',
      title: '负数与数轴：向左是负，向右是正',
      brief: '数轴像一条路：0 是起点，向右走是正数，向左走是负数；减法就是“往回走”。',
      how: ['画数轴：标出 0、正方向（右）和单位长度。', '加正数→向右走；加负数→向左走。', '减一个数=向相反方向走：(-2)-(-5) 就是向左 2 再向右 5，停在 3。'],
      example: '(-3)+(+7)：从 -3 向右走 7 步，停在 4。',
      why: '先教“数轴上的行走”，再教符号法则——把抽象的正负号变成看得见的“方向与步数”，这也是数感训练的一部分。',
      tip: '先定方向，再数步数；减负数 = 加正数。',
      variation: '数轴上 -2 与 5 的距离是多少？画图说明。',
      pitfall: '把“距离”当成负数；减负数时方向走反。'
    },
    {
      id: 'functionmachine', subject: 'math', grade: '7-8 年级', tag: '函数',
      title: '函数机器：进去一个数，出来一个数',
      brief: '函数就是一台“机器”：喂进去 x，按规则加工，吐出 y。f(x)=2x+1 就是“先乘 2 再加 1”。',
      how: ['找规则：题目给的式子或表格里藏着的规律。', '喂数：取几个 x（如 0、1、2）逐个算 y。', '画点连线：把 (x,y) 描在坐标纸上，看是不是一条直线。'],
      example: '机器规则是“乘 2 加 1”：x=3 → y=7；x=0 → y=1。',
      why: '用“函数机器”直观理解函数——先懂“对应关系”，再记公式；这也是二次函数、反比例函数入门的统一思路。',
      tip: '做函数题先列一张“x→y”的小表格，再找规律。',
      variation: '给函数机器画一张表：x=-1,0,1,2 时 y=x²-2 的输出。',
      pitfall: '把 y 和 x 的位置弄反；画点时坐标写错。'
    },
    {
      id: 'pythagorean', subject: 'math', grade: '8-9 年级', tag: '几何',
      title: '勾股定理：用拼图“看”出 a²+b²=c²',
      brief: '直角三角形的两条直角边平方和，等于斜边平方。用四个全等直角三角形拼正方形，面积不变，就能“看”出这个关系。',
      how: ['标出直角边 a、b 和斜边 c。', '用四个全等直角三角形拼成两个大正方形。', '大正方形面积 = (a+b)²，也等于 4×(ab/2)+c²。', '化简得到 a²+b²=c²。'],
      example: '直角边 6、8：6²+8²=36+64=100，c=10。',
      why: '用“拼图证明”代替死记公式：面积怎么摆都不变，等式自然成立。看到“为什么”，公式才记得牢。',
      tip: '先找直角，直角对着的边才是斜边 c。',
      variation: '直角边 5、12，斜边是多少？斜边 13、一条直角边 5，另一条呢？',
      pitfall: '把斜边当成直角边；忘记开平方。'
    },
    {
      id: 'vertexform', subject: 'math', grade: '9 年级', tag: '函数',
      title: '二次函数顶点式：平移看开口',
      brief: 'y=a(x-h)²+k 的顶点就是 (h,k)：a 管开口和胖瘦，h 管左右平移，k 管上下平移。',
      how: ['配方：y=x²-4x+3 = (x-2)²-1。', '读顶点：h=2，k=-1 → 顶点 (2,-1)。', '看开口：a>0 开口向上，a<0 开口向下。'],
      example: 'y=-(x-1)²+4：顶点 (1,4)，开口向下，最大值 4。',
      why: '把二次函数当成“y=x² 的平移与翻转”，先画母函数再移动，顶点式就自然理解了，而不是硬记公式。',
      tip: '配方后用“顶点式”一口气读出顶点、对称轴、最值。',
      variation: '把 y=x² 向左平移 2、向上平移 3，开口变为向下且变瘦，写出新函数。',
      pitfall: 'h 的符号取反（(x-2)² 顶点 x=2 不是 -2）；忘看开口方向。'
    },
    {
      id: 'reading3', subject: 'zh', grade: '3-9 年级', tag: '阅读',
      title: '阅读三步法：先圈、再定位、后作答',
      brief: '读一篇文章至少三遍：第一遍通读大意，第二遍圈关键词，第三遍带着题目回原文定位。',
      how: ['第一遍通读：不问细节，只问“写了谁、什么事、什么感情”。', '第二遍圈画：圈人物、时间、地点和抒情议论句。', '第三遍定位：看题回原文，找到依据再作答。'],
      example: '题目问“作者为什么这样写”，先回到原文找那句，再想“手法 + 内容 + 情感”。',
      why: '阅读教学强调“文本依据”：答案不是猜的，是从文章里“找”出来的。三遍读法让每遍都有任务，不白读。',
      tip: '答题格式：观点 + 文中依据 + 简单分析，三步缺一不可。',
      variation: '用三步法读一段短文，并回答“主人公心情发生了什么变化”。',
      pitfall: '只抄原文不概括；赏析题漏答“手法”。'
    },
    {
      id: 'sentencefix', subject: 'zh', grade: '4-9 年级', tag: '语病',
      title: '病句辨析：先找主干，再查修饰',
      brief: '改病句像医生做手术：先找到“谁 + 做什么”（主干），再检查修饰成分是否搭配。',
      how: ['找主干：去掉“的、地、得”前面的修饰，留下主谓宾。', '查搭配：主语和谓语搭不搭、动宾搭不搭。', '查成分：是否缺主语、缺宾语，或重复啰嗦。'],
      example: '“通过这次活动，使我明白了道理。”主干是“活动使……”但前面多了“通过”，缺了真正的主语，去掉“通过”或“使”。',
      why: '这叫作“句子手术”：先切主干，再逐个检查零件。把句子当机器拆开看，毛病就藏不住。',
      tip: '四查：查主干、查搭配、查成分、查逻辑。',
      variation: '判断“我们要养成认真读书的习惯”有没有语病。',
      pitfall: '被长修饰语绕晕；把“两面对一面”等逻辑错误漏掉。'
    },
    {
      id: 'phonics', subject: 'en', grade: '1-6 年级', tag: '拼读',
      title: '自然拼读：字母音拼出单词',
      brief: '英语单词大多“见词能读”：c-a-t 三个音拼起来就是 cat。先学字母音，再学拼读。',
      how: ['学字母音：b 读 /b/，不是“必”。', '拼读 CVC：cat = /k/ + /æ/ + /t/ 连起来。', '学常见字母组合：sh、ch、ee、oo 各有固定音。'],
      example: '拼读：dog → /d/ /o/ /g/；fish → f-i-sh 三个音。',
      why: '先学自然拼读再学单词拼写，因为 80% 以上的英语单词符合拼读规则；先“会读”再“会写”，记单词不再靠死背。',
      tip: '看到生词先试着按字母音拼，再对照词典检查。',
      variation: '用自然拼读拼读这些词：sun、hat、ship、moon。',
      pitfall: '把字母名（letter name）当字母音；不规则词也硬套规则。'
    },
    {
      id: 'presenttense', subject: 'en', grade: '3-9 年级', tag: '语法',
      title: '一般现在时：习惯与事实，第三人称要加 s',
      brief: '讲习惯、讲事实用一般现在时；主语是 he/she/it（第三人称单数）时，动词要加 s/es。',
      how: ['判断：是不是“经常做 / 事实 / 习惯”？是就用一般现在时。', '看主语：I/you/we/they 用动词原形。', '第三人称单数：he/she/it 动词加 s（go→goes, study→studies）。'],
      example: 'She goes to school by bus every day.（每天是习惯，she 加 s）',
      why: '把动词变化比作“给动词戴帽子”：第三人称单数就是动词的专属帽子，主语一变，帽子就得戴上。',
      tip: '看见 every day / always / often 先想到一般现在时，再看主语。',
      variation: '用正确形式填空：He ___ (like) apples. They ___ (play) football every day.',
      pitfall: '忘记第三人称加 s；把一般现在时和现在进行时混用。'
    },
    {
      id: 'chickrabbit', subject: 'math', grade: '4-6 年级', tag: '竞赛·应用题',
      title: '鸡兔同笼：先假设，再置换',
      brief: '笼里有鸡和兔，共 35 个头、94 只脚。先假设全是鸡，再用“多出来的脚”倒推出兔子的数量。',
      how: ['先假设全是鸡：35 个头就有 35×2=70 只脚。', '和实际比差多少：94-70=24 只脚。', '一只兔被当成鸡就少算 2 只脚：24÷2=12 只兔。', '鸡就是 35-12=23 只。'],
      example: '头 26 个、脚 68 只：全当鸡有 52 只脚，差 16，16÷2=8 只兔，鸡 18 只。',
      why: '竞赛题里的“置换思想”：先假设成简单的那种，找出和真实情况的差，再用“每换一只差多少”把差换回来。假设法把两类东西混在一起的难题，变成两步减法。',
      tip: '口诀：全按一种算，差脚除以 2，就是另一种的只数。',
      variation: '停车场有 20 辆车，都是汽车（4 轮）和摩托车（2 轮），共 56 个轮子，各有多少辆？',
      pitfall: '忘记“每只兔比鸡多 2 只脚”；把脚数差直接当只数差除错。'
    },
    {
      id: 'drawer', subject: 'math', grade: '3-6 年级', tag: '竞赛·计数',
      title: '抽屉原理：必然重复',
      brief: '把 4 个苹果放进 3 个抽屉，无论怎么放，总有一个抽屉里至少有两个苹果。',
      how: ['找“抽屉”：看有几种位置或类别，这就是抽屉数。', '找“苹果”：看有多少个东西要放。', '用结论：东西数比抽屉数多，就至少有一个抽屉里不止一个。', '推广：先平均放，再多出的 1 个总要落到某个抽屉里。'],
      example: '13 个同学，至少有几个出生在同一个月？12 个月是 12 个抽屉，13÷12 余 1，至少 2 人同月。',
      why: '抽屉原理也叫“最不利原则”的反面：先想最倒霉的情况，让每个抽屉都尽量少，再多放一个就不得不重复。它是判断“一定有”这类问题的万能钥匙。',
      tip: '先问自己：这里的“抽屉”是什么？平均分完，剩下 1 个往哪儿放？',
      variation: '箱子里有红、黄、蓝三种颜色的球，至少要摸几个，才能保证有 2 个同色？',
      pitfall: '找不到真正的“抽屉”（类别）；把“保证”想成“可能”，多算或少算 1 个。'
    },
    {
      id: 'enumeration', subject: 'math', grade: '4-8 年级', tag: '竞赛·策略',
      title: '枚举与分类讨论：不重不漏',
      brief: '情况太多时，按一定顺序把可能的情况一个个列出来，既不重复也不遗漏。',
      how: ['先分类：想清楚按什么标准分（大小、位置、个数…）。', '定顺序：每一类里从小到大、从少到多。', '逐类枚举：把每一类的情况写出来、数出来。', '合并相加：检查有没有漏和重。'],
      example: '用 1、2、3 组成两位数（数字不重复）：12、13、21、23、31、32，共 6 个。',
      why: '竞赛里很多题“想不出公式”，但可以老老实实数。分类讨论和枚举能把大难题拆成一个个小问题，关键是做到不重不漏。',
      tip: '枚举前先想好“按什么顺序”，写完数一遍：多一格、少一格都不行。',
      variation: '从 1 到 30，数字 2 一共出现多少次？（提示：按个位、十位分别数）',
      pitfall: '分类标准没想好就动手；重复数或漏数。'
    },
    {
      id: 'parity', subject: 'math', grade: '4-9 年级', tag: '竞赛·数论',
      title: '奇偶性分析：只看单双',
      brief: '只看一个数是单是双，就能判断很多题：奇+奇=偶，偶+偶=偶，奇+偶=奇；乘法里只要有一个偶数，结果就是偶数。',
      how: ['判断奇偶：能被 2 整除的是偶数，否则是奇数。', '记加减规则：把偶数当 0、奇数当 1，1+1=0（偶）。', '记乘法规则：只要有偶数参与相乘，结果就是偶数。', '用规则排除：把不满足奇偶条件的答案直接划掉。'],
      example: '1+2+3+…+10 是奇数还是偶数？1 到 10 里有 5 个奇数，奇数个奇数和是奇数，再加偶数不变，结果是奇数。',
      why: '奇偶性像数的“颜色”：加减乘除有固定的颜色规律。很多竞赛题表面是巨大计算，其实只问结果是单是双，用颜色规律一眼判断。',
      tip: '记不住规则就记“1 是奇、0 是偶”，代进加减乘除里试试。',
      variation: '三个连续整数的和一定是几的倍数？用奇偶性说明理由。',
      pitfall: '乘法规则记反（以为奇乘奇是偶）；大数运算前忘了先判断奇偶。'
    },
    {
      id: 'extremeprinciple', subject: 'math', grade: '4-9 年级', tag: '竞赛·策略',
      title: '极端思想与最不利原则',
      brief: '想“至少”“保证”这类问题时，先假设最倒霉、最极端的情况，答案就藏在“最不利 +1”里。',
      how: ['读懂“保证”：要保证一定发生，不是碰运气。', '找最不利：往最坏、最极端的方向想。', '构造极端情形：把所有“差一点”的情况都试一遍。', '再多一个就成功：最不利数量 +1 就是答案。'],
      example: '口袋里有 3 个红球 5 个蓝球，至少摸几次保证摸到蓝球？最不利是前 3 次全红，第 4 次必是蓝。',
      why: '极端思想把“保证”这种模糊要求，变成“最坏情况 +1”的确定算式，是竞赛里最常用的万能构造法之一。',
      tip: '遇到“保证/至少”先问：最倒霉会怎样？然后在那基础上加 1。',
      variation: '一副扑克去掉大小王共 52 张，至少抽几张，才能保证有两张同花色？',
      pitfall: '把“最不利”当成“最有利”；忘掉最后加 1。'
    },
    {
      id: 'patternfind', subject: 'math', grade: '2-6 年级', tag: '竞赛·找规律',
      title: '图形与数列找规律',
      brief: '找规律就是看相邻两项怎么变：加几、乘几，还是隔一项有关系？图形题就先数每幅图多出了什么。',
      how: ['数列：算出相邻两项的差（或比）。', '再看差：差本身有没有规律（每次加 2、平方数…）。', '图形：数每幅图的点、边、块，转化成数列。', '用规律推下一项，再代回去验证。'],
      example: '1、4、9、16、？——差是 3、5、7（每次加 2），所以下一个是 16+9=25。',
      why: '找规律考的是“观察—猜想—验证”的完整链条：把图形数量变成数列后，就回到了最熟悉的加减乘除。',
      tip: '数列先算差；差没规律就再看差的变化；图形题先编号列出数字。',
      variation: '第 1 幅图 1 个点，第 2 幅 3 个，第 3 幅 6 个，第 4 幅 10 个……第 10 幅有几个点？',
      pitfall: '只看到表面的加减，没发现“差的差”；图形数错。'
    },
    {
      id: 'combinatorics', subject: 'math', grade: '5-9 年级', tag: '竞赛·计数',
      title: '排列与组合：顺序说了算',
      brief: '排列是“选出来还要排顺序”，组合是“只选不排顺序”。同样 3 人里选 2 个，组合有 3 种选法，排列有 6 种站法。',
      how: ['先问顺序：调换位置算不算新情况？算就是排列，不算就是组合。', '排列：一个位置一个位置地填，用乘法。', '组合：先从排列数里去掉重复（除以重复次数）。', '数目小时，直接枚举验证。'],
      example: '甲、乙、丙 3 人选 2 个拍照排队：第 1 位 3 种、第 2 位 2 种，共 6 种；只看选哪 2 个人：3 种。',
      why: '竞赛里“数一数有多少种”的题最怕数重数漏。先分清要不要顺序，再一步步用乘法填，是最稳的方法。',
      tip: '判断顺序的土办法：把两个位置换一下，如果答案变了，就是排列。',
      variation: '从 4 本书里选 2 本送给两个朋友（每人一本），有几种送法？如果只选 2 本自己看呢？',
      pitfall: '分不清排列和组合；填位置时漏乘或重复。'
    },
    {
      id: 'modperiod', subject: 'math', grade: '5-9 年级', tag: '竞赛·数论',
      title: '同余与周期：化大为小',
      brief: '很多数会循环：今天是周三，100 天后星期几？一周 7 天循环，100÷7 余 2，往后数 2 天是周五。',
      how: ['找周期：看事情多少天（或多少次）重复一次。', '算余数：总数 ÷ 周期，看余几。', '从起点往后数余数步。', '余 0 表示正好回到起点。'],
      example: '10 个 2 相乘，个位是多少？2、4、8、6 循环，10÷4 余 2，个位是 4。',
      why: '周期思想把“很大的数”变成“很小的余数”，是竞赛里化大为小的经典方法，和日历、时钟、数列都相通。',
      tip: '先把前面几项写出来找循环，再用除法算余数。',
      variation: '今天星期五，再过 30 天星期几？再过 100 天呢？',
      pitfall: '起点数错；把余数当成“第几项”，而不是“往后数几步”。'
    },
    {
      id: 'sumdiff', subject: 'math', grade: '3-6 年级', tag: '竞赛·应用题',
      title: '和差倍问题：画线段找“1 份”',
      brief: '知道两数的和与差，或和与倍数，就用线段图把小数看成 1 份，问题就变成除法求一份。',
      how: ['画线段：小数画 1 段，大数画几段（倍数）或多一段（差）。', '和倍：总数 ÷（1+倍数）= 小数。', '差倍：差 ÷（倍数-1）= 小数。', '和差：（和-差）÷2 = 小数。'],
      example: '甲是乙的 3 倍，两人共 48 元。乙是 1 份，共 4 份，48÷4=12 元，甲 36 元。',
      why: '线段图把“倍数关系”变成“份数关系”，和差倍问题就统一成了“除法求一份”，这是画图法的延续。',
      tip: '先找“1 份”是谁（通常是小数），再数总共有几份。',
      variation: '两个数的和是 60，差是 20，两数各是多少？',
      pitfall: '份数数错；和差问题忘记“先减差再平分”。'
    },
    {
      id: 'limit', subject: 'math', grade: '拓展·初升高/大学入门', tag: '高数入门',
      title: '极限：无限接近',
      brief: '极限想的是“一直走下去，最终会停在哪儿”：1/2、1/4、1/8…越分越小，无限接近 0，我们说它的极限是 0。',
      how: ['看趋势：把一个数列或函数的值越算越细。', '找“越来越靠近”的数：它可能永远到不了，但越走越近。', '用符号记录：lim 表示极限，下面写 x 趋近谁。', '代小例子：把数代进去，看它逼近什么。'],
      example: '0.9、0.99、0.999、0.9999…无限接近 1，所以极限是 1，也就是说 0.999…=1。',
      why: '极限是进入高数的大门，导数、积分都建立在“无限接近”上。先懂“越走越近、也许到不了”，后面学微积分就不怕了。',
      tip: '把极限想成“目标点”：可以永远不踩上去，但每一步都在靠近它。',
      variation: '1、1/2、1/3、1/4、1/5…的极限是多少？说说你的理由。',
      pitfall: '把“接近”和“等于”搞混；只看前面几项就下结论。'
    },
    {
      id: 'derivative', subject: 'math', grade: '拓展·初升高/大学入门', tag: '高数入门',
      title: '导数：某一瞬间有多快',
      brief: '导数是“某一瞬间的变化有多快”：汽车仪表盘上的速度，就是位置对时间的导数，也就是曲线在该点的坡度。',
      how: ['选一个点：看函数在某一点附近。', '算平均变化率：这一小段里 y 变了多少 ÷ x 变了多少。', '把间隔越缩越小：平均变化率越来越接近某个数。', '这个数就是导数：等于曲线在该点切线的坡度。'],
      example: '路程 s=5t²（t 秒），2 秒时的速度：把 2 秒附近的一小段反复缩小，平均速度越来越接近 20 米/秒，导数就是 20。',
      why: '高数把“变化快慢”从平均推进到瞬时：导数就是用极限算出的瞬时变化率。懂了它，物理速度、几何坡度都通了。',
      tip: '看到“瞬时速度”“切线坡度”“变化率”，都想到导数。',
      variation: '骑车上坡时坡度陡，导数就大；坡度平，导数小。试着说说“导数=坡度”为什么说得通。',
      pitfall: '把平均变化率和瞬时变化率混为一谈；以为导数一定是某个公式，忘了它是一个“极限过程”。'
    },
    {
      id: 'integral', subject: 'math', grade: '拓展·初升高/大学入门', tag: '高数入门',
      title: '积分思想：切碎再求和',
      brief: '积分就是把不规则的东西切碎成很多小条，再全部加起来：曲线下的面积，用无数个小长方形逼近。',
      how: ['切碎：把图形沿水平方向切成很多细条。', '近似：每个细条看成一个细长方形，面积=高×宽。', '求和：把所有小长方形面积加起来。', '切得越细越准：无限细分后得到的值就是积分。'],
      example: '速度一直在变，想算 0 到 10 秒走了多远？把时间切成 1000 小段，每段用“当时速度×小段时间”加起来，就是路程（积分）。',
      why: '如果说导数是“从整体看到瞬间”，积分就是“从瞬间拼回整体”。切碎、求和、取极限三步，是算面积、路程、总量的通用套路。',
      tip: '遇到“曲线下的面积”“总共走了多少”“积累的总量”，想想“切碎再求和”。',
      variation: '用 4 个等宽长方形估算 y=x² 在 0 到 1 之间的面积，再想想换成 8 个会不会更准。',
      pitfall: '忘记“切得越细越接近真值”；把积分和导数当成两件无关的事（它们其实是互逆的）。'
    },
    {
      id: 'composite', subject: 'math', grade: '拓展·初升高/大学入门', tag: '高数入门',
      title: '复合函数与反函数：套娃与倒车',
      brief: '复合函数是“套娃”：先经过一道加工，再经过一道加工；反函数是“倒回去”：知道结果，找回输入。',
      how: ['复合：从里往外算，f(g(x)) 先算 g(x)，再把结果交给 f。', '反函数：把 x 和 y 对调，再解出 y。', '验证：正着走再倒着走能回到原点，就说明互逆。', '画图：互逆的两个函数，图像关于一条斜线对称。'],
      example: 'f(x)=x+1，g(x)=2x，则 f(g(3))=f(6)=7；f 的反函数是“结果减 1”。',
      why: '高数里大量运算建立在“先做什么后做什么”和“怎么倒回去”上：解方程就是求反函数的过程，链式法则就是复合函数求导。',
      tip: '复合从里往外，反函数先对调再解；两者都可以用“走一步，退一步”验证。',
      variation: '摄氏转华氏是 F=1.8C+32，写出反过程：知道 F 怎么求 C？',
      pitfall: '复合函数从外往里算；把“倒数”当成“反函数”。'
    },
    {
      id: 'explog', subject: 'math', grade: '拓展·初升高/大学入门', tag: '高数入门',
      title: '指数与对数：正着问与反着问',
      brief: '2³=8，反过来问“8 是 2 的几次方？”答案 3 就叫 log₂8=3。指数和对数是“正着问”和“反着问”的一对朋友。',
      how: ['先认指数：2³=8 里，2 是底数，3 是指数。', '对数反过来：log₂8=3，读作“以 2 为底 8 的对数是 3”。', '记对应：a 的 b 次方=c，反过来 log_a c=b。', '用口诀：对数问的是“底数要乘几次自己，才得到这个数”。'],
      example: '10²=100，所以 log₁₀100=2；2⁵=32，所以 log₂32=5。',
      why: '指数描述翻倍式增长（细胞分裂、利息），对数就是给这种增长“记录次数”的工具。高数里用对数把乘法变成加法，把爆炸式数字变回可读的刻度。',
      tip: '看到 log 先翻译成“几次方”，再把式子改回指数形式计算。',
      variation: 'log₃9 等于几？log₅125 呢？用“几次方”的思路口算。',
      pitfall: '把 logₐb 理解成 a÷b；底数和真数的位置写反。'
    },
    {
      id: 'zhfive', subject: 'zh', grade: '1-9 年级', tag: '学习方法·阅读',
      title: '语文五遍读书法',
      brief: '一篇文章读五遍，每遍任务不同：先通读知大意，再圈画找重点，第三遍品词句，第四遍理结构，第五遍带着问题读。',
      how: ['第一遍通读：不查生字，先知道写了谁、什么事。', '第二遍圈画：圈出生字词和关键句。', '第三遍品读：好词好句好在哪，用了什么写法。', '第四遍理结构：开头、中间、结尾怎么安排。', '第五遍带着问题读：为做题或写作找依据。'],
      example: '读一篇写父亲送别的文章，前两遍了解场景，第三遍品“蹒跚”“攀”这些动词，答题时就有话说了。',
      why: '很多学生“读一遍就做题”，其实没读进去。五遍法把阅读拆成五个小任务，每遍专注一件事，理解自然深一层。',
      tip: '时间不够就用“三遍法”：通读—圈画—定位作答，按需增减。',
      variation: '用五遍法读一篇新课文，把每一遍的任务和收获各写一句话。',
      pitfall: '五遍都在看热闹、不做任务；把圈画当成抄写，忘了品读。'
    },
    {
      id: 'zhannotate', subject: 'zh', grade: '3-9 年级', tag: '学习方法·阅读',
      title: '批注精读法：边读边想',
      brief: '读书时在字里行间写下想法：这个词妙在哪、这句话和题目有什么关系、我不懂什么——书就成了思考的现场。',
      how: ['准备：铅笔和荧光笔，边读边停。', '标：圈好词好句、过渡句、中心句。', '写：在空白处写疑问、感受和联想。', '答：用批注回答题目，答案不再是空想。', '整理：把好批注抄进积累本。'],
      example: '读到“绿”字，批注“动词活用，写出春天由枯到荣的画面”，考试炼字题直接能用。',
      why: '批注把“被动读”变成“主动想”，笔尖逼着脑子动；同时积累的批注，就是现成的答题素材。',
      tip: '批注不求多，每段一两处就够；写“我不懂”也是好批注。',
      variation: '给一段短文做 5 条批注：2 处好词好句、2 处疑问、1 处和题目的联系。',
      pitfall: '只画线不写字，等于没想；批注全是“好”“妙”，没有具体理由。'
    },
    {
      id: 'zhclassics', subject: 'zh', grade: '4-9 年级', tag: '学习方法·古诗文',
      title: '古诗文先懂再背',
      brief: '背古诗文别急着开口，先把意思弄懂、把结构画成图，再开口背，事半功倍。',
      how: ['扫清字词：查注释，把每个不会的字弄明白。', '翻译大意：用自己的话把全文说一遍。', '理结构：分层次，用思维导图画出“先写什么再写什么”。', '看图背诵：看着导图一句句背，再合上图背。', '默写验证：背完默写一遍，专盯易错字。'],
      example: '背一篇写景抒情的古文，先梳理“写景—抒情—议论”三部分，再按导图背，比死背快得多。',
      why: '记忆最怕不理解地硬背，忘得快还容易写错字。先懂后背：意思是钩子，结构是地图，默写是体检。',
      tip: '背诵前先问自己：这段到底在讲什么？讲不出来就别急着背。',
      variation: '用思维导图梳理一篇文言文的结构，再照着导图背诵。',
      pitfall: '只背不译，错字连篇；背完不默写，以为自己会了。'
    },
    {
      id: 'zhwrong3', subject: 'zh', grade: '1-9 年级', tag: '学习方法·错题',
      title: '语文错题三本',
      brief: '语文学科准备三本：生字词本、阅读题本、作文素材本，各记各的错，各补各的漏。',
      how: ['生字词本：抄写写错的字词，注明错在哪（多笔、少笔、形近）。', '阅读本：抄下错题，写出正确答案和答题思路。', '素材本：积累好句、事例和自己观察到的小事。', '每周翻一遍，会的划掉，不会的重做。', '考前只看这三本，复习不抓瞎。'],
      example: '“武”字少写了一撇，记进生字本，每周听写一次，直到不再错。',
      why: '错题本是给自己看的漏洞清单。语文看起来没公式，其实字词、阅读套路、素材都可以积累，分本记录才不会乱。',
      tip: '每道错题记三行：题目、错因、正确做法；错因比答案更重要。',
      variation: '把最近一次考试的错误分类整理进三本，各写 2 条。',
      pitfall: '只抄题不写错因；记了不复习，本子等于白做。'
    },
    {
      id: 'zhexam4', subject: 'zh', grade: '4-9 年级', tag: '学习方法·考试',
      title: '考场阅读四步法',
      brief: '考试阅读按四步走：先读题、再读文、后定位、最后规范作答，时间不乱用。',
      how: ['第一步读题：把题目关键词圈出来（问什么、有几问）。', '第二步读文：带着题目通读，标段落、圈关键句。', '第三步定位：回到原文找答案所在的句子和段落。', '第四步作答：按“观点+依据+分析”写完整，检查有没有答满。'],
      example: '问“某句的作用”，按四步：定位原句→想“内容上写了什么+结构上承上启下”→按格式作答。',
      why: '考试阅读最大的丢分点不是不会，而是答偏、答漏。四步法把凭感觉改成按流程，保证每分都有依据。',
      tip: '先看分值：2 分写两点，3 分写三点，别答不够。',
      variation: '用四步法限时完成一篇阅读，记录每步用了多少时间。',
      pitfall: '不读题就做；抄原文一大段没有分析；时间分配不均，最后一题没时间写。'
    },
    {
      id: 'zhmaterial', subject: 'zh', grade: '3-9 年级', tag: '学习方法·写作',
      title: '作文素材积累卡',
      brief: '平时把好词好句、身边小事、人物事例做成小卡片，写作时像翻字典一样取用。',
      how: ['定主题：按“勤奋、诚信、亲情、成长”等分类。', '收集：看到好句、新闻、身边故事随手记。', '写卡片：每张写清主题、素材、可用角度。', '用：写作文前先翻卡，选 2-3 个素材。', '常更新：用过的标注，新的继续加。'],
      example: '卡片写“素材：妈妈深夜缝补书包；可用角度：亲情、细节描写、默默付出”，写《温暖》时直接用。',
      why: '考场作文最怕没东西写。素材卡把积累变成日常动作，考试时脑子里就有一排货架，随手可取。',
      tip: '一个素材至少开发三个角度，一材多用才划算。',
      variation: '为本学期作文可能考的主题准备 5 张素材卡。',
      pitfall: '只收藏不整理，写时找不到；素材雷同，全班写同一件事。'
    },
    {
      id: 'zhreadaloud', subject: 'zh', grade: '1-9 年级', tag: '学习方法·语感',
      title: '每日朗读养语感',
      brief: '每天大声朗读 10-15 分钟，读准字音、读出节奏，语感就在声音里长出来了。',
      how: ['选材料：课文、古诗、好散文都行，先选读顺的。', '大声读：字正腔圆，不吞字，不拖音。', '有节奏：逗号停顿，句号稍长，读出情感。', '跟读模仿：听朗读音频，跟着模仿语气。', '坚持：每天 10 分钟，比周末突击 2 小时有效。'],
      example: '每天晨读一篇写景散文，一周后“嫩嫩的、绿绿的”这类叠词自己就会用了。',
      why: '朗读同时训练眼、口、耳，字音、断句、语感一起练；很多“说不出哪里好”的语感，就是朗读读出来的。',
      tip: '站着读、挺直腰，声音放出来；录音回听能发现自己注意不到的问题。',
      variation: '选一篇课文连续朗读一周，记录每天的遍数和最明显的进步。',
      pitfall: '用默读代替朗读，语感出不来；读得过快吞音，等于白读。'
    },
    {
      id: 'zhpreview', subject: 'zh', grade: '1-9 年级', tag: '学习方法·预习',
      title: '语文预习“三读”',
      brief: '新课前把课文读三遍：一读读顺，二读圈生字，三读提问题，带着问题上课。',
      how: ['一读读顺：通读全文，读准字音，读通句子。', '二读圈画：圈出生字词、好句和不懂的地方。', '三读提问：想一想“课文想说什么”，写 1-2 个问题。', '查资料：生字查字典，作者和背景可以提前了解。'],
      example: '预习新课文前，先圈出生词，再问“课文为什么这样写”，上课就有目标了。',
      why: '预习让课堂从“听老师讲”变成“验证我的想法”，注意力自然集中；带着问题听课，效率翻倍。',
      tip: '预习控制在 15 分钟内，别把新课全学完，留点新鲜感。',
      variation: '选一篇新课文，按三读法预习，上课前写出你的 2 个问题。',
      pitfall: '预习只抄生字不读课文；预习时把问题都查了答案，上课没事干。'
    },
    {
      id: 'enchunk', subject: 'en', grade: '3-9 年级', tag: '学习方法·口语写作',
      title: '语块学习法：整块记整块用',
      brief: '别一个个背单词，要把 get up、take care of、as soon as 这样的小块头整块记、整块用，像搭积木一样。',
      how: ['找语块：词组、固定搭配、常用句式都算。', '记整块：把语块当成一个整体读熟、抄熟。', '造句：每个语块造 1-2 个自己的句子。', '用出来：写作文、说话时主动套用。'],
      example: '记语块 look forward to doing sth.（期待做某事），直接造句：I look forward to seeing you.',
      why: '语言不是单词堆出来的，而是语块拼出来的。整块记忆符合大脑习惯，说和写都更自然，还能少出现中式英语。',
      tip: '每篇课文划出 5 个语块做成卡片，见到就念一遍。',
      variation: '从一单元课文里找出 5 个语块，各造一个句子。',
      pitfall: '只背单词不背搭配（知道 decide，却不知道 decide to do）；语块死记不造句。'
    },
    {
      id: 'entopic', subject: 'en', grade: '1-9 年级', tag: '学习方法·词汇',
      title: '主题单词本：一串一串记',
      brief: '背单词按主题分类：食物、学校、天气、运动……一个主题一串词，记起来有画面还互相关联。',
      how: ['选主题：比如本周学“食物”。', '列词：把学过和要学的食物词列出来。', '配图：画图或贴图，看图说词。', '串句：用一串主题词编小对话或小短文。', '复习：隔几天按主题整体过一遍。'],
      example: '“季节”主题：spring（春天）、warm（暖和）、flowers（花）一起记，再编句 Spring is warm, flowers are beautiful.',
      why: '大脑喜欢成串的记忆。主题词互相有联系，看到一个就想起一串，比按字母表背单词高效得多。',
      tip: '单词本按主题分页，每页配小图，考前整页复习。',
      variation: '整理“学校生活”主题的 10 个词，并用其中 5 个写 3 句话。',
      pitfall: '主题分类太随意，什么都混在一起；只列词不造句，记了不会用。'
    },
    {
      id: 'enspaced', subject: 'en', grade: '3-9 年级', tag: '学习方法·记忆',
      title: '间隔重复背单词',
      brief: '新学的单词一天内会忘掉大半，规律复习就能记住：当天复习，第 2 天、第 4 天、第 7 天再见一面。',
      how: ['第 1 次：新学 20 个词，认真记一遍。', '当天晚上：遮住中文自测一遍，错的做记号。', '第 2 天：先复习昨天的，再学新的。', '第 4、7 天：只复习错的和不熟的。', '已经会的，拉长到两周后再看。'],
      example: '周一学 20 词，周一晚、周二、周四、下周一各复习一次，到月底基本忘不掉。',
      why: '记忆像浇花：一次浇透不如定时浇。间隔重复顺着遗忘的节奏复习，用最少的时间把单词变成长期记忆。',
      tip: '不用追求一次记住；复习时“想不起来再看”，比反复读更有用。',
      variation: '给本周新学的 20 个词做一张 7 天复习计划表。',
      pitfall: '一天背 100 个新词，记不完还受打击；复习时又从头读一遍，没有重点。'
    },
    {
      id: 'enshadow', subject: 'en', grade: '4-9 年级', tag: '学习方法·听说',
      title: '影子跟读：耳朵和嘴一起练',
      brief: '播放一句英语，像影子一样紧跟着读出来，模仿它的语音、语调和停顿，练口音也练听力。',
      how: ['选材料：1 分钟以内的短文或课文录音，先听懂大意。', '第一遍：只听，不看文本。', '第二遍：看着文本跟读，可以放慢速度。', '第三遍：不看文本，跟着录音同步读。', '录音对比：录下自己的声音，和原声比差距。'],
      example: '跟读课本对话三天，每天 3 遍，就能明显感觉到连读和语调顺了。',
      why: '听和说共用一条神经通路：嘴跟上了，耳朵才更灵。影子跟读把听和说一次练到位。',
      tip: '先慢后快：跟不上就用慢速，熟练了再恢复正常速度。',
      variation: '选一段 30 秒录音，连续影子跟读 5 天，第 5 天录下来对比第 1 天。',
      pitfall: '材料太难，听不懂还硬跟；只跟读不对比，错误口音越练越熟。'
    },
    {
      id: 'enlisten5', subject: 'en', grade: '5-9 年级', tag: '学习方法·听力',
      title: '精听五步：一段听力听五遍',
      brief: '一段听力听五遍，每遍任务不同：抓大意、记关键词、逐句听写、对照原文、跟读模仿，20 分钟练透一段。',
      how: ['第一遍盲听：只听不写，说出一句话大意。', '第二遍记词：写下听到的关键词。', '第三遍听写：逐句暂停，把听到的写下来。', '第四遍对照：翻开原文，标出没听出的地方。', '第五遍跟读：对着原文模仿跟读两遍。'],
      example: '精听一段 1 分钟的天气预报，五遍后不仅能听懂，还能说出 sunny、windy 这些关键词的发音。',
      why: '泛听练感觉，精听练功力。五遍各有任务，把“听不懂”变成“哪里没听懂”，进步看得见。',
      tip: '没听出的句子单独多听 3 遍，再对照原文找原因：生词、连读还是语速。',
      variation: '用精听五步处理今天课本里的听力材料，记录每一遍的收获。',
      pitfall: '直接看原文再听，等于没练耳朵；听写太贪长，一次一句就够了。'
    },
    {
      id: 'enreadaloud', subject: 'en', grade: '1-9 年级', tag: '学习方法·语感',
      title: '滚动朗读：像滚雪球',
      brief: '每天把学过的课文、对话大声读几遍，今天读“今天+昨天”的，像滚雪球一样越滚越熟。',
      how: ['定时：每天 10 分钟，固定时间固定地点。', '滚动：今天读今天的，再快速过一遍昨天的。', '大声：读出声，不默读，嘴要动。', '录音自检：每周录一次，听发音和流利度。', '打卡：在日历上打勾，连续 21 天形成习惯。'],
      example: '周一读第 1 单元，周二第 1+2 单元，周三第 2+3 单元……周末整周过一遍。',
      why: '英语是口腔肌肉的记忆，读得多了，句子自然脱口而出。滚动复习让旧内容不丢，语感越滚越厚。',
      tip: '读的时候想着意思，别当念经；读错的词标出来，多读三遍。',
      variation: '坚持滚动朗读一周，录下第一天和第七天的朗读对比。',
      pitfall: '三天打鱼两天晒网；只读不背不默，流利但写不对。'
    },
    {
      id: 'enscene', subject: 'en', grade: '3-9 年级', tag: '学习方法·口语',
      title: '情景代入说英语',
      brief: '学一个句型就把它放进真实场景里练：问路、点餐、借东西，假装自己真的在说，句子就变成自己的了。',
      how: ['学句型：先把新句型读懂。', '想场景：什么情况下会用到它？', '角色扮演：一个人分饰两角，或和家长同学对话。', '换词练：把句型里的词换掉，造 3 个新句子。', '说出来：当天找机会真的说一次，哪怕自言自语。'],
      example: '学了 Can I have…? 就假装在食堂：Can I have some rice, please?',
      why: '语言是在用中学的。把句子放进场景，大脑记得住“什么时候说”，到真场合就不卡壳。',
      tip: '自己给自己演 1 分钟的英语小剧场；别怕错，敢说是第一步。',
      variation: '用 How much is…? 编一段在商店买东西的三句对话。',
      pitfall: '只抄句型不开口；场景太假，全是课本原文，换词太少。'
    },
    {
      id: 'enroot', subject: 'en', grade: '5-9 年级', tag: '学习方法·词汇',
      title: '词根词缀拆词法',
      brief: '很多单词是零件拼的：un-（不）+ happy（开心）= unhappy（不开心）。认识零件，一个顶十个。',
      how: ['拆：把生词拆成前缀、词根、后缀。', '认前缀：un-、im-、dis- 常表示“不、相反”。', '认后缀：-er（人）、-ful（充满…的）会改变词性。', '猜词义：把零件意思拼起来猜。', '验证：查词典确认，把拆法记在单词本上。'],
      example: 'careful（小心）= care（关心）+ ful（充满）；unusual（不寻常）= un（不）+ usual（寻常）。',
      why: '英语像中文的偏旁部首，词根词缀就是字的零件。掌握常见的几十个零件，遇到生词能猜个七八成，词汇量成串增长。',
      tip: '常见前缀后缀先记 10 个，做题猜词时先用上。',
      variation: '拆解并猜测：happy、unhappy、happiness 分别是什么意思，怎么拆的？',
      pitfall: '乱拆词，不是所有词都按规则拼；只记零件意思，不记整词用法。'
    }
  ],

};
