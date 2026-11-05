#!/usr/bin/env node
/**
 * 流萤主题 GitHub Profile 统计卡生成器
 * - GraphQL 拉取贡献日历、仓库、语言、星标、关注者
 * - 输出 overview / languages / activity 的暗色与亮色 SVG
 * - 无 token 或接口失败时输出主题化空状态，不阻断 workflow
 *
 * 用法:
 *   GITHUB_TOKEN=xxx GITHUB_REPOSITORY=owner/owner node scripts/update-profile.mjs
 *   node scripts/update-profile.mjs --demo --out=preview/generated
 */
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPOSITORY || '';
const LOGIN = process.env.PROFILE_USERNAME || (REPO ? REPO.split('/')[0] : 'YOUR_GITHUB_USERNAME');
const DEMO = process.argv.includes('--demo');
const OUT_ARG = process.argv.find((a) => a.startsWith('--out='));
const OUT_DIR = path.resolve(OUT_ARG ? OUT_ARG.slice(6) : 'assets/generated');

const FONT = 'Noto Sans SC, Microsoft YaHei, PingFang SC, Helvetica Neue, Arial, sans-serif';
const MONO = 'JetBrains Mono, SFMono-Regular, Consolas, Liberation Mono, monospace';

const THEMES = {
  dark: {
    name: 'dark',
    bg1: '#04070E', bg2: '#07121E', bg3: '#0A1B24',
    ink: '#E9FFF9', sub: '#C3D9DD', mint: '#7DF9C4', teal: '#2DD4BF', amber: '#FFC27A',
    panel1: '#0A1420', panel2: '#07101A', border: '#1B3A3B', grid: '#7DF9C4',
    levels: ['#122B2B', '#14504A', '#0E7A66', '#20A98F', '#7DF9C4'],
    empty: '#122B2B', track: '#223B3C'
  },
  light: {
    name: 'light',
    bg1: '#F8FFFD', bg2: '#EFFCF9', bg3: '#E2F8F3',
    ink: '#0B2B27', sub: '#1E3F42', mint: '#0F766E', teal: '#0D9488', amber: '#B45309',
    panel1: '#FFFFFF', panel2: '#F1FDFA', border: '#8FC4B8', grid: '#0D9488',
    levels: ['#D8E8E4', '#B7E0D2', '#7FCDB8', '#2FB39F', '#0B665F'],
    empty: '#D8E8E4', track: '#D5E9E2'
  }
};

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmt(n) {
  return new Intl.NumberFormat('en-US').format(Number(n) || 0);
}

function short(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
}

function panelDefs(t, p) {
  return '<linearGradient id="' + p + '-bg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + t.panel1 + '"/><stop offset="100%" stop-color="' + t.panel2 + '"/></linearGradient>' +
    '<radialGradient id="' + p + '-halo" cx="100%" cy="0%" r="90%">' +
      '<stop offset="0%" stop-color="' + t.teal + '" stop-opacity="' + (t.name === 'dark' ? '.16' : '.08') + '"/>' +
      '<stop offset="100%" stop-color="' + t.teal + '" stop-opacity="0"/></radialGradient>' +
    '<pattern id="' + p + '-grid" width="22" height="22" patternUnits="userSpaceOnUse">' +
      '<path d="M 22 0 L 0 0 0 22" fill="none" stroke="' + t.grid + '" stroke-opacity=".035" stroke-width=".6"/></pattern>';
}

function corners(t, w, h, inset, len, p) {
  const i = inset == null ? 12 : inset;
  const l = len == null ? 14 : len;
  return '<g fill="none" stroke="' + t.mint + '" stroke-opacity="' + (t.name === 'dark' ? '.38' : '.62') + '" stroke-width="1">' +
    '<path d="M ' + i + ' ' + (i + l) + ' L ' + i + ' ' + i + ' L ' + (i + l) + ' ' + i + '"/>' +
    '<path d="M ' + (w - i - l) + ' ' + i + ' L ' + (w - i) + ' ' + i + ' L ' + (w - i) + ' ' + (i + l) + '"/>' +
    '<path d="M ' + i + ' ' + (h - i - l) + ' L ' + i + ' ' + (h - i) + ' L ' + (i + l) + ' ' + (h - i) + '"/>' +
    '<path d="M ' + (w - i - l) + ' ' + (h - i) + ' L ' + (w - i) + ' ' + (h - i) + ' L ' + (w - i) + ' ' + (h - i - l) + '"/>' +
    '</g>';
}

