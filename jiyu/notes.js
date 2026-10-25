/* 技遇 · 产品手记 */
(function (root) {
  function icon(name) {
    return (root.SWAP_ICONS && root.SWAP_ICONS[name]) || '';
  }

  function bar(label, value, max) {
    const width = Math.round((value / max) * 100);
    return (
      '<div class="score-row">' +
        '<span class="score-label">' + label + '</span>' +
        '<span class="score-track"><i style="width:' + width + '%"></i></span>' +
        '<span class="score-value">' + value + '<small>/' + max + '</small></span>' +
      '</div>'
    );
  }

  root.renderNotes = function (opts) {
    const data = root.SWAP_DATA;
    const skill = root.SWAP_LOGIC.skillLabel;
    const me = opts.me;
    const samplePeer = opts.samplePeer;
    const sampleMatch = opts.sampleMatch;
    const stats = opts.stats;

    const sampleBars = sampleMatch.breakdown.map(function (item) {
      return bar(item.label, item.value, item.max);
    }).join('');

    return '' +
    '<div class="page page--notes">' +
      '<header class="notes-hero wrap">' +
        '<div class="notes-hero__copy">' +
          '<p class="kicker"><span class="kicker__dot"></span>FIELD NOTES / 产品手记</p>' +
          '<h1 class="display display--xl">把「想学」，<br />变成「学完」。</h1>' +
          '<p class="notes-hero__lede">技遇不是一门课，也不是一场随机的社交。它想回答一个更小的问题：当钱不是唯一的交换媒介，人能不能认真地向彼此学习？</p>' +
          '<div class="meta-row">' +
            '<span>产品概念 / 2026.10</span><span class="meta-dot"></span>' +
            '<span>双向技能互换平台</span><span class="meta-dot"></span>' +
            '<span>可交互原型</span>' +
          '</div>' +
        '</div>' +
        '<aside class="notes-hero__ticket" aria-label="产品一句话">' +
          '<span class="ticket-stub">ONE-LINER / 一句话</span>' +
          '<p>一个按「技能互补」匹配，以「时间」而非价格结算，用契约保证交付的一对一学习社区。</p>' +
          '<div class="notes-hero__stamp"><span>1h</span><small>= 1h</small></div>' +
        '</aside>' +
      '</header>' +

      '<div class="notes-shell wrap">' +
        '<aside class="notes-toc" aria-label="手记目录">' +
          '<p class="toc-title">目录 / INDEX</p>' +
          '<button type="button" data-action="scroll-to" data-target="note-guide"><span>00</span>评审导览</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-why"><span>01</span>为什么做这个</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-journey"><span>02</span>一段交换的旅程</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-match"><span>03</span>匹配如何发生</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-contract"><span>04</span>契约与信任</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-coins"><span>05</span>时间币与商业</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-risk"><span>06</span>风险与取舍</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-metrics"><span>07</span>指标与路线</button>' +
          '<button type="button" data-action="scroll-to" data-target="note-design"><span>08</span>视觉与边界</button>' +
        '</aside>' +

        '<article class="notes-body">' +
          '<section class="note-section note-section--first" id="note-guide">' +
            '<div class="note-heading">' +
              '<p class="kicker">00 / REVIEW GUIDE</p>' +
              '<h2>这是一份可点击的答卷。</h2>' +
              '<p class="note-lead">建议按下面的路径走一遍，比只看完首页更能感受到产品逻辑。所有数据仅存在你的浏览器，不会影响真实账户。</p>' +
            '</div>' +
            '<div class="review-guide">' +
              '<button type="button" class="review-step" data-action="open-edit-profile">' +
                '<span class="review-step__num">01</span>' +
                '<span class="review-step__body"><strong>换一张名片</strong><small>把「我能教 / 我想学」改成你的，看看匹配如何实时重排。</small></span>' +
                '<span class="review-step__arrow">' + icon('arrowUpRight') + '</span>' +
              '</button>' +
              '<button type="button" class="review-step" data-action="go-exchange" data-exchange-id="ex-ye">' +
                '<span class="review-step__num">02</span>' +
                '<span class="review-step__body"><strong>回应一份提案</strong><small>打开阿野发来的「摄影 ⇄ 西语」交换，阅读契约并接受。</small></span>' +
                '<span class="review-step__arrow">' + icon('arrowUpRight') + '</span>' +
              '</button>' +
              '<button type="button" class="review-step" data-action="go-exchange" data-exchange-id="ex-zhe">' +
                '<span class="review-step__num">03</span>' +
                '<span class="review-step__body"><strong>完成一节课</strong><small>在阿哲的交换里记录本节，再试试最后给彼此盖个章。</small></span>' +
                '<span class="review-step__arrow">' + icon('arrowUpRight') + '</span>' +
              '</button>' +
              '<button type="button" class="review-step" data-action="open-peer" data-peer-id="chengzi">' +
                '<span class="review-step__num">04</span>' +
                '<span class="review-step__body"><strong>用时间币换课</strong><small>橙子没有你想学的回礼，但你仍可以用存下的时间币找她学西语。</small></span>' +
                '<span class="review-step__arrow">' + icon('arrowUpRight') + '</span>' +
              '</button>' +
            '</div>' +
            '<p class="note-caption">当前演示名片：' + me.name + '，可教 ' + me.teaches.length + ' 项、想学 ' + me.wants.length + ' 项；系统找到了 ' + stats.swap + ' 个双向匹配与 ' + (stats.teach + stats.learn) + ' 个单向可能。</p>' +
          '</section>' +

          '<section class="note-section" id="note-why">' +
            '<div class="note-heading">' +
              '<p class="kicker">01 / WHY</p>' +
              '<h2>兴趣从来不缺入口，缺的是一条能走完的路。</h2>' +
              '<p class="note-lead">从「想学吉他」到「真的会弹一首歌」，中间隔着的不只是学费。我把它拆成三个具体的摩擦，也决定了产品不从「卖课」开始。</p>' +
            '</div>' +
            '<div class="observation-grid">' +
              '<article class="note-card">' +
                '<span class="note-card__index">A</span>' +
                '<h3>试一试的成本太高</h3>' +
                '<p>报班通常是预付一整个周期，还要配合固定地点与时间。对一门尚未确认的兴趣来说，这个决定太重了。</p>' +
              '</article>' +
              '<article class="note-card">' +
                '<span class="note-card__index">B</span>' +
                '<h3>自学输在反馈和节奏</h3>' +
                '<p>教程到处都是，真正稀缺的是有人看你的作业、告诉你下一步做什么，以及在你想放弃时约好下一次见面。</p>' +
              '</article>' +
              '<article class="note-card">' +
                '<span class="note-card__index">C</span>' +
                '<h3>会的人缺一个开口的入口</h3>' +
                '<p>很多人愿意分享，却不知道教谁、怎么定价、如何承诺交付。技能在简历里，变成一个可交换的资产却很难。</p>' +
              '</article>' +
            '</div>' +
            '<div class="split-note">' +
              '<div>' +
                '<p class="mini-label">THE SHIFT / 机会</p>' +
                '<p class="split-note__statement">让同一个人，同时成为供给与需求。</p>' +
              '</div>' +
              '<p>学习者不必先付费，教的人也不必先成为「老师」。当每个用户都带着一项能教的技能进来，供给的冷启动成本被压到最低；「我也能教点什么」本身，就是一次重新确认自我价值的过程。</p>' +
            '</div>' +
            '<div class="non-goals">' +
              '<span class="mini-label">NOT THIS / 明确不做</span>' +
              '<div class="non-goals__items">' +
                '<span>不是课程超市：不追求 SKU 数量，也不做录播课。</span>' +
                '<span>不是交友软件：匹配的目的是完成学习，而不是无限聊天。</span>' +
                '<span>不是低价家教：不用竞价压低技能的价格，1 小时就是 1 小时。</span>' +
                '<span>不是打卡社区：不需要用连续签到制造焦虑，只记录真实完成。</span>' +
              '</div>' +
            '</div>' +
            '<div class="persona-row">' +
              '<article class="persona">' +
                '<span class="persona__tag">P1 / 想学但难坚持</span>' +
                '<h3>「收藏夹里有一百个教程，一个都没打开。」</h3>' +
                '<p>城市里的年轻职场人，兴趣广、时间碎。需要低门槛的试学、明确的作业和固定节奏。</p>' +
              '</article>' +
              '<article class="persona">' +
                '<span class="persona__tag">P2 / 有技能缺场景</span>' +
                '<h3>「我会，但没人问过我。」</h3>' +
                '<p>设计师、摄影师、乐手、咖啡师等创作者。愿意分享，却不想马上开课招生，需要轻量的被看见。</p>' +
              '</article>' +
              '<article class="persona">' +
                '<span class="persona__tag">P3 / 预算有限的在校生</span>' +
                '<h3>「想学，但真的付不起。」</h3>' +
                '<p>有时间、有学习动力，也有自己的技能可以拿出来交换。对他们来说，时间比现金更宽裕。</p>' +
              '</article>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-journey">' +
            '<div class="note-heading">' +
              '<p class="kicker">02 / JOURNEY</p>' +
              '<h2>不是「买了课」，而是「签下一段小关系」。</h2>' +
              '<p class="note-lead">每一段交换都从一个明确的目标开始，以一次互通的作品或录音结束。平台只做三件事：让彼此被看见、把约定说清楚、让过程有记录。</p>' +
            '</div>' +
            '<div class="journey">' +
              '<div class="journey-step"><span>01</span><strong>写名片</strong><p>我能教、我想学，以及我想学到什么程度。</p></div>' +
              '<div class="journey-step"><span>02</span><strong>看互补</strong><p>先看双向关系，再看时间、形式与信用。</p></div>' +
              '<div class="journey-step"><span>03</span><strong>发提案</strong><p>把模糊的「想学」写成可验收的目标。</p></div>' +
              '<div class="journey-step"><span>04</span><strong>签契约</strong><p>课时、形式、改期规则与退出方式一次说清。</p></div>' +
              '<div class="journey-step"><span>05</span><strong>上一节课</strong><p>双方各教一次，留出作业，约定下一次。</p></div>' +
              '<div class="journey-step"><span>06</span><strong>做复盘</strong><p>每节记录收获；结束时交一份可展示的成果。</p></div>' +
              '<div class="journey-step"><span>07</span><strong>互相盖章</strong><p>评价进入信用档案，也可以开始下一段交换。</p></div>' +
            '</div>' +
            '<div class="callout callout--ink">' +
              '<div>' +
                '<p class="mini-label">NORTH STAR BEHAVIOUR / 核心行为</p>' +
                '<p class="callout__statement">双方各完成至少 1 小时教学，并留下一次双向评价。</p>' +
              '</div>' +
              '<p>只有「发出提案」而不完成交换，对双方都没有价值。因此产品的工作台不展示聊天总数，只突出下一节课与下一步动作：接受、赴约、打卡、互评。</p>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-match">' +
            '<div class="note-heading">' +
              '<p class="kicker">03 / MATCHING</p>' +
              '<h2>匹配不是猜你喜欢，是算清「能不能换得成」。</h2>' +
              '<p class="note-lead">推荐算法常见的错误，是让人越刷越多。交换需要的是少而准：先过硬条件，再解释这份互补从何而来，最后给一个行动入口。</p>' +
            '</div>' +
            '<div class="match-equation">' +
              '<div class="equation-top">' +
                '<span class="mini-label">MATCH SCORE / 匹配分</span>' +
                '<span class="equation-note">仅用于双向互补的人之间排序</span>' +
              '</div>' +
              '<div class="equation">' +
                '<span class="equation-part"><b>80</b><small>双向互补</small></span>' +
                '<span class="equation-op">+</span>' +
                '<span class="equation-part"><b>8</b><small>时间与形式</small></span>' +
                '<span class="equation-op">+</span>' +
                '<span class="equation-part"><b>4</b><small>资料认证</small></span>' +
                '<span class="equation-op">+</span>' +
                '<span class="equation-part"><b>8</b><small>信用印记</small></span>' +
              '</div>' +
              '<div class="equation-rules">' +
                '<p><span>硬条件</span>城市 / 线上可行性；至少一边能教、一边想学。</p>' +
                '<p><span>软条件</span>可用时间段、线上或线下偏好、认证与履约记录。</p>' +
                '<p><span>解释先行</span>每张卡片都写清「你教什么、TA 教你什么」，不做黑箱推荐。</p>' +
              '</div>' +
            '</div>' +
            '<div class="match-explain-grid">' +
              '<div class="match-sample">' +
                '<div class="match-sample__head">' +
                  '<div class="match-sample__who">' +
                    '<span class="avatar avatar--sm" style="--avatar-bg:' + samplePeer.avatarBg + ';--avatar-color:' + samplePeer.avatarColor + '">' + samplePeer.initials + '</span>' +
                    '<div><strong>' + samplePeer.name + '</strong><small>' + samplePeer.role + ' · ' + samplePeer.city + '</small></div>' +
                  '</div>' +
                  '<span class="match-sample__score">' + (sampleMatch.score || '—') + '<small>%</small></span>' +
                '</div>' +
                '<div class="match-sample__route">' +
                  '<span>你教 TA <b>' + sampleMatch.iTeachLabels.join('、') + '</b></span>' +
                  '<span class="match-route-arrow">' + icon('swap') + '</span>' +
                  '<span>TA 教你 <b>' + sampleMatch.theyTeachLabels.join('、') + '</b></span>' +
                '</div>' +
                '<div class="score-bars">' + sampleBars + '</div>' +
                '<p class="match-sample__foot">示例：' + me.name + ' × ' + samplePeer.name + '。换一张技能名片，这个分数会重新计算。</p>' +
              '</div>' +
              '<div class="match-principles">' +
                '<article><span>01</span><h3>先给出理由</h3><p>用户不应该猜「为什么推荐 TA」。把互补的两端直接写在卡片上，分数才有意义。</p></article>' +
                '<article><span>02</span><h3>不制造缺货感</h3><p>不用「限时」「仅剩」催促。好的交换关系需要双方都在准备好时发生。</p></article>' +
                '<article><span>03</span><h3>允许错位存在</h3><p>没有直接互惠的人，不是无效用户。时间币让单边需求也有路径，保留供给的多样性。</p></article>' +
              '</div>' +
            '</div>' +
            '<div class="callout">' +
              '<p><strong>一个刻意的取舍：</strong>我们不把评分当作人格评分。它只衡量「这次交换是否容易发生」。低分不意味着人不好，只意味着时间、目标或边界尚不合拍。</p>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-contract">' +
            '<div class="note-heading">' +
              '<p class="kicker">04 / CONTRACT & TRUST</p>' +
              '<h2>把「有空再约」，变成一份可以执行的小契约。</h2>' +
              '<p class="note-lead">技能交换最常见的失败，不是教得不好，而是双方对「交换什么、做到什么程度、什么时候结束」没有共识。契约是产品，不是法律文件。</p>' +
            '</div>' +
            '<div class="trust-grid">' +
              '<article class="trust-card">' +
                '<p class="mini-label">BEFORE / 课前</p>' +
                '<h3>三件事必须写清楚</h3>' +
                '<ul class="check-list">' +
                  '<li><span>' + icon('check') + '</span>双方各想学到什么，用一个可展示的成果描述。</li>' +
                  '<li><span>' + icon('check') + '</span>总次数、每次时长、线上或线下、大致周期。</li>' +
                  '<li><span>' + icon('check') + '</span>如何改期、什么情况可以结束，不用靠默契猜。</li>' +
                '</ul>' +
              '</article>' +
              '<article class="trust-card">' +
                '<p class="mini-label">DURING / 课中</p>' +
                '<h3>只推进下一节课</h3>' +
                '<ul class="check-list">' +
                  '<li><span>' + icon('check') + '</span>每节留下一个动作：作业、练习或一件待拍的作品。</li>' +
                  '<li><span>' + icon('check') + '</span>下一次时间当场约定，不让「回头再说」发生。</li>' +
                  '<li><span>' + icon('check') + '</span>打卡只记录完成，不制造连续天数焦虑。</li>' +
                '</ul>' +
              '</article>' +
              '<article class="trust-card">' +
                '<p class="mini-label">AFTER / 课后</p>' +
                '<h3>信用来自完成</h3>' +
                '<ul class="check-list">' +
                  '<li><span>' + icon('check') + '</span>双向评价，双方都提交后才公开，减少报复性打分。</li>' +
                  '<li><span>' + icon('check') + '</span>「守约印章」与完成次数比自我介绍更有说服力。</li>' +
                  '<li><span>' + icon('check') + '</span>不公开精确住址；线下首次交换建议在公共场所。</li>' +
                '</ul>' +
              '</article>' +
            '</div>' +
            '<div class="safety-strip">' +
              '<span class="safety-strip__icon">' + icon('shield') + '</span>' +
              '<p><strong>安全是不可外包的底线。</strong>实名与作品认证只降低风险，不替代判断。平台内聊天保留上下文、提供举报与拉黑；线下信息只在双方确认交换后展示到商圈级别。</p>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-coins">' +
            '<div class="note-heading">' +
              '<p class="kicker">05 / TIME BANK</p>' +
              '<h2>当交换错位时，时间先替你记住这笔账。</h2>' +
              '<p class="note-lead">如果我很会摄影，但想学的人没有我感兴趣的技能，交换就会卡住。时间币不是货币，它是一个让善意可以延后兑现的记账单位。</p>' +
            '</div>' +
            '<div class="timebank-grid">' +
              '<div class="timebank-rules">' +
                '<div class="rule"><span>+1 h</span><p>教别人 1 小时，存入 1 时间币</p></div>' +
                '<div class="rule"><span>−1 h</span><p>向别人学 1 小时，支出 1 时间币</p></div>' +
                '<div class="rule"><span>6 h</span><p>新用户获得 6 小时体验额度</p></div>' +
                '<div class="rule"><span>0</span><p>双向互换不扣币；不可购买、提现或转让</p></div>' +
              '</div>' +
              '<div class="business-note">' +
                '<p class="mini-label">BUSINESS HYPOTHESIS / 商业假设</p>' +
                '<h3>不向一次真诚的交换抽佣。</h3>' +
                '<p>基础的双向匹配、契约与互评永久免费。收入可以来自不破坏互换公平性的增值层：</p>' +
                '<ul>' +
                  '<li><strong>交换 Pro：</strong>更细的筛选、日历同步、可分享的作品页；按月订阅。</li>' +
                  '<li><strong>交换局：</strong>品牌或空间赞助的主题线下活动，按场次收费。</li>' +
                  '<li><strong>团队版：</strong>为创意团队设计内部技能交换计划，按席位收费。</li>' +
                '</ul>' +
                '<p class="note-caption">以上均为待验证的商业假设，不是已实现的收费功能。</p>' +
              '</div>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-risk">' +
            '<div class="note-heading">' +
              '<p class="kicker">06 / RISKS</p>' +
              '<h2>每一个好机制，都会带来新的坏情况。</h2>' +
              '<p class="note-lead">技能互换同时涉及供需、线下安全与教学质量。以下是我在设计时主动接受的取舍，以及下一步要验证的问题。</p>' +
            '</div>' +
            '<div class="risk-table">' +
              '<div class="risk-row risk-row--head"><span>风险</span><span>为什么会出现</span><span>当前策略</span><span>还需验证</span></div>' +
              '<div class="risk-row"><span><strong>热门技能挤爆，冷门技能没人</strong></span><span>摄影、剪辑天然比陶艺、打鼓更受关注</span><span>时间币 + 三角交换提案 + 主题交换局</span><span>是否愿意为「冷门但想学」支付更高时间币</span></div>' +
              '<div class="risk-row"><span><strong>教得好不等于会教</strong></span><span>能力、表达与耐心是三件不同的事</span><span>作品认证、试学一节、双向评价</span><span>是否需要轻量的教学能力认证</span></div>' +
              '<div class="risk-row"><span><strong>线下见面的安全成本</strong></span><span>陌生人、私人空间与时间不确定性</span><span>实名、公共空间指引、双向确认与举报</span><span>女性用户的实际安全感与留存</span></div>' +
              '<div class="risk-row"><span><strong>免费机制被爽约消耗</strong></span><span>没有预付款，失约成本看似更低</span><span>守约印章、两次爽约降权、时间币冻结</span><span>信用门槛是否足以替代押金</span></div>' +
              '<div class="risk-row"><span><strong>匹配成功但学不完</strong></span><span>兴趣衰减，或双方节奏不同</span><span>契约周期短、每节推进、可体面结束</span><span>「结束」是否也能留下正向信用</span></div>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-metrics">' +
            '<div class="note-heading">' +
              '<p class="kicker">07 / METRICS & ROADMAP</p>' +
              '<h2>先看完成，再看增长。</h2>' +
              '<p class="note-lead">如果只看注册与匹配次数，会奖励「刷」而不是「学」。北极星指标定为每月完成的双向交换节数——它同时要求供给、匹配与履约都成立。</p>' +
            '</div>' +
            '<div class="metric-grid">' +
              '<article><span>NORTH STAR</span><strong>每月完成的双向交换节数</strong><p>每节 = 双方各完成 1 小时教学或学习。</p></article>' +
              '<article><span>ACTIVATION</span><strong>7 天内发出第一份提案的新用户</strong><p>验证名片与匹配是否足够清楚。</p></article>' +
              '<article><span>QUALITY</span><strong>交换完成率 / 双向互评率</strong><p>避免只成交、不交付。</p></article>' +
              '<article><span>HEALTH</span><strong>每项需求的可匹配供给数</strong><p>监控热门与冷门技能的供需失衡。</p></article>' +
            '</div>' +
            '<div class="roadmap">' +
              '<article class="roadmap-card roadmap-card--now">' +
                '<span class="mini-label">NOW / 原型已呈现</span>' +
                '<h3>跑通一次完整交换</h3>' +
                '<ul><li>技能名片与实时匹配</li><li>三档提案与契约确认</li><li>课程记录、时间币与互评</li></ul>' +
              '</article>' +
              '<article class="roadmap-card">' +
                '<span class="mini-label">NEXT / 下一版</span>' +
                '<h3>让履约更轻</h3>' +
                '<ul><li>日历同步与课前提醒</li><li>作品集与教学样本认证</li><li>改期、缺席与冷却机制</li></ul>' +
              '</article>' +
              '<article class="roadmap-card">' +
                '<span class="mini-label">LATER / 更远</span>' +
                '<h3>从一对一，到一座城市的交换网络</h3>' +
                '<ul><li>三角交换与多人交换局</li><li>校园 / 创意园区大使计划</li><li>可携带的技能护照</li></ul>' +
              '</article>' +
            '</div>' +
          '</section>' +

          '<section class="note-section" id="note-design">' +
            '<div class="note-heading">' +
              '<p class="kicker">08 / DESIGN NOTES & BOUNDARIES</p>' +
              '<h2>像一本交换手帐，不像一个课程货架。</h2>' +
              '<p class="note-lead">技能交换的核心是人与人之间的承诺，而不是商品陈列。视觉上选择暖纸色、宋体标题、等宽标签、打孔票根和橡皮章，都是为了让「凭证感」先于「交易感」出现。</p>' +
            '</div>' +
            '<div class="design-grid">' +
              '<div class="design-colors">' +
                '<p class="mini-label">PALETTE / 纸张与印泥</p>' +
                '<div class="swatches">' +
                  '<span style="--swatch:#F4EFE4"><i></i>纸白 #F4EFE4</span>' +
                  '<span style="--swatch:#1F1B14"><i></i>墨黑 #1F1B14</span>' +
                  '<span style="--swatch:#E85B2A"><i></i>朱砂 #E85B2A</span>' +
                  '<span style="--swatch:#2D4B8E"><i></i>靛蓝 #2D4B8E</span>' +
                  '<span style="--swatch:#6E8061"><i></i>草绿 #6E8061</span>' +
                '</div>' +
                '<p class="note-caption">一套颜色承担语义：朱砂用于需要你行动的下一步；靛蓝用于「我」；草绿用于信用与完成。</p>' +
              '</div>' +
              '<div class="design-type">' +
                '<p class="mini-label">TYPE / 三种声音</p>' +
                '<p class="type-sample type-sample--serif">用你会的，换你想学的。</p>' +
                '<p class="type-sample type-sample--sans">正文把话说清楚，不写「赋能」「闭环」。</p>' +
                '<p class="type-sample type-sample--mono">VOUCHER NO. 0117 / 1H = 1H</p>' +
                '<p class="note-caption">标题用宋体建立叙述感；正文用系统无衬线保证阅读；标签用等宽字体，像票据上的编号。所有颜色对比度按正文可读性检查。</p>' +
              '</div>' +
            '</div>' +
            '<div class="principles-grid">' +
              '<article><span>' + icon('ticket') + '</span><h3>每个动作都像在「盖章」</h3><p>匹配是一枚印章，契约是一张票根，互评是最后一次盖章。交互反馈沿用这套隐喻，不用泛化的成功弹窗。</p></article>' +
              '<article><span>' + icon('lock') + '</span><h3>不制造虚假的实时感</h3><p>原型不使用假倒计时或自动回复冒充真人。待回应就是待回应，演示数据在页脚明确标注。</p></article>' +
              '<article><span>' + icon('users') + '</span><h3>移动端优先的赴约场景</h3><p>工作台在手机上先露出「下一节课」与「接受 / 完成」动作；复杂筛选收进横向滚动的控件。</p></article>' +
              '<article><span>' + icon('leaf') + '</span><h3>为减少而设计</h3><p>首页只推荐少量高互补关系。比起让你一直刷，更希望你在今晚就约出第一节课。</p></article>' +
            '</div>' +
            '<div class="boundary-card">' +
              '<p class="mini-label">SCOPE / 作品边界</p>' +
              '<h3>这是一个产品设计与前端原型，不是已上线的服务平台。</h3>' +
              '<p>页面中的人物、评价、交换记录与社区数据均为虚构，用于演示产品结构与交互。名片编辑和交换状态保存在本机浏览器，清除数据或更换设备后会恢复初始示例；没有后端账户、支付、消息推送或真实匹配服务。正式产品还需要完整的身份认证、内容审核、数据合规与线下安全机制。</p>' +
              '<p class="note-caption">设计、文案与前端实现：本次作品。生成式插画仅用于氛围表达。</p>' +
            '</div>' +
          '</section>' +

          '<div class="notes-closing">' +
            '<p class="kicker">THE END / 但交换才刚开始</p>' +
            '<h2>最好的匹配，<br />是你今晚就想去见的那个人。</h2>' +
            '<div class="button-row">' +
              '<button type="button" class="btn btn--primary" data-action="go-home-discover">回到匹配广场' + icon('arrowRight') + '</button>' +
              '<button type="button" class="btn btn--ghost" data-action="open-edit-profile">先换一张我的名片</button>' +
            '</div>' +
          '</div>' +
        '</article>' +
      '</div>' +
    '</div>';
  };
})(globalThis);
