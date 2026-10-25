/* 技遇 · 匹配与展示逻辑（可在浏览器与 Node 中复用） */
(function (root) {
  const DATA = root.SWAP_DATA;
  const skillMap = {};
  const categoryMap = {};
  DATA.skills.forEach(function (skill) { skillMap[skill.id] = skill; });
  DATA.categories.forEach(function (category) { categoryMap[category.id] = category; });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value) {
    return Math.round(value);
  }

  function skill(id) {
    return skillMap[id] || { id: id, label: id, category: 'all' };
  }

  function skillLabel(id) {
    return skill(id).label;
  }

  function skillCategory(id) {
    return skill(id).category;
  }

  function category(id) {
    return categoryMap[id] || categoryMap.all;
  }

  function labels(ids) {
    return ids.map(skillLabel);
  }

  function wantsIds(me) {
    return me.wants.map(function (item) { return item.skill; });
  }

  function teachIds(person) {
    return person.teaches.map(function (item) { return item.skill; });
  }

  function unique(list) {
    return list.filter(function (item, index) { return list.indexOf(item) === index; });
  }

  function intersection(a, b) {
    return a.filter(function (item) { return b.indexOf(item) !== -1; });
  }

  function computeMatch(me, peer) {
    const myTeachingIds = teachIds(me);
    const myWantedIds = wantsIds(me);
    const peerTeachingIds = teachIds(peer);

    const iTeach = unique(intersection(myTeachingIds, peer.wants));
    const theyTeach = unique(intersection(peerTeachingIds, myWantedIds));
    const double = iTeach.length > 0 && theyTeach.length > 0;
    const mode = double ? 'swap' : (iTeach.length > 0 ? 'teach' : (theyTeach.length > 0 ? 'learn' : null));

    const scheduleOverlap = intersection(me.slots || [], peer.slots || []);
    const formatOverlap = intersection(me.formats || [], peer.formats || []);

    const rhythm = clamp(
      3 +
      (scheduleOverlap.length ? 2 : 0) +
      (scheduleOverlap.length > 1 ? 1 : 0) +
      (formatOverlap.length ? 2 : 0),
      0,
      8
    );
    const verified = clamp((peer.verified || []).length, 0, 4);
    const trust = clamp(
      round(clamp((peer.rating - 4.5) / 0.5, 0, 1) * 4 + Math.min(peer.swaps, 20) / 20 * 4),
      0,
      8
    );

    const score = double ? clamp(80 + rhythm + verified + trust, 0, 100) : null;

    const breakdown = [
      { label: '双向互补', value: double ? 80 : 0, max: 80 },
      { label: '时间与形式', value: rhythm, max: 8 },
      { label: '资料认证', value: verified, max: 4 },
      { label: '信用印记', value: trust, max: 8 }
    ];

    const mySkillNames = labels(iTeach);
    const theirSkillNames = labels(theyTeach);

    let reason = '';
    if (mode === 'swap') {
      reason = '你教 ' + mySkillNames[0] + ' · TA 教你 ' + theirSkillNames[0];
    } else if (mode === 'teach') {
      reason = 'TA 正在学 ' + mySkillNames[0] + '，你可以教一小时，存下时间币';
    } else if (mode === 'learn') {
      reason = 'TA 能教 ' + theirSkillNames[0] + '，用你的时间币兑换一小时';
    }

    return {
      peerId: peer.id,
      mode: mode,
      score: score,
      iTeach: iTeach,
      theyTeach: theyTeach,
      iTeachLabels: mySkillNames,
      theyTeachLabels: theirSkillNames,
      scheduleOverlap: scheduleOverlap,
      formatOverlap: formatOverlap,
      breakdown: breakdown,
      reason: reason,
      rhythm: rhythm,
      verified: verified,
      trust: trust
    };
  }

  function matchForPeer(me, peers, peerId) {
    const peer = peers.filter(function (item) { return item.id === peerId; })[0];
    if (!peer) return null;
    return { peer: peer, match: computeMatch(me, peer) };
  }

  function statusMeta(status) {
    const map = {
      incoming: { label: '待你回应', tone: 'accent', group: 'confirm' },
      pending: { label: '等待回应', tone: 'muted', group: 'confirm' },
      active: { label: '进行中', tone: 'live', group: 'active' },
      review: { label: '待互评', tone: 'gold', group: 'done' },
      completed: { label: '已完成', tone: 'done', group: 'done' },
      declined: { label: '已婉拒', tone: 'muted', group: 'done' }
    };
    return map[status] || { label: status, tone: 'muted', group: '' };
  }

  function exchangeGroups(exchanges) {
    return {
      all: exchanges.slice(),
      confirm: exchanges.filter(function (item) {
        return item.status === 'incoming' || item.status === 'pending';
      }),
      active: exchanges.filter(function (item) { return item.status === 'active'; }),
      done: exchanges.filter(function (item) {
        return item.status === 'review' || item.status === 'completed';
      })
    };
  }

  function completedSessions(exchange) {
    return (exchange.sessions || []).filter(function (session) { return session.done; }).length;
  }

  function nextSession(exchange) {
    return (exchange.sessions || []).filter(function (session) { return !session.done; })[0] || null;
  }

  function exchangeTitle(exchange) {
    if (exchange.mode === 'teach') return skillLabel(exchange.mySkill) + ' → 时间币';
    if (exchange.mode === 'learn') return '时间币 → ' + skillLabel(exchange.theirSkill);
    return skillLabel(exchange.mySkill) + ' ⇄ ' + skillLabel(exchange.theirSkill);
  }

  function totalHours(exchange) {
    return (exchange.sessionsTotal * exchange.sessionMinutes) / 60;
  }

  function formatHours(value) {
    if (Number.isInteger(value)) return value + '';
    return value.toFixed(1).replace('.0', '');
  }

  function sortedMatches(me, peers) {
    return peers.map(function (peer) {
      return { peer: peer, match: computeMatch(me, peer) };
    }).filter(function (item) { return item.match.mode; });
  }

  function discover(me, peers, options) {
    const query = (options.query || '').trim().toLowerCase();
    const categoryId = options.category || 'all';
    const format = options.format || 'all';
    const sort = options.sort || 'match';

    let list = sortedMatches(me, peers);

    if (options.onlyDouble) {
      list = list.filter(function (item) { return item.match.mode === 'swap'; });
    }

    if (categoryId !== 'all') {
      list = list.filter(function (item) {
        return item.peer.teaches.some(function (item) {
          return skillCategory(item.skill) === categoryId;
        }) || item.peer.wants.some(function (id) {
          return skillCategory(id) === categoryId;
        });
      });
    }

    if (format === 'online') {
      list = list.filter(function (item) { return item.peer.formats.indexOf('线上') !== -1; });
    } else if (format === 'offline') {
      list = list.filter(function (item) {
        return item.peer.formats.indexOf('线下') !== -1 && item.peer.city === me.city;
      });
    }

    if (query) {
      list = list.filter(function (item) {
        const haystack = [
          item.peer.name,
          item.peer.role,
          item.peer.city,
          item.peer.bio,
          item.peer.goal,
          labels(teachIds(item.peer)).join(' '),
          labels(item.peer.wants).join(' '),
          item.match.reason
        ].join(' ').toLowerCase();
        return haystack.indexOf(query) !== -1;
      });
    }

    list.sort(function (a, b) {
      if (sort === 'active') return a.peer.lastActive - b.peer.lastActive;
      if (sort === 'swaps') return b.peer.swaps - a.peer.swaps;
      if (sort === 'rating') return b.peer.rating - a.peer.rating;

      const modeRank = function (item) { return item.match.mode === 'swap' ? 0 : 1; };
      const rankDiff = modeRank(a) - modeRank(b);
      if (rankDiff !== 0) return rankDiff;
      const scoreDiff = (b.match.score || 0) - (a.match.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return b.peer.rating - a.peer.rating;
    });

    return list;
  }

  function matchingStats(me, peers) {
    const list = sortedMatches(me, peers);
    return {
      swap: list.filter(function (item) { return item.match.mode === 'swap'; }).length,
      teach: list.filter(function (item) { return item.match.mode === 'teach'; }).length,
      learn: list.filter(function (item) { return item.match.mode === 'learn'; }).length,
      total: list.length
    };
  }

  root.SWAP_LOGIC = {
    skill: skill,
    skillLabel: skillLabel,
    skillCategory: skillCategory,
    category: category,
    labels: labels,
    teachIds: teachIds,
    wantsIds: wantsIds,
    computeMatch: computeMatch,
    matchForPeer: matchForPeer,
    sortedMatches: sortedMatches,
    discover: discover,
    matchingStats: matchingStats,
    statusMeta: statusMeta,
    exchangeGroups: exchangeGroups,
    completedSessions: completedSessions,
    nextSession: nextSession,
    exchangeTitle: exchangeTitle,
    totalHours: totalHours,
    formatHours: formatHours,
    clamp: clamp
  };
})(globalThis);