function chrome(t, w, h, title, right, inner, p) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(title) + '">' +
    '<title>' + esc(title) + '</title><defs>' + panelDefs(t, p) + '</defs>' +
    '<rect x=".75" y=".75" width="' + (w - 1.5) + '" height="' + (h - 1.5) + '" rx="16" fill="url(#' + p + '-bg)" stroke="' + t.border + '"/>' +
    '<rect x=".75" y=".75" width="' + (w - 1.5) + '" height="' + (h - 1.5) + '" rx="16" fill="url(#' + p + '-halo)"/>' +
    '<rect x=".75" y=".75" width="' + (w - 1.5) + '" height="' + (h - 1.5) + '" rx="16" fill="url(#' + p + '-grid)"/>' +
    corners(t, w, h, 12, 14, p) +
    '<text x="24" y="32" font-family="' + MONO + '" font-size="9.5" letter-spacing="2.2" fill="' + t.mint + '">' + esc(title) + '</text>' +
    '<text x="' + (w - 24) + '" y="32" text-anchor="end" font-family="' + MONO + '" font-size="9" letter-spacing="1.4" fill="' + t.sub + '">' + esc(right) + '</text>' +
    '<line x1="24" y1="44" x2="' + (w - 24) + '" y2="44" stroke="' + t.border + '"/>' +
    inner + '</svg>';
}

function emptyBlock(t, w, h, label, note) {
  return '<g text-anchor="middle">' +
    '<text x="' + (w / 2) + '" y="' + (h / 2 - 4) + '" font-family="' + MONO + '" font-size="13" letter-spacing="3" fill="' + t.mint + '">' + esc(label) + '</text>' +
    '<text x="' + (w / 2) + '" y="' + (h / 2 + 18) + '" font-family="' + MONO + '" font-size="9" letter-spacing="1" fill="' + t.sub + '">' + esc(note) + '</text></g>';
}

function overviewSvg(t, s, suffix) {
  const total = s.totalContributions || 0;
  const p = 'ov' + suffix;
  const stats = [
    { x: 250, y: 88, v: s.repos, l: 'PUBLIC REPOS' },
    { x: 368, y: 88, v: s.stars, l: 'STARS EARNED' },
    { x: 250, y: 148, v: s.followers, l: 'FOLLOWERS' },
    { x: 368, y: 148, v: s.activeDays, l: 'ACTIVE DAYS' }
  ];
  let inner = '';
  inner += '<text x="26" y="116" font-family="' + FONT + '" font-size="46" font-weight="700" fill="' + t.ink + '">' + fmt(total) + '</text>';
  inner += '<text x="28" y="136" font-family="' + MONO + '" font-size="8.5" letter-spacing="2" fill="' + t.mint + '">CONTRIBUTIONS</text>';
  inner += '<text x="28" y="152" font-family="' + FONT + '" font-size="9" fill="' + t.sub + '">过去 12 个月</text>';
  inner += '<line x1="232" y1="62" x2="232" y2="180" stroke="' + t.border + '"/>';
  for (const st of stats) {
    inner += '<text x="' + st.x + '" y="' + st.y + '" font-family="' + FONT + '" font-size="22" font-weight="600" fill="' + t.ink + '">' + short(st.v) + '</text>';
    inner += '<text x="' + st.x + '" y="' + (st.y + 17) + '" font-family="' + MONO + '" font-size="8.5" letter-spacing="1.2" fill="' + t.sub + '">' + st.l + '</text>';
  }
  inner += '<text x="28" y="198" font-family="' + MONO + '" font-size="9" letter-spacing="1.2" fill="' + t.sub + '">@' + esc(s.login) + ' · UPDATED ' + esc(s.updated) + '</text>';
  if (!s.totalContributions && !s.repos && !s.stars && !s.followers) {
    inner += emptyBlock(t, 480, 140, 'NO SIGNAL', 'RUN UPDATE-PROFILE WORKFLOW');
  }
  return chrome(t, 480, 220, 'OVERVIEW', '@' + s.login, inner, p);
}

