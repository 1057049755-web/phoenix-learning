/* ================= 凤凰花·智学 内置教学语料库 =================
 * 分类：ancient 古代教材 / modern 上世纪教材 / foreign 全球经典教材 / pedagogy 教育学与教师成长
 * 用途：AI 接入时按知识点/学科检索相关条目并注入提示词（检索增强），
 *       同时按所选“语气风格”约束表达，让内容更饱满、更有教育温度。
 * 说明：古代与民国文献多属公有领域；现代开放教材按各自许可证（CC BY / CC BY-SA /
 *       CC BY-NC-SA / CC BY 4.0）注明来源。本库条目为短摘录/概述，供教学研究展示，
 *       商用发布前请按各许可证完成合规（署名、共享、非商业等）。
 * “微调”在本原型中以“上下文注入式轻量适配”实现；真正参数微调（如 LoRA）
 * 需在服务端对开源模型进行，原型通过配置项保留该接口预留。
 */
(function () {
  'use strict';

  const styles = [
    {
      id: 'warm',
      name: '温和启发式',
      desc: '循循善诱、先肯定后引导（苏霍姆林斯基 / 叶圣陶 / 陶行知风）',
      prompt: '像苏霍姆林斯基、叶圣陶那样循循善诱：先用亲切的口吻肯定学生的努力，再用“想一想”“试试看”引导思考，最后用提问收尾。语言温暖、具体，不说教，多用生活化比喻。'
    },
    {
      id: 'rigor',
      name: '严谨规范式',
      desc: '术语精确、步骤完整（上世纪教材 / 苏联数学教材风）',
      prompt: '像经典严谨教材那样表述精确：先给定义或规则，再分步骤完整推导，步骤编号清晰，术语规范统一，不跳步、不含糊，适合需要打牢基础的学习者。'
    },
    {
      id: 'classical',
      name: '典雅文言式',
      desc: '言简意赅、文雅凝练（古代蒙学 / 经学教材风）',
      prompt: '像古代蒙学与经学教材那样言简意赅、文雅凝练：适当化用经典名句（如《论语》《朱子读书法》），善用对仗、韵律与警句，但须先解释清楚含义，古为今用。'
    },
    {
      id: 'lively',
      name: '活泼情境式',
      desc: '生活情境、具象到抽象、活泼启发式',
      prompt: '像经验丰富的启蒙老师那样活泼情境化：先给真实生活场景或小故事，再用图示/模型把问题具象化，最后过渡到抽象规则；多用短句和“你猜会发生什么”等互动语气。'
    },
    {
      id: 'academic',
      name: '专业学术式',
      desc: '概念准确、逻辑严密（教育理论 / 学习科学风）',
      prompt: '像教育理论著作与学习科学文献那样专业严谨：概念界定准确，逻辑层次清晰，可引用教育家观点或研究结论支撑建议（如最近发展区、形成性评价、间隔重复），并给出可操作的落地步骤。'
    }
  ];

  const entries = [
    /* ============ 古代教材 ============ */
    { id: 'g001', cat: 'ancient', title: '《三字经》', source: '宋·王应麟（传）', era: '宋代', license: '公有领域',
      tags: ['蒙学', '识字', '韵文', '德育', '诵读'],
      excerpt: '“人之初，性本善。性相近，习相远。”三字一句、押韵上口，把识字、常识与做人道理熔于一炉。',
      note: '可借鉴“三字韵文+故事化”的识字与德育结构：短句、押韵、重复，适合低年级诵读与启蒙。',
      styles: ['classical', 'warm'] },
    { id: 'g002', cat: 'ancient', title: '《千字文》', source: '南朝梁·周兴嗣', era: '南北朝', license: '公有领域',
      tags: ['蒙学', '识字', '韵文', '自然常识'],
      excerpt: '“天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。”一千个不重复汉字编成的韵文百科。',
      note: '可借鉴“用有限字量组织百科知识”的编排法：识字与自然、历史常识同步推进。',
      styles: ['classical'] },
    { id: 'g003', cat: 'ancient', title: '《百家姓》', source: '北宋初年编撰', era: '北宋', license: '公有领域',
      tags: ['蒙学', '识字', '姓氏文化'],
      excerpt: '“赵钱孙李，周吴郑王。”四字一句、按姓氏编排的识字课本。',
      note: '贴近儿童自身生活（自己的姓），可借鉴“从学生熟悉事物切入”的识字思路。',
      styles: ['classical', 'warm'] },
    { id: 'g004', cat: 'ancient', title: '《弟子规》', source: '清·李毓秀', era: '清代', license: '公有领域',
      tags: ['蒙学', '行为规范', '德育', '习惯养成'],
      excerpt: '“弟子规，圣人训。首孝悌，次谨信。”以三字句讲行为规范与待人接物。',
      note: '可借鉴“行为要求条目化+朗朗上口”的养成教育方式，但需结合现代价值观取舍。',
      styles: ['classical', 'warm'] },
    { id: 'g005', cat: 'ancient', title: '《声律启蒙》', source: '清·车万育', era: '清代', license: '公有领域',
      tags: ['对仗', '声律', '语文', '韵文'],
      excerpt: '“云对雨，雪对风，晚照对晴空。”训练对仗与音律的经典启蒙读物。',
      note: '可直接用于小学低年级语文学科的对仗、押韵与语感训练，是极好的写作入门语料。',
      styles: ['classical'] },
    { id: 'g006', cat: 'ancient', title: '《幼学琼林》', source: '明·程登吉（传）', era: '明代', license: '公有领域',
      tags: ['百科', '典故', '语文', '成语'],
      excerpt: '把天文地理、人事典故分门别类编成对句，是“浓缩的小百科”。',
      note: '可借鉴“分类编目+典故成句”的知识组织法，适合做语文积累与跨学科素材。',
      styles: ['classical', 'rigor'] },
    { id: 'g007', cat: 'ancient', title: '《论语》教育篇', source: '孔子及弟子', era: '春秋', license: '公有领域',
      tags: ['儒学', '学习方法', '启发式', '因材施教'],
      excerpt: '“学而不思则罔，思而不学则殆。”“不愤不启，不悱不发。”',
      note: '中国启发式教学与因材施教思想的源头：先让学生思考到“愤悱”状态再点拨。',
      styles: ['classical', 'academic', 'warm'] },
    { id: 'g008', cat: 'ancient', title: '《朱子读书法》', source: '南宋·朱熹', era: '南宋', license: '公有领域',
      tags: ['读书法', '学习策略', '语文', '循序渐进'],
      excerpt: '“循序渐进，熟读精思。”朱熹总结的读书六法，强调由浅入深、反复揣摩。',
      note: '可转化为现代学习策略：分步学习、间隔复习、深度思考，与学习科学“间隔重复”暗合。',
      styles: ['classical', 'academic'] },
    { id: 'g009', cat: 'ancient', title: '《教条示龙场诸生》', source: '明·王阳明', era: '明代', license: '公有领域',
      tags: ['立志', '德育', '心学', '勤学'],
      excerpt: '“志不立，天下无可成之事。”以“立志、勤学、改过、责善”四端教诸生。',
      note: '可借鉴“先立志再勤学”的动机教育结构，用于学习计划书与成长指导。',
      styles: ['classical', 'warm'] },

    /* ============ 上世纪教材 ============ */
    { id: 'm001', cat: 'modern', title: '《共和国教科书》', source: '商务印书馆（蒋维乔等编）', era: '1912（民国元年）', license: '公有领域',
      tags: ['民国教材', '国文', '公民教育', '图文并茂'],
      excerpt: '中国近代早期成套国文教科书，文白过渡期典范，重公民常识与道德养成，课文简短、图文相配。',
      note: '可借鉴“一课一事、短小精悍”的编排与公民素养立意。',
      styles: ['rigor', 'warm'] },
    { id: 'm002', cat: 'modern', title: '《开明国语课本》', source: '叶圣陶编、丰子恺绘，开明书店', era: '1932 初版', license: '公有领域（概述，未引原文）',
      tags: ['民国教材', '小学语文', '儿童文学', '插图', '口语化'],
      excerpt: '以儿童生活与兴趣为出发点，语句口语化、情景化，配丰子恺手绘插图，被视为民国小学国语教材的典范。',
      note: '可借鉴“从儿童视角选材+生活情境+插图辅助”的语文编写思路（本书文字仍在版权保护期，原型仅作概述）。',
      styles: ['warm', 'lively'] },
    { id: 'm003', cat: 'modern', title: '《开明英文读本》', source: '林语堂编，开明书店', era: '1930 年代', license: '公有领域（概述）',
      tags: ['英语', '民国教材', '语感', '情境'],
      excerpt: '林语堂以“学话”理念编英语课本，重视语感与实用情境，避免死记语法。',
      note: '可借鉴“语境优先、语感先于语法”的英语教学思路。',
      styles: ['lively', 'warm'] },
    { id: 'm004', cat: 'modern', title: '《小学算术教学大纲（草案）》', source: '人民教育出版社，受苏联教法影响', era: '1952', license: '公有领域（概述）',
      tags: ['数学', '大纲', '口算', '循序渐进'],
      excerpt: '口算与笔算并重、先易后难、重视算理与熟练度，确立了新中国小学数学的“双基”传统。',
      note: '“双基”传统至今仍有价值：基础概念 + 基本技能，先讲算理再练速度。',
      styles: ['rigor'] },
    { id: 'm005', cat: 'modern', title: '1950—1980 年代人教社小学数学课本', source: '人民教育出版社', era: '1950—1980', license: '公有领域（概述）',
      tags: ['数学', '口算', '算理', '应用题'],
      excerpt: '以“应用题+口算+竖式”为骨架，题目贴近生产生活，逐步递进，强调规范书写与验算习惯。',
      note: '可借鉴“生活应用题+规范步骤+验算习惯”的训练体系。',
      styles: ['rigor'] },
    { id: 'm006', cat: 'modern', title: '1980 年代人教社小学语文课本', source: '人民教育出版社', era: '1980 年代', license: '公有领域（概述）',
      tags: ['语文', '读写结合', '范文', '习惯'],
      excerpt: '课文文质兼美，读与写紧密结合，重视字词句段基础训练与良好学习习惯养成。',
      note: '可借鉴“以读促写、随文练笔”的语文教学结构。',
      styles: ['warm', 'rigor'] },
    { id: 'm007', cat: 'modern', title: '《文心》', source: '叶圣陶、夏丏尊合著，开明书店', era: '1934', license: '公有领域（概述）',
      tags: ['语文教育', '读写', '故事化', '国文'],
      excerpt: '用师生故事讲国文读写之法，把枯燥知识融进情节，是语文教育经典。',
      note: '可借鉴“知识故事化、任务情境化”的讲解方式，非常适合 AI 生成详解时使用。',
      styles: ['warm', 'lively'] },
    { id: 'm008', cat: 'modern', title: '清末民国《修身教科书》', source: '商务印书馆、中华书局等', era: '1900—1930', license: '公有领域（概述）',
      tags: ['德育', '民国教材', '故事化', '公民'],
      excerpt: '以短篇故事呈现孝亲、诚信、勤劳、公德等品质，每课配“问一问你”类小问题。',
      note: '可借鉴“故事+提问+自省”的德育设计，用于评语与成长建议。',
      styles: ['warm'] },

    /* ============ 全球经典教材 ============ */
    { id: 'f001', cat: 'foreign', title: 'Core Knowledge 核心知识序列', source: 'E.D. Hirsch Jr. 主持，美国', era: '1980 年代至今', license: 'CC BY-SA',
      tags: ['通识', '知识序列', '跨学科', '语言'],
      excerpt: '按年级给出“共享知识”序列：历史、地理、文学、艺术、科学逐年递进，语言与文化知识并重。',
      note: '可借鉴“跨年级知识地图”的课程组织方式，与平台“知识点图谱”思路高度一致。',
      styles: ['rigor', 'lively'] },
    { id: 'f002', cat: 'foreign', title: 'Singapore Math 新加坡数学', source: '新加坡教育部教材体系', era: '1980 年代至今', license: '教法公开、教材版权归新加坡（概述）',
      tags: ['数学', 'CPA', '模型图', '应用题', '概念理解'],
      excerpt: 'CPA 教学法：Concrete 具象 → Pictorial 图示 → Abstract 抽象；用条形模型图（bar model）解应用题。',
      note: '可借鉴“先具体后抽象+画模型图”的应用题讲解步骤，AI 详解可自动建议画图。',
      styles: ['lively', 'rigor'] },
    { id: 'f003', cat: 'foreign', title: 'Saxon Math（萨克森数学）', source: 'John Saxon，美国', era: '1980 年代', license: '商业教材（概述）',
      tags: ['数学', '螺旋', '重复练习', '增量'],
      excerpt: '“增量式开发+连续复习”：每课引入少量新内容，并反复回顾旧知识，形成螺旋巩固。',
      note: '可借鉴“小步增量+间隔复习”的练习设计，与错题本 1/3/7/15 天复习排期互补。',
      styles: ['rigor'] },
    { id: 'f004', cat: 'foreign', title: 'OpenStax 开放教材', source: '美国莱斯大学', era: '2012 至今', license: 'CC BY',
      tags: ['开放教材', '大学', '专家审校', '免费'],
      excerpt: '由学科专家撰写、同行审校的免费开放教材，覆盖大学基础课，可自由改编分发。',
      note: '可借鉴“专家审校+开放授权+可定制”的教材生产模式。',
      styles: ['academic', 'rigor'] },
    { id: 'f005', cat: 'foreign', title: 'CK-12 自适应学习平台', source: 'CK-12 Foundation，美国', era: '2007 至今', license: 'CC BY-NC-SA',
      tags: ['开放教材', '自适应', '可定制', 'FlexBook'],
      excerpt: 'FlexBook 允许教师按学情重组章节，配合自适应练习与可视化资源。',
      note: '可借鉴“按学情重组内容+自适应练习”的个性化路径设计。',
      styles: ['academic'] },
    { id: 'f006', cat: 'foreign', title: 'EngageNY / Eureka Math', source: '纽约州教育部 / Great Minds', era: '2012 至今', license: 'CC BY-NC-SA',
      tags: ['数学', '模块化', '配套练习', '课程标准'],
      excerpt: '模块化课程：每模块有明确主题、课时计划、课堂活动与配套练习，完整闭环。',
      note: '可借鉴“模块-课时-活动-练习”的整卷与课时设计结构。',
      styles: ['rigor'] },
    { id: 'f007', cat: 'foreign', title: 'Illustrative Mathematics', source: 'Illustrative Mathematics 组织，美国', era: '2011 至今', license: 'CC BY 4.0',
      tags: ['数学', '问题驱动', '任务设计', '开放性'],
      excerpt: '以“问题驱动的教学任务”为核心，强调开放性任务、讨论与建模，而非单纯刷题。',
      note: '可借鉴“任务式命题”：用情境化、多步骤、可讨论的问题替代机械题。',
      styles: ['lively', 'rigor'] },
    { id: 'f008', cat: 'foreign', title: '苏联柯尔莫哥洛夫中学数学教材', source: '苏联科学院院士柯尔莫哥洛夫主编', era: '1960—1970 年代', license: '历史教材（概述）',
      tags: ['数学', '公理化', '严谨', '抽象'],
      excerpt: '以公理化体系组织代数与几何，强调严谨证明与抽象能力，对世界数学教育影响深远。',
      note: '可借鉴“先严格定义、再逐步证明”的讲解路径，适合高中及以上深度解析。',
      styles: ['rigor', 'academic'] },
    { id: 'f009', cat: 'foreign', title: '日本中小学教材体系', source: '文部科学省审定制度', era: '二战后至今', license: '制度概述',
      tags: ['教材制度', '审定', '生活应用', '插图'],
      excerpt: '全国统一审定，插图精美、排版疏朗，重视生活应用与“思考题”设计。',
      note: '可借鉴“审定制+生活应用+视觉友好”的教材质量观。',
      styles: ['lively'] },

    /* ============ 教育学与教师成长 ============ */
    { id: 'p001', cat: 'pedagogy', title: '《大教学论》', source: '夸美纽斯（捷克）', era: '1632', license: '公有领域',
      tags: ['教学论', '班级授课', '直观教学', '教育艺术'],
      excerpt: '近代教育学奠基之作，提出班级授课制与直观教学原则，主张“把一切事物教给一切人”。',
      note: '可用于解释“为什么要分班授课、为什么要直观演示”，为教学设计提供理论支撑。',
      styles: ['academic'] },
    { id: 'p002', cat: 'pedagogy', title: '《爱弥儿》', source: '卢梭（法国）', era: '1762', license: '公有领域',
      tags: ['自然教育', '儿童本位', '发展阶段', '自由'],
      excerpt: '主张教育顺应儿童自然发展，按年龄阶段施教，反对拔苗助长。',
      note: '可借鉴“因龄施教、保护好奇心”的原则，用于分层作业与个性化建议。',
      styles: ['warm', 'academic'] },
    { id: 'p003', cat: 'pedagogy', title: '《民主主义与教育》', source: '杜威（美国）', era: '1916', license: '公有领域',
      tags: ['实用主义', '做中学', '生活教育', '经验'],
      excerpt: '“教育即生活、学校即社会、做中学”，强调经验与活动在学习中的作用。',
      note: '可借鉴“项目式/探究式”任务设计，让知识在真实活动中被使用。',
      styles: ['warm', 'lively'] },
    { id: 'p004', cat: 'pedagogy', title: '《给教师的建议》', source: '苏霍姆林斯基（苏联）', era: '1960—1970', license: '公有领域（中译本有版权，概述）',
      tags: ['教师成长', '后进生', '阅读', '爱'],
      excerpt: '100 条给教师的建议：关注后进生的“脑力劳动特点”，强调课外阅读与爱的教育。',
      note: '最适合作为 AI 生成评语与学习计划的“语气范本”：具体、真诚、不贴标签。',
      styles: ['warm'] },
    { id: 'p005', cat: 'pedagogy', title: '陶行知生活教育', source: '陶行知（中国）', era: '1920—1940', license: '公有领域（概述）',
      tags: ['生活教育', '教学做合一', '中国教育', '平民'],
      excerpt: '“生活即教育、社会即学校、教学做合一”，主张在做上教、做上学。',
      note: '可借鉴“真实任务+动手实践”的任务设计，让作业贴近生活。',
      styles: ['warm', 'lively'] },
    { id: 'p006', cat: 'pedagogy', title: '叶圣陶教育思想', source: '叶圣陶（中国）', era: '20 世纪', license: '公有领域（概述）',
      tags: ['语文教育', '自学', '习惯', '教是为了不教'],
      excerpt: '“教是为了达到不需要教”：重在培养自学能力与良好习惯。',
      note: '可借鉴“由扶到放”的支架式讲解：先示范、再半扶、最后放手。',
      styles: ['warm'] },
    { id: 'p007', cat: 'pedagogy', title: '布鲁姆教育目标分类', source: '布鲁姆（美国）', era: '1956（2001 修订）', license: '理论思想（概述）',
      tags: ['目标分类', '教学设计', '评价', '认知'],
      excerpt: '认知领域六级目标：识记 → 理解 → 应用 → 分析 → 评价 → 创造。',
      note: '可直接用于命题难度标注与整卷梯度设计：识记为易、应用分析为中、评价创造为难。',
      styles: ['academic', 'rigor'] },
    { id: 'p008', cat: 'pedagogy', title: '皮亚杰认知发展阶段', source: '皮亚杰（瑞士）', era: '20 世纪', license: '理论思想（概述）',
      tags: ['儿童心理', '发展阶段', '因龄施教'],
      excerpt: '感知运动（0-2）→ 前运算（2-7）→ 具体运算（7-11）→ 形式运算（11+）。',
      note: '解释“为什么小学要用具体教具、初中才能抽象推理”，支撑分年级命题。',
      styles: ['academic'] },
    { id: 'p009', cat: 'pedagogy', title: '维果茨基最近发展区', source: '维果茨基（苏联）', era: '1930 年代', license: '理论思想（概述）',
      tags: ['最近发展区', '脚手架', '建构', '合作'],
      excerpt: '学生“跳一跳够得着”的区域即最近发展区，教学应提供脚手架并在区内施教。',
      note: '可借鉴“难度略高于当前水平+提示支架”的分层设计，是 AI 生成变式题的依据。',
      styles: ['academic', 'warm'] },
    { id: 'p010', cat: 'pedagogy', title: '蒙台梭利教育法', source: '蒙台梭利（意大利）', era: '20 世纪初', license: '理论思想（概述）',
      tags: ['蒙台梭利', '感官', '自主', '环境'],
      excerpt: '“有准备的环境”+感官教具+自主选择，儿童在专注工作中自我建构。',
      note: '可借鉴“给选择、重操作、留白思考”的自主学习设计。',
      styles: ['warm', 'lively'] },
    { id: 'p011', cat: 'pedagogy', title: '《什么是教育》', source: '雅思贝尔斯（德国）', era: '1977', license: '公有领域（概述）',
      tags: ['教育哲学', '唤醒', '人文', '对话'],
      excerpt: '教育的本质是“唤醒”，是人与人的对话与精神交往，而非灌输。',
      note: '适合用在教育理念类文案与家长沟通话术中，让 AI 输出更有温度。',
      styles: ['warm', 'academic'] },
    { id: 'p012', cat: 'pedagogy', title: '学习科学：间隔重复与形成性评价', source: '艾宾浩斯 / SM-2 / Black & Wiliam', era: '1885 至今', license: '研究结论（概述）',
      tags: ['学习科学', '间隔重复', '形成性评价', '反馈', '记忆'],
      excerpt: '遗忘曲线表明分散练习优于集中练习；元分析显示及时的形成性评价与反馈能显著提升学业成就。',
      note: '直接支撑本平台的错题 1/3/7/15 天复习排期与“批改后反馈”设计。',
      styles: ['academic'] }
  ];

  /* ============ 公有领域阅读材料库（语文 / 英语） ============
   * 选材原则：作品已进入公有领域（版权保护期届满）或采用开放许可证；
   * 每篇附来源与许可说明，AI 改编后文末自动标注“有删改”。
   * 语文：现代散文/小说 + 古诗文；英语：伊索寓言、格林童话及 19 世纪经典（节选）。
   */
  const reading = [
    /* -------- 语文 · 现代文 -------- */
    { id: 'rz001', lang: 'zh', title: '从百草园到三味书屋（节选）', author: '鲁迅', era: '1928', license: '公有领域', source: '《朝花夕拾》',
      grade: '初中', theme: '童年与自然', mainIdea: '回忆百草园中的草木虫鸟与无限趣味，表达对童年自由生活的怀念。',
      passage: '不必说碧绿的菜畦，光滑的石井栏，高大的皂荚树，紫红的桑椹；也不必说鸣蝉在树叶里长吟，肥胖的黄蜂伏在菜花上，轻捷的叫天子忽然从草间直窜向云霄里去了。单是周围的短短的泥墙根一带，就有无限趣味。油蛉在这里低唱，蟋蟀们在这里弹琴。翻开断砖来，有时会遇见蜈蚣；还有斑蝥，倘若用手指按住它的脊梁，便会啪的一声，从后窍喷出一阵烟雾。' },
    { id: 'rz002', lang: 'zh', title: '背影（节选）', author: '朱自清', era: '1925', license: '公有领域', source: '《背影》',
      grade: '初中', theme: '亲情', mainIdea: '通过父亲为“我”买橘子时攀爬月台的背影，表现深沉的父爱与作者的感动。',
      passage: '我看见他戴着黑布小帽，穿着黑布大马褂，深青布棉袍，蹒跚地走到铁道边，慢慢探身下去，尚不大难。可是他穿过铁道，要爬上那边月台，就不容易了。他用两手攀着上面，两脚再向上缩；他肥胖的身子向左微倾，显出努力的样子。这时我看见他的背影，我的泪很快地流下来了。' },
    { id: 'rz003', lang: 'zh', title: '济南的冬天（节选）', author: '老舍', era: '1931', license: '公有领域', source: '《济南的冬天》',
      grade: '初中', theme: '自然景物', mainIdea: '描写济南冬天温晴的天气与秀美的小雪山景，抒发对济南冬天的喜爱。',
      passage: '对于一个在北平住惯的人，像我，冬天要是不刮风，便觉得是奇迹；济南的冬天是没有风声的。对于一个刚由伦敦回来的人，像我，冬天要能看得见日光，便觉得是怪事；济南的冬天是响晴的。最妙的是下点小雪呀。看吧，山上的矮松越发的青黑，树尖上顶着一髻儿白花，好像日本看护妇。山尖全白了，给蓝天镶上一道银边。' },
    { id: 'rz004', lang: 'zh', title: '荷塘月色（节选）', author: '朱自清', era: '1927', license: '公有领域', source: '《荷塘月色》',
      grade: '高中', theme: '景物与心境', mainIdea: '描写月下荷塘的静谧之美，寄托作者淡淡的喜悦与忧愁交织的心绪。',
      passage: '曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙。层层的叶子中间，零星地点缀着些白花，有袅娜地开着的，有羞涩地打着朵儿的；正如一粒粒的明珠，又如碧天里的星星，又如刚出浴的美人。微风过处，送来缕缕清香，仿佛远处高楼上渺茫的歌声似的。' },
    { id: 'rz005', lang: 'zh', title: '故乡（节选）', author: '鲁迅', era: '1921', license: '公有领域', source: '《故乡》',
      grade: '初中', theme: '乡土与变迁', mainIdea: '通过回故乡的见闻与闰土的变化，表达对故乡隔膜与变化的感慨。',
      passage: '我冒了严寒，回到相隔二千余里，别了二十余年的故乡去。时候既然是深冬，渐近故乡时，天气又阴晦了，冷风吹进船舱中，呜呜的响，从篷隙向外一望，苍黄的天底下，远近横着几个萧索的荒村，没有一些活气。我的心禁不住悲凉起来了。' },
    { id: 'rz006', lang: 'zh', title: '少年中国说（节选）', author: '梁启超', era: '1900', license: '公有领域', source: '《少年中国说》',
      grade: '初中', theme: '家国情怀', mainIdea: '以“少年”与“中国”的关系激励青年担当，句式排比、气势磅礴。',
      passage: '故今日之责任，不在他人，而全在我少年。少年智则国智，少年富则国富，少年强则国强，少年独立则国独立，少年自由则国自由，少年进步则国进步，少年胜于欧洲则国胜于欧洲，少年雄于地球则国雄于地球。红日初升，其道大光；河出伏流，一泻汪洋。' },
    { id: 'rz007', lang: 'zh', title: '乌篷船（节选）', author: '周作人', era: '1926', license: '公有领域', source: '《泽泻集》',
      grade: '高中', theme: '闲适与风物', mainIdea: '以书信口吻介绍故乡乌篷船与水上旅行的趣味，平淡从容中见乡土情味。',
      passage: '你坐在船上，应该是游山的态度，看看四周物色，随处可见的山，岸旁的乌桕，河边的红蓼和白苹，渔舍，各式各样的桥，困倦的时候睡在舱中拿出随笔来看，或者冲一碗清茶喝喝。夜间睡在舱中，听水声橹声，来往船只的招呼声，以及乡间的犬吠鸡鸣，也都很有意思。' },
    /* -------- 语文 · 古诗文 -------- */
    { id: 'gw001', lang: 'zh', title: '岳阳楼记（节选）', author: '范仲淹', era: '北宋', license: '公有领域', source: '《范文正公集》',
      grade: '初中', theme: '忧乐情怀', mainIdea: '先叙巴陵胜状，后发“先天下之忧而忧，后天下之乐而乐”之慨。',
      passage: '予观夫巴陵胜状，在洞庭一湖。衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。此则岳阳楼之大观也，前人之述备矣。然则北通巫峡，南极潇湘，迁客骚人，多会于此，览物之情，得无异乎？' },
    { id: 'gw002', lang: 'zh', title: '桃花源记（节选）', author: '陶渊明', era: '东晋', license: '公有领域', source: '《陶渊明集》',
      grade: '初中', theme: '理想社会', mainIdea: '以渔人奇遇展现世外桃源，寄托对安宁生活的向往。',
      passage: '晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。渔人甚异之，复前行，欲穷其林。林尽水源，便得一山，山有小口，仿佛若有光。便舍船，从口入。初极狭，才通人。复行数十步，豁然开朗。' },
    { id: 'gw003', lang: 'zh', title: '陋室铭', author: '刘禹锡', era: '唐代', license: '公有领域', source: '《全唐文》',
      grade: '初中', theme: '品德志趣', mainIdea: '借陋室之“德馨”表明安贫乐道、不慕荣利的高洁志趣。',
      passage: '山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？' },
    { id: 'gw004', lang: 'zh', title: '观沧海', author: '曹操', era: '东汉末年', license: '公有领域', source: '《乐府诗集》',
      grade: '初中', theme: '壮阔胸怀', mainIdea: '借沧海壮景抒写统一天下的雄心与博大胸襟。',
      passage: '东临碣石，以观沧海。水何澹澹，山岛竦峙。树木丛生，百草丰茂。秋风萧瑟，洪波涌起。日月之行，若出其中；星汉灿烂，若出其里。幸甚至哉，歌以咏志。' },
    /* -------- 英语 · 寓言与经典 -------- */
    { id: 'en001', lang: 'en', title: 'The Fox and the Grapes', author: 'Aesop', era: 'Ancient Greece（英译本公有领域）', license: '公有领域', source: "Aesop's Fables",
      grade: '小学高年级 / 初中', theme: '寓言 · 心态', mainIdea: 'A fox fails to reach grapes and declares them sour, teaching that people despise what they cannot get.',
      passage: "One hot summer's day a Fox was strolling through an orchard till he came to a bunch of Grapes just ripening on a vine which had been trained over a lofty branch. \"Just the thing to quench my thirst,\" quoth he. Drawing back a few paces, he took a run and a jump, and just missed the bunch. Turning round again with a One, Two, Three, he jumped up, but with no greater success. Again and again he tried after the tempting morsel, but at last had to give it up, and walked away with his nose in the air, saying: \"I am sure they are sour.\"" },
    { id: 'en002', lang: 'en', title: 'The Tortoise and the Hare', author: 'Aesop', era: 'Ancient Greece（英译本公有领域）', license: '公有领域', source: "Aesop's Fables",
      grade: '小学高年级 / 初中', theme: '寓言 · 坚持', mainIdea: 'Slow and steady wins the race; overconfidence leads to failure.',
      passage: "A Hare one day ridiculed the short feet and slow pace of the Tortoise, who replied, laughing: \"Though you be swift as the wind, I will beat you in a race.\" The Hare, deeming this almost impossible, agreed. At last the time for the race came. The Hare darted almost out of sight at once, but soon stopped and, to show his contempt for the Tortoise, lay down to have a nap. The Tortoise plodded on and plodded on, and when the Hare awoke from his nap, he saw the Tortoise just near the winning-post and could not run up in time to save the race." },
    { id: 'en003', lang: 'en', title: 'The Boy Who Cried Wolf', author: 'Aesop', era: 'Ancient Greece（英译本公有领域）', license: '公有领域', source: "Aesop's Fables",
      grade: '小学高年级 / 初中', theme: '寓言 · 诚信', mainIdea: 'A shepherd boy loses his flock because no one believes his repeated false alarms.',
      passage: "There was once a young Shepherd Boy who tended his sheep at the foot of a mountain near a dark forest. One day he thought he would have some fun at the expense of the villagers, so he cried out, \"Wolf! Wolf!\" The villagers came running to help him, but found no wolf. The boy laughed. A few days later he played the same trick, and again the villagers came to his aid and were disappointed. But shortly after this a Wolf really did come out of the forest. The Boy cried out, \"Wolf! Wolf!\" as loudly as he could, but the villagers, who had been fooled twice, stayed in their houses, and the Wolf made a good meal off the Boy's flock." },
    { id: 'en004', lang: 'en', title: 'The Wind and the Sun', author: 'Aesop', era: 'Ancient Greece（英译本公有领域）', license: '公有领域', source: "Aesop's Fables",
      grade: '小学高年级 / 初中', theme: '寓言 · 方法', mainIdea: 'Gentle persuasion is often more effective than force.',
      passage: "The North Wind and the Sun disputed as to which was the most powerful, and agreed that he should be declared the victor who could first strip a wayfaring man of his clothes. The North Wind first tried his power and blew with all his might, but the keener his blasts, the closer the Traveler wrapped his cloak around him. Then the Sun began to shine warmly, and the Traveler soon took off his cloak, and at last was glad to rest in the shade of a tree." },
    { id: 'en005', lang: 'en', title: 'Little Red Riding Hood（节选）', author: 'Grimm Brothers（英译本公有领域）', era: '1812', license: '公有领域', source: "Grimms' Fairy Tales",
      grade: '小学高年级 / 初中', theme: '童话 · 警惕', mainIdea: 'A girl who trusts a stranger in the woods learns a lesson about caution and obedience.',
      passage: "Once upon a time there was a sweet little village maiden who was loved by every one. Her grandmother gave her a little red riding hood, which became so becoming that she would never wear anything else, and so she was always called Little Red Riding Hood. One day her mother said to her: \"Go, my dear, and see how thy grand-mother is doing, for I hear she has been very ill.\" So Little Red Riding Hood set out, but on her way through the wood she met a Wolf, who asked her where she was going, and the innocent child told him all." },
    { id: 'en006', lang: 'en', title: 'Alice in Wonderland（节选）', author: 'Lewis Carroll', era: '1865', license: '公有领域', source: "Alice's Adventures in Wonderland",
      grade: '初中 / 高中', theme: '幻想 · 好奇', mainIdea: 'A bored girl follows a White Rabbit down a hole into a world of wonder.',
      passage: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, \"and what is the use of a book,\" thought Alice, \"without pictures or conversations?\" So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her." },
    { id: 'en007', lang: 'en', title: 'A Christmas Carol（节选）', author: 'Charles Dickens', era: '1843', license: '公有领域', source: "A Christmas Carol",
      grade: '高中', theme: '小说 · 救赎', mainIdea: 'The opening establishes the death of Marley and the cold-heartedness of Scrooge.',
      passage: "Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it: and Scrooge's name was good upon 'Change, for anything he chose to put his hand to. Old Marley was as dead as a door-nail. Mind! I don't mean to say that I know, of my own knowledge, what there is particularly dead about a door-nail. But old Marley was as dead as a door-nail." },
    { id: 'en008', lang: 'en', title: 'The Adventures of Tom Sawyer（节选）', author: 'Mark Twain', era: '1876', license: '公有领域', source: "The Adventures of Tom Sawyer",
      grade: '初中', theme: '小说 · 成长', mainIdea: 'A mischievous boy is called to attention by his aunt, opening a portrait of boyhood adventure.',
      passage: "\"Tom!\" No answer. \"Tom!\" No answer. \"What's gone with that boy, I wonder? You Tom!\" The old lady pulled her spectacles down and looked over them about the room; then she put them up and looked out under them. She seldom or never looked through them for so small a thing as a boy; they were her state pair, the pride of her heart. She said, \"Well, I lay if I get hold of you I'll—\" She did not finish, for by this time she was bending down and punching under the bed with the broom." },
    { id: 'en009', lang: 'en', title: 'The Gift of the Magi（节选）', author: 'O. Henry', era: '1905', license: '公有领域', source: "The Gift of the Magi",
      grade: '高中', theme: '小说 · 牺牲与爱', mainIdea: 'A poor young couple each sell their most precious possession to buy a gift for the other.',
      passage: "One dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies. Pennies saved one and two at a time by bulldozing the grocer and the vegetable man and the butcher until one's cheeks burned with the silent imputation of parsimony. Three times Della counted it. One dollar and eighty-seven cents. And the next day would be Christmas. There was clearly nothing to do but flop down on the shabby little couch and howl. So Della did." },
    { id: 'en010', lang: 'en', title: 'Treasure Island（节选）', author: 'Robert Louis Stevenson', era: '1883', license: '公有领域', source: "Treasure Island",
      grade: '初中 / 高中', theme: '冒险小说', mainIdea: "The narrator begins the account of the treasure hunt at his father's inn.",
      passage: "Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen in the year of grace 17—, and go back to the time when my father kept the Admiral Benbow inn, and the brown old seaman, with the sabre cut, first took up his lodging under our roof." }
  ];

  /* 体裁标注（内置材料） */
  const READING_GENRE = {
    rz001: '散文', rz002: '散文', rz003: '散文', rz004: '散文', rz005: '小说', rz006: '古文', rz007: '散文',
    gw001: '古文', gw002: '古文', gw003: '古文', gw004: '诗歌',
    en001: '寓言', en002: '寓言', en003: '寓言', en004: '寓言', en005: '童话', en006: '小说', en007: '小说', en008: '小说', en009: '小说', en010: '小说'
  };
  const readingTagged = reading.map(r => Object.assign({}, r, { genre: READING_GENRE[r.id] || '其他' }));

  /* ---------- 简体转换（常用字表，覆盖文言/散文高频繁体字） ---------- */
  const T2S_PAIRS =
    '見见 說说 話话 讀读 寫写 詩诗 詞词 書书 學学 習习 語语 國国 歲岁 長长 東东 風风 雲云 電电 氣气 樂乐 藝艺 門门 間间 問问 題题 類类 體体 級级 線线 組组 結结 經经 紀纪 紅红 綠绿 紙纸 網网 時时 從从 來来 這这 將将 還还 卻却 裡里 點点 嗎吗 沒没 讓让 請请 裏里 於于 後后 發发 髮发 隻只 幾几 個个 們们 與与 為为 會会 動动 對对 應应 開开 關关 飛飞 鳥鸟 魚鱼 馬马 車车 銀银 錢钱 買买 賣卖 貴贵 賤贱 價价 陽阳 陰阴 隨随 際际 離离 難难 雖虽 須须 頭头 顔颜 顧顾 願愿 額额 頂顶 項项 順顺 預预 頓顿 領领 頻频 顆颗 響响 鄉乡 醫医 釀酿 釋释 鐘钟 銅铜 鋼钢 錯错 録录 鍵键 閉闭 悶闷 聞闻 閱阅 閣阁 隊队 陣阵 陸陆 陳陈 險险 雙双 靈灵 靜静 霧雾 霞霞 韓韩 傑杰 備备 傳传 傷伤 儀仪 億亿 優优 償偿 內内 兩两 冊册 凍冻 淨净 減减 湊凑 準准 凜凛 憑凭 凱凯 劉刘 劍剑 勸劝 勵励 勞劳 勢势 務务 勝胜 勳勋 匯汇 華华 協协 單单 夢梦 奪夺 奮奋 婦妇 嬋婵 嬌娇 嬸婶 嬰婴 孫孙 寧宁 寶宝 導导 塵尘 壽寿 專专 尋寻 爾尔 層层 屆届 屬属 屢屡 嶼屿 嶺岭 巒峦 帥帅 師师 帶带 幫帮 幟帜 幹干 廈厦 廣广 廟庙 廢废 廬庐 廳厅 張张 彈弹 強强 歸归 當当 彙汇 徑径 復复 憶忆 懷怀 態态 懸悬 懼惧 戀恋 戰战 戶户 擔担 據据 擇择 擷撷 攜携 攝摄 攏拢 攣挛 敗败 敘叙 數数 敵敌 斷断 無无 齊齐 斂敛 樹树 橋桥 樓楼 樣样 機机 檢检 權权 歡欢 歐欧 殘残 殺杀 殼壳 毀毁 溝沟 漢汉 滿满 漁渔 濟济 瀟潇 灣湾 燈灯 燦灿 牆墙 犧牺 獲获 猶犹 獻献 環环 產产 療疗 癡痴 盡尽 監监 盤盘 禮礼 種种 稱称 穩稳 窮穷 竄窜 節节 範范 篤笃 簡简 糧粮 純纯 紛纷 維维 緒绪 縣县 總总 績绩 織织 繪绘 繡绣 繞绕 繼继 編编 義义 聯联 聰聪 聲声 職职 聽听 肅肃 膚肤 臉脸 臨临 舉举 舊旧 蓋盖 藍蓝 藥药 蟲虫 蟬蝉 術术 衛卫 裝装 補补 製制 複复 褲裤 覽览 親亲 觀观 覺觉 計计 記记 訂订 訊讯 設设 許许 訟讼 評评 誠诚 誕诞 誤误 誰谁 課课 論论 諾诺 講讲 謝谢 識识 譜谱 護护 變变 豐丰 貝贝 負负 財财 貢贡 貧贫 貨货 販贩 貫贯 責责 貯贮 貳贰 費费 賀贺 資资 賓宾 賜赐 賞赏 賠赔 賢贤 質质 賴赖 賺赚 購购 贈赠 贍赡 贏赢 趙赵 趨趋 躍跃 軌轨 軍军 軒轩 較较 載载 輔辅 輕轻 輩辈 輪轮 輯辑 辦办 辭辞 農农 迴回 運运 過过 達达 違违 遠远 適适 遲迟 遷迁 選选 遺遗 邏逻 鄒邹 鄧邓 郵邮 鄰邻 醜丑 鑑鉴 閩闽 階阶 隱隐 雜杂 雞鸡 鞏巩 頁页 頃顷 頒颁 頗颇 顯显 飯饭 飲饮 飾饰 飽饱 養养 館馆 駐驻 駛驶 騎骑 驗验 驚惊 鬥斗 鬧闹 魯鲁 鮮鲜 鳴鸣 鷗鸥 麗丽 麥麦 黨党 齋斋 龍龙 龜龟 龔龚 鐵铁 邊边 腳脚 縮缩 蹣蹒 跚跚 譯译 撥拨 撲扑 擁拥 擋挡 擲掷 擬拟 擾扰 攀攀 橋桥 機机 檢检 濟济 灣湾 燈灯 牆墙 犧牺 環环 產产 療疗 癡痴 監监 盤盘 禮礼 穩稳 窮穷 節节 範范 簡简 糧粮 純纯 織织 繪绘 繡绣 繞绕 繼继 編编 聯联 聰聪 聲声 職职 肅肃 膚肤 臉脸 臨临 舉举 舊旧 蓋盖 藍蓝 藥药 蟲虫 蟬蝉 術术 衛卫 裝装 補补 製制 複复 褲裤 覽览 親亲 觀观 覺觉 計计 記记 訂订 訊讯 設设 許许 訟讼 評评 誠诚 誕诞 誤误 誰谁 課课 論论 諾诺 講讲 謝谢 識识 譜谱 護护 變变 豐丰 貝贝 負负 財财 貢贡 貧贫 貨货 販贩 貫贯 責责 貯贮 貳贰 費费 賀贺 資资 賓宾 賜赐 賞赏 賠赔 賢贤 質质 賴赖 賺赚 購购 贈赠 贍赡 贏赢 趙赵 趨趋 躍跃 軌轨 軍军 軒轩 較较 載载 輔辅 輕轻 輩辈 輪轮 輯辑 辦办 辭辞 農农 迴回 運运 過过 達达 違违 遠远 適适 遲迟 遷迁 選选 遺遗 邏逻 鄒邹 鄧邓 郵邮 鄰邻 醜丑 鑑鉴 閩闽 階阶 隱隐 雜杂 雞鸡 鞏巩 頁页 頃顷 頒颁 頗颇 顯显 飯饭 飲饮 飾饰 飽饱 養养 館馆 駐驻 駛驶 騎骑 驗验 驚惊 鬥斗 鬧闹 魯鲁 鮮鲜 鳴鸣 鷗鸥 麗丽 麥麦 黨党 齋斋 龍龙 龜龟 龔龚';
  const t2s = {};
  T2S_PAIRS.trim().split(/\s+/).forEach(p => { if (p.length === 2) t2s[p[0]] = p[1]; });
  const T2S_PHRASES = {
    '戴著': '戴着', '穿著': '穿着', '隨著': '随着', '沿著': '沿着', '陪著': '陪着', '帶著': '带着',
    '披著': '披着', '拿著': '拿着', '看著': '看着', '聽著': '听着', '望著': '望着', '念著': '念着',
    '靠著': '靠着', '站著': '站着', '坐著': '坐着', '提著': '提着', '推著': '推着', '拉著': '拉着'
  };
  function convertZh(text) {
    let s = String(text || '');
    Object.keys(T2S_PHRASES).forEach(k => { s = s.split(k).join(T2S_PHRASES[k]); });
    return s.split('').map(ch => t2s[ch] || ch).join('');
  }

  /* ---------- 体裁自动识别 / 适合性筛选（小说/散文/诗歌/古文） ---------- */
  function classifyReading(text, lang) {
    const t = String(text || '').trim();
    if (lang === 'en') {
      const lines = t.split(/\n+/).map(s => s.trim()).filter(Boolean);
      const avgWords = t.split(/\s+/).length / Math.max(1, lines.length);
      const dialogue = /["“]|said|replied|cried|asked/.test(t);
      if (lines.length >= 2 && t.length >= 16 && avgWords <= 12) return { genre: '诗歌', ok: true };
      if (t.length < 20) return { genre: '其他', ok: false, reason: '文本过短，正文疑似缺失' };
      return { genre: dialogue ? '小说' : '散文', ok: true };
    }
    const lines = t.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const avgLen = t.length / Math.max(1, lines.length);
    if (lines.length >= 2 && t.length >= 16 && avgLen <= 16 && /[，。]/.test(t)) return { genre: '诗歌', ok: true };
    if (t.length < 20) return { genre: '其他', ok: false, reason: '文本过短，正文疑似缺失' };
    const wenyan = /[之乎者也焉哉兮欤矣夫其乃惟蓋故則既弗莫若曰]/.test(t);
    if (wenyan) return { genre: '古文', ok: true };
    if (/[“”]|他说|她说|心想|问道|答道/.test(t) && /他|她|我|他们/.test(t)) return { genre: '小说', ok: true };
    return { genre: '散文', ok: true };
  }

  const ALLOWED_ZH_GENRES = ['小说', '散文', '诗歌', '古文', '寓言', '童话'];
  function suitableReading(text, lang, opts) {
    opts = opts || {};
    const t = String(text || '').trim();
    const cls = classifyReading(t, lang);
    if (!cls.ok) return cls;
    if (/消歧义|維基文庫|MediaWiki|Special:|分类:|Template:|Help:/.test(t.slice(0, 120))) {
      return { genre: cls.genre, ok: false, reason: '疑似导航/消歧义页面，不适合作为正文' };
    }
    const allowed = opts.genres && opts.genres.length ? opts.genres : ALLOWED_ZH_GENRES;
    if (allowed.indexOf(cls.genre) < 0) {
      return { genre: cls.genre, ok: false, reason: '体裁为「' + cls.genre + '」，不在可选题材范围内' };
    }
    return { genre: cls.genre, ok: true };
  }

  /* ---------- 检索：按关键词/分类命中排序 ---------- */
  function retrieve(keywords, opts) {
    opts = opts || {};
    const cats = opts.cats && opts.cats.length ? opts.cats : ['ancient', 'modern', 'foreign', 'pedagogy'];
    const kw = String(keywords || '').split(/[\s,，、;；]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    let pool = entries.filter(e => cats.indexOf(e.cat) >= 0);
    if (!kw.length) {
      const perCat = Math.max(1, Math.ceil((opts.max || 6) / cats.length));
      const out = [];
      cats.forEach(c => {
        pool.filter(e => e.cat === c).slice(0, perCat).forEach(e => out.push(e));
      });
      return out.slice(0, opts.max || 6);
    }
    const scored = pool.map(e => {
      const text = (e.title + ' ' + e.source + ' ' + e.excerpt + ' ' + (e.tags || []).join(' ') + ' ' + e.note).toLowerCase();
      let score = 0;
      kw.forEach(k => { if (text.indexOf(k) >= 0) score += 2; });
      (e.tags || []).forEach(t => { if (kw.some(k => t.toLowerCase().indexOf(k) >= 0 || k.indexOf(t.toLowerCase()) >= 0)) score += 1; });
      return { e: e, score: score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    return scored.slice(0, opts.max || 6).map(x => x.e);
  }

  function stylePrompt(id) {
    const st = styles.find(s => s.id === id) || styles[0];
    return st.prompt;
  }

  /* ---------- 阅读材料选取（公有领域库） ---------- */
  function pickReading(lang, opts) {
    opts = opts || {};
    let pool = readingTagged.filter(r => r.lang === lang);
    if (!pool.length) pool = readingTagged;
    if (opts.kw) {
      const hit = pool.find(r => (r.title + r.theme + r.mainIdea).indexOf(String(opts.kw)) >= 0);
      if (hit) return hit;
    }
    const gradeOk = opts.diff === '难'
      ? r => /高中/.test(r.grade)
      : opts.diff === '易'
        ? r => /小学/.test(r.grade)
        : r => /初中/.test(r.grade);
    const g = pool.filter(gradeOk);
    const arr = g.length ? g : pool;
    return arr[(opts.seed || 0) % arr.length];
  }

  function styleName(id) {
    const st = styles.find(s => s.id === id);
    return st ? st.name : '';
  }

  /* ---------- 生成注入语料块（供 AI 提示词使用） ---------- */
  function corpusBlock(params) {
    params = params || {};
    const cfg = (window.AI && window.AI.getConfig()) || {};
    if (cfg.corpus === false) return '';
    const cats = (cfg.corpusCats && cfg.corpusCats.length) ? cfg.corpusCats : ['ancient', 'modern', 'foreign', 'pedagogy'];
    const hits = retrieve(params.kw, { cats: cats, max: params.max || 6 });
    if (!hits.length) return '';
    const lines = [];
    lines.push('【内置教学语料（检索命中，可吸收其理念与表达方式；不得照抄原文，引用须注明来源）】');
    hits.forEach(h => {
      const meta = [h.source, h.era].filter(Boolean).join('，');
      lines.push('- 《' + h.title + '》' + (meta ? '（' + meta + '）' : '') + '：' + h.excerpt);
    });
    const st = stylePrompt(cfg.style);
    if (st) lines.push('【语气风格】' + st);
    lines.push('请自然地吸收上述语料的表达风格与教育理念，使讲解更饱满、更有教育温度，同时保证知识准确、结构清晰。');
    return lines.join('\n');
  }

  window.CORPUS = {
    version: '1.0',
    styles: styles,
    entries: entries,
    reading: readingTagged,
    pickReading: pickReading,
    convertZh: convertZh,
    classifyReading: classifyReading,
    suitableReading: suitableReading,
    categories: [
      { id: 'ancient', name: '古代教材', desc: '蒙学、经学与儒家启蒙读物' },
      { id: 'modern', name: '上世纪教材', desc: '民国与建国后经典国文、算术、修身教材' },
      { id: 'foreign', name: '全球经典教材', desc: '全球经典与开放教材精选' },
      { id: 'pedagogy', name: '教育学与教师成长', desc: '中外教育家思想与学习科学研究' }
    ],
    retrieve: retrieve,
    stylePrompt: stylePrompt,
    styleName: styleName,
    corpusBlock: corpusBlock
  };
})();
