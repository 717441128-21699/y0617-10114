export interface CrisisKeywordGroup {
  level: 'high' | 'medium' | 'low';
  keywords: string[];
}

export const crisisKeywords: CrisisKeywordGroup[] = [
  {
    level: 'high',
    keywords: [
      '自杀',
      '割腕',
      '跳楼',
      '结束生命',
      '不想活了',
      '去死',
      '自缢',
      '服毒',
      '吃安眠药',
      '跳河',
      '烧炭',
      '自残严重',
      '想死掉',
      '杀死自己',
    ],
  },
  {
    level: 'medium',
    keywords: [
      '自残',
      '想死',
      '不想活',
      '活着没意思',
      '生不如死',
      '度日如年',
      '想消失',
      '想离开',
      '痛苦不堪',
      '撑不下去了',
      '快崩溃了',
      '要疯了',
      '没人理解我',
      '一无所有',
    ],
  },
  {
    level: 'low',
    keywords: [
      '绝望',
      '撑不住',
      '想消失',
      '太累了',
      '很痛苦',
      '很压抑',
      '很焦虑',
      '很抑郁',
      '失眠严重',
      '吃不下饭',
      '没有希望',
      '看不到未来',
      '感觉孤独',
      '没人在乎',
    ],
  },
];

export function checkCrisisLevel(content: string): {
  triggered: boolean;
  matchedKeywords: string[];
  severity: 'low' | 'medium' | 'high' | null;
} {
  const matched: { keyword: string; level: 'high' | 'medium' | 'low' }[] = [];

  for (const group of crisisKeywords) {
    for (const keyword of group.keywords) {
      if (content.includes(keyword)) {
        matched.push({ keyword, level: group.level });
      }
    }
  }

  if (matched.length === 0) {
    return { triggered: false, matchedKeywords: [], severity: null };
  }

  const hasHigh = matched.some((m) => m.level === 'high');
  const hasMedium = matched.some((m) => m.level === 'medium');

  let severity: 'low' | 'medium' | 'high';
  if (hasHigh) {
    severity = 'high';
  } else if (hasMedium) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  return {
    triggered: true,
    matchedKeywords: matched.map((m) => m.keyword),
    severity,
  };
}