function languagesSvg(t, s, suffix) {
  const p = 'lg' + suffix;
  const list = (s.languages || []).slice(0, 5);
  let inner = '';
  if (!list.length) {
    inner += emptyBlock(t, 480, 150, 'NO LANGUAGE DATA', 'WAITING FOR FIRST SYNC');
  } else {
    const maxPct = 100;
    list.forEach((l, i) => {
      const y = 72 + i * 28;
      const pct = l.pct || 0;
      const barW = Math.max(2, Math.round(430 * pct / maxPct));
      const lc = inkColor(l.color || t.mint, t);
      inner += '<circle cx="28" cy="' + (y - 4) + '" r="3.2" fill="' + lc + '"/>';
      inner += '<text x="40" y="' + y + '" font-family="' + FONT + '" font-size="11.5" fill="' + t.ink + '">' + esc(l.name) + '</text>';
      inner += '<text x="456" y="' + y + '" text-anchor="end" font-family="' + MONO + '" font-size="9" fill="' + t.sub + '">' + pct.toFixed(1) + '%</text>';
      inner += '<rect x="40" y="' + (y + 6) + '" width="416" height="5" rx="2.5" fill="' + t.track + '"/>';
      inner += '<rect x="40" y="' + (y + 6) + '" width="' + Math.round(416 * pct / 100) + '" height="5" rx="2.5" fill="' + lc + '"/>';
    });
    inner += '<text x="28" y="204" font-family="' + MONO + '" font-size="9" letter-spacing="1.2" fill="' + t.sub + '">BYTES ' + short(s.languageBytes || 0) + ' · TOP ' + list.length + '</text>';
  }
  return chrome(t, 480, 220, 'LANGUAGE SPECTRUM', 'BYTES ' + short(s.languageBytes || 0), inner, p);
}

function inkColor(hex, t) {
  if (!hex || t.name !== 'light') return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum < 0.62) return hex;
  const k = 0.38;
  const mix = (v, target) => Math.round(v * (1 - k) + target * k);
  const to = (v) => v.toString(16).padStart(2, '0');
  return '#' + to(mix(r, 11)) + to(mix(g, 43)) + to(mix(b, 39));
}

function levelFor(count, max) {
  if (!count) return 0;
  if (!max) return 1;
  const r = count / max;
  if (r <= 0.15) return 1;
  if (r <= 0.35) return 2;
  if (r <= 0.65) return 3;
  return 4;
}

function activitySvg(t, s, suffix) {
  const p = 'ac' + suffix;
  const weeks = s.weeks || [];
  const cell = 9.4;
  const gap = 2.4;
  const step = cell + gap;
  const x0 = 66;
  const y0 = 82;
  let inner = '';

  if (!weeks.length) {
    inner = emptyBlock(t, 1000, 170, 'AWAITING FIRST SYNC', 'PUSH TO MAIN TO RUN THE PROFILE WORKFLOW');
    return chrome(t, 1000, 220, 'CONTRIBUTION MATRIX', 'NO DATA', inner, p);
  }

  const max = Math.max(1, ...weeks.flatMap((w) => w.days.map((d) => d.count)));
  let lastMonth = -1;
  let lastLabelX = -100;
  weeks.forEach((w, wi) => {
    const x = x0 + wi * step;
    const first = w.days.find((d) => d.date);
    if (first) {
      const m = Number(first.date.slice(5, 7));
      if (m !== lastMonth && x - lastLabelX > 34) {
        const names = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        inner += '<text x="' + x + '" y="70" font-family="' + MONO + '" font-size="8.5" letter-spacing=".8" fill="' + t.sub + '">' + names[m - 1] + '</text>';
        lastLabelX = x;
        lastMonth = m;
      }
    }
    w.days.forEach((d, di) => {
      const lv = levelFor(d.count, max);
      const fill = d.count ? t.levels[lv] : t.empty;
      inner += '<rect x="' + x + '" y="' + (y0 + di * step) + '" width="' + cell + '" height="' + cell + '" rx="2" fill="' + fill + '"' + (d.count ? '' : '') + '>' +
        '<title>' + esc(d.date) + ' · ' + d.count + ' contribution' + (d.count === 1 ? '' : 's') + '</title></rect>';
    });
  });

  const wd = ['', 'MON', '', 'WED', '', 'FRI', ''];
  wd.forEach((label, i) => {
    if (label) inner += '<text x="52" y="' + (y0 + i * step + 7.5) + '" text-anchor="end" font-family="' + MONO + '" font-size="8.5" fill="' + t.sub + '">' + label + '</text>';
  });

  const gridRight = x0 + (weeks.length - 1) * step + cell;
  inner += '<text x="' + x0 + '" y="204" font-family="' + MONO + '" font-size="8.5" letter-spacing="1" fill="' + t.sub + '">LESS</text>';
  for (let i = 0; i < 5; i++) {
    inner += '<rect x="' + (x0 + 34 + i * 12) + '" y="196" width="9" height="9" rx="2" fill="' + (i === 0 ? t.empty : t.levels[i]) + '"/>';
  }
  inner += '<text x="' + (x0 + 34 + 5 * 12) + '" y="204" font-family="' + MONO + '" font-size="8.5" letter-spacing="1" fill="' + t.sub + '">MORE</text>';

  const rx = 720;
  inner += '<line x1="704" y1="62" x2="704" y2="190" stroke="' + t.border + '"/>';
  inner += '<text x="' + rx + '" y="90" font-family="' + MONO + '" font-size="9" letter-spacing="1.4" fill="' + t.sub + '">CURRENT STREAK</text>';
  inner += '<text x="' + rx + '" y="126" font-family="' + FONT + '" font-size="30" font-weight="700" fill="' + t.ink + '">' + fmt(s.currentStreak) + '<tspan font-family="' + MONO + '" font-size="9" fill="' + t.sub + '"> DAYS</tspan></text>';
  inner += '<text x="' + (rx + 150) + '" y="90" font-family="' + MONO + '" font-size="9" letter-spacing="1.4" fill="' + t.sub + '">LONGEST</text>';
  inner += '<text x="' + (rx + 150) + '" y="126" font-family="' + FONT + '" font-size="30" font-weight="700" fill="' + t.ink + '">' + fmt(s.longestStreak) + '<tspan font-family="' + MONO + '" font-size="9" fill="' + t.sub + '"> DAYS</tspan></text>';
  inner += '<text x="' + rx + '" y="168" font-family="' + MONO + '" font-size="9" letter-spacing="1.4" fill="' + t.sub + '">ACTIVE DAYS</text>';
  inner += '<text x="' + (rx + 150) + '" y="168" font-family="' + MONO + '" font-size="9" letter-spacing="1.4" fill="' + t.sub + '">TOTAL</text>';
  inner += '<text x="' + rx + '" y="190" font-family="' + FONT + '" font-size="18" font-weight="600" fill="' + t.mint + '">' + fmt(s.activeDays) + '</text>';
  inner += '<text x="' + (rx + 150) + '" y="190" font-family="' + FONT + '" font-size="18" font-weight="600" fill="' + t.mint + '">' + fmt(s.totalContributions) + '</text>';

  return chrome(t, 1000, 220, 'CONTRIBUTION MATRIX', fmt(s.totalContributions) + ' TOTAL', inner, p);
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function computeStreaks(days) {
  const sorted = days.filter((d) => d.date).slice().sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let run = 0;
  for (const d of sorted) {
    if (d.count > 0) { run += 1; if (run > longest) longest = run; }
    else run = 0;
  }
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) current += 1;
    else if (i === sorted.length - 1) continue;
    else break;
  }
  return { current, longest };
}

function demoData() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay());
  const weeks = [];
  let total = 0;
  let active = 0;
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + w * 7 + d);
      const i = w * 7 + d;
      const wave = Math.sin(i / 4.2) * 4 + Math.sin(i / 11.5) * 3 + 3;
      let count = Math.max(0, Math.round(wave + (i % 7 === 0 ? 1 : 0)));
      if (date > today) count = 0;
      if ((i * 37) % 17 === 0) count = 0;
      if ((i * 53) % 89 === 0) count = 13;
      total += count;
      if (count > 0) active += 1;
      days.push({ date: dateKey(date), count: count });
    }
    weeks.push({ days: days });
  }
  const all = weeks.flatMap((w) => w.days);
  const st = computeStreaks(all);
  return {
    login: process.env.PROFILE_USERNAME || 'YOUR_GITHUB_USERNAME',
    name: process.env.PROFILE_NAME || 'YOUR_NAME', totalContributions: total,
    repos: 42, stars: 1280, followers: 860, activeDays: active,
    currentStreak: st.current, longestStreak: st.longest, weeks: weeks,
    languages: [
      { name: 'TypeScript', color: '#3178C6', pct: 38.4 },
      { name: 'Python', color: '#3572A5', pct: 24.1 },
      { name: 'Rust', color: '#DEA584', pct: 15.7 },
      { name: 'Go', color: '#00ADD8', pct: 12.2 },
      { name: 'Shell', color: '#89E051', pct: 9.6 }
    ],
    languageBytes: 4820000, updated: dateKey(today), demo: true
  };
}

function emptyData() {
  return {
    login: LOGIN, name: '', totalContributions: 0, repos: 0, stars: 0, followers: 0,
    activeDays: 0, currentStreak: 0, longestStreak: 0, weeks: [],
    languages: [], languageBytes: 0, updated: dateKey(new Date()), demo: false
  };
}

async function ghGraphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: 'bearer ' + TOKEN,
      'Content-Type': 'application/json',
      'User-Agent': 'firefly-profile-readme'
    },
    body: JSON.stringify({ query: query, variables: variables })
  });
  if (!res.ok) throw new Error('GraphQL HTTP ' + res.status + ': ' + (await res.text()).slice(0, 300));
  const json = await res.json();
  if (json.errors && json.errors.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

async function fetchProfile() {
  const query = 'query($login:String!){ user(login:$login){ name login followers{totalCount} repositories(ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC){totalCount} contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount weekday}}}} repos: repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,orderBy:{field:STARRED_AT,direction:DESC}){nodes{name stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}} } }';
  const data = await ghGraphql(query, { login: LOGIN });
  const user = data.user;
  if (!user) throw new Error('User not found: ' + LOGIN);

  const weeks = user.contributionsCollection.contributionCalendar.weeks.map((w) => ({
    days: w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  }));
  const all = weeks.flatMap((w) => w.days);
  const st = computeStreaks(all);
  const activeDays = all.filter((d) => d.count > 0).length;
  let stars = 0;
  const lang = new Map();
  for (const repo of user.repos.nodes) {
    stars += repo.stargazerCount || 0;
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      const color = edge.node.color || '#7DF9C4';
      const prev = lang.get(name) || { name: name, color: color, size: 0 };
      prev.size += edge.size || 0;
      lang.set(name, prev);
    }
  }
  const entries = Array.from(lang.values()).sort((a, b) => b.size - a.size);
  const bytes = entries.reduce((a, b) => a + b.size, 0);
  const languages = entries.slice(0, 6).map((l) => ({ name: l.name, color: l.color, pct: bytes ? l.size / bytes * 100 : 0 }));

  return {
    login: user.login, name: user.name || '', totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
    repos: user.repositories.totalCount, stars: stars, followers: user.followers.totalCount,
    activeDays: activeDays, currentStreak: st.current, longestStreak: st.longest,
    weeks: weeks, languages: languages, languageBytes: bytes, updated: dateKey(new Date()), demo: false
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let data;
  if (DEMO) {
    data = demoData();
    console.log('[demo] rendering sample data');
  } else if (!TOKEN) {
    console.warn('[warn] no GITHUB_TOKEN / PROFILE_TOKEN; writing empty state');
    data = emptyData();
  } else {
    try {
      data = await fetchProfile();
      console.log('[ok] fetched @' + data.login + ': ' + data.totalContributions + ' contributions');
    } catch (err) {
      console.error('[warn] fetch failed:', err.message);
      data = emptyData();
    }
  }

  for (const t of Object.values(THEMES)) {
    const suffix = t.name === 'dark' ? 'D' : 'L';
    fs.writeFileSync(path.join(OUT_DIR, 'overview-' + t.name + '.svg'), overviewSvg(t, data, suffix), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'languages-' + t.name + '.svg'), languagesSvg(t, data, suffix), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'activity-' + t.name + '.svg'), activitySvg(t, data, suffix), 'utf8');
  }
  fs.writeFileSync(path.join(OUT_DIR, 'stats.json'), JSON.stringify(data, null, 2), 'utf8');
  console.log('[done] wrote 6 SVG + stats.json to ' + OUT_DIR);
}

main().catch((err) => { console.error(err); process.exit(1); });
