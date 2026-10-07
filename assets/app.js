/* Dumbo Universe · app */
(() => {
'use strict';
const REPO = 'https://github.com/xinyi-liu-ai/dumbo-universe';
let SEED = [];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const DOMAINS = [
  {key:'origins', zh:'起源', en:'Origins', q:'原作、1941 年电影、幕后人物与音乐'},
  {key:'characters', zh:'角色', en:'Characters', q:'Dumbo 身边的每个角色和他们的关系'},
  {key:'screen', zh:'影视与媒体', en:'Screen & Media', q:'真人版、电视、客串、游戏与发行版本'},
  {key:'parks', zh:'乐园', en:'Parks', q:'六座乐园的旋转飞象和凯西小火车'},
  {key:'merch', zh:'商品', en:'Merchandise', q:'品类、地区、渠道、价格、发售日'},
  {key:'collections', zh:'系列与联名', en:'Collections', q:'周年系列、艺术家合作、联名'},
  {key:'events', zh:'周年与活动', en:'Events', q:'每五年一次的周年，以及 D23'},
  {key:'world', zh:'世界', en:'Around the World', q:'Dumbo 在各个国家和地区'},
  {key:'design', zh:'造型', en:'Design', q:'耳朵、小帽、水彩背景'},
  {key:'culture', zh:'文化足迹', en:'Culture', q:'翻唱、杂志、内容提示等长尾'},
];
const DOM = Object.fromEntries(DOMAINS.map(d => [d.key, d]));
const TYPES = {Work:['作品','work'], Character:['角色','chr'], Person:['人物','per'], Attraction:['游乐设施','attr'], Place:['地点','place'], Event:['活动','evt'], Anniversary:['周年','ann'], Collection:['系列','col'], Merchandise:['商品','mer'], Retailer:['零售商','ret'], Brand:['品牌','brand'], Publication:['出版物','pub'], Music:['音乐','mus'], Media:['发行版本','med'], Award:['奖项','award'], Artwork:['美术','art'], Concept:['概念','con'], CulturalArtifact:['文化物件','cul'], Region:['地区','reg']};
const RELS = {
  appears_in:['登场作品','登场角色与事物'], depicts:['描绘角色','相关商品与作品'], friend_of:['朋友','朋友'], parent_of:['孩子','父母'],
  helps:['帮助对象','帮助者'], manager_of:['经纪对象','经纪人'], delivers:['送来的孩子','送子者'], mocks:['嘲笑对象','嘲笑者'],
  based_on:['改编自','改编作品'], adaptation_of:['翻拍自','翻拍版本'], sequel_of:['前作','续作'], edition_of:['影片','发行版本'],
  written_by:['作者 / 编剧','创作'], directed_by:['导演','导演作品'], produced_by:['制片','制片作品'], animated_by:['动画师','动画作品'],
  composed_by:['作曲','作曲作品'], lyrics_by:['作词','作词作品'], performed_by:['演唱','演唱作品'], voiced_by:['配音','配音角色'],
  illustrated_by:['插画','插画作品'], song_in:['所属作品','歌曲'], won:['获奖','获奖作品'], nominated_for:['提名','提名作品'],
  part_of_collection:['所属系列','系列单品'], sold_by:['销售渠道','销售的商品与系列'], released_for:['纪念','纪念商品与版本'],
  celebrates:['庆祝对象','周年纪念'], featured_at:['亮相活动','活动内容'], located_at:['位于','包含'], version_of:['原版','其他版本'],
  references:['提及','被提及于'], uses_motif:['母题','出现于'], associated_with:['关联','关联'], related_to:['相关','相关'],
  in_region:['地区','该地区条目'],
};
const STATUS = {
  official:{zh:'官方', desc:'迪士尼或零售商的官方页面、新闻稿'},
  catalog:{zh:'目录', desc:'官方商品目录、包装、吊牌'},
  archive:{zh:'档案', desc:'博物馆、档案馆、拍卖记录'},
  secondary:{zh:'二手资料', desc:'百科、新闻报道、书籍'},
  'collector-reported':{zh:'藏家记录', desc:'个人笔记、藏家社群，还没找到正式出处'},
  unknown:{zh:'待核实', desc:'来源不明'},
};
const EDITIONS = {standard:'常规', limited:'限量', anniversary:'周年纪念', event:'活动首发', park:'乐园限定', regional:'地区限定', store:'渠道限定', collab:'艺术家 / 联名', blind:'盲盒', promo:'赠品 / 抽奖'};
const REGIONS = {US:'美国', JP:'日本', CN:'中国大陆', HK:'中国香港', TW:'中国台湾', KR:'韩国', FR:'法国', UK:'英国', GLOBAL:'全球'};
const PRESETS = [
  {label:'日本 · 周年纪念 · 商品与系列', f:{region:['JP'], edition:['anniversary']}},
  {label:'和 Timothy 有关、2020 年以后', f:{character:['chr.timothy'], yFrom:'2020'}},
  {label:'全球六座旋转飞象', f:{tag:'旋转飞象'}},
  {label:'85 周年的一切', f:{tag:'85周年'}},
  {label:'1941 版的幕后人物', f:{type:['Person'], domain:['origins']}},
  {label:'还没找到出处的条目', f:{status:['collector-reported','unknown']}},
];
const VIEWS = ['universe','graph','archive','timeline','world','design','schema'];

const S = {
  remote:new Map(), list:[], byId:new Map(), edges:[], adj:new Map(), chars:new Map(),
  view:'universe', db:null, canEdit:false, hist:[], cur:null, graphDirty:true, tl:new Set(), wsel:{kind:'region', key:'JP'}, era:0,
  f:{q:'', tag:'', domain:new Set(), type:new Set(), region:new Set(), character:new Set(), edition:new Set(), status:new Set(), yFrom:'', yTo:'', sort:'year'},
};

/* ---------- data model ---------- */
const arr = v => Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);
function normalize(e){
  const year = e.year === '' || e.year == null ? null : Number(e.year);
  return {...e, domains: arr(e.domains).length ? arr(e.domains) : ['culture'], region:arr(e.region), tags:arr(e.tags), edition:arr(e.edition),
    continuity:arr(e.continuity), source:arr(e.source), rel:arr(e.rel).filter(r => Array.isArray(r) && r.length >= 2), facts: e.facts && typeof e.facts === 'object' ? e.facts : {},
    year: Number.isFinite(year) ? year : null, status: STATUS[e.status] ? e.status : 'unknown'};
}
function rebuild(){
  const m = new Map();
  for (const e of SEED) m.set(e.id, {...e, _origin:'seed'});
  for (const [id, r] of S.remote){
    if (r && r._deleted){ m.delete(id); continue; }
    m.set(id, {...r, id, _origin: m.has(id) ? 'override' : 'added'});
  }
  S.list = [...m.values()].map(normalize);
  S.byId = new Map(S.list.map(e => [e.id, e]));
  S.edges = [];
  for (const e of S.list) for (const [r, t, note] of e.rel){ if (S.byId.has(t) && t !== e.id) S.edges.push({s:e.id, t, r:RELS[r] ? r : 'related_to', note}); }
  const regNode = {};
  for (const e of S.list) if (e.type === 'Region' && e.code) regNode[e.code] = e.id;
  for (const e of S.list) if (e.type !== 'Region') for (const c of e.region) if (regNode[c]) S.edges.push({s:e.id, t:regNode[c], r:'in_region', virtual:true});
  S.adj = new Map(S.list.map(e => [e.id, []]));
  for (const x of S.edges){ S.adj.get(x.s).push({x, other:x.t, dir:'out'}); S.adj.get(x.t).push({x, other:x.s, dir:'in'}); }
  S.chars = new Map();
  for (const e of S.list){
    const set = new Set(e.type === 'Character' ? [e.id] : []);
    for (const a of S.adj.get(e.id)) if (!a.x.virtual && S.byId.get(a.other)?.type === 'Character') set.add(a.other);
    S.chars.set(e.id, set);
  }
  S.graphDirty = true;
}
const title = e => e.zh || e.name || e.id;
const sub = e => (e.zh && e.name && e.name !== e.zh) ? e.name : '';
const short = e => e.short || title(e);
const col = e => `var(--d-${DOM[e.domains[0]] ? e.domains[0] : 'culture'})`;
const deg = id => (S.adj.get(id) || []).filter(a => !a.x.virtual).length;
const when = e => e.date ? (e.end ? `${e.date} → ${e.end.slice(5)}` : e.date) : (e.year ?? '');
const byYear = (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || title(a).localeCompare(title(b), 'zh');
const typeZh = t => (TYPES[t] || [t])[0];

/* ---------- filters ---------- */
function matches(e, skip){
  const f = S.f;
  if (f.q){
    const hay = [e.zh, e.name, e.summary, e.id, ...e.tags, ...Object.values(e.facts), typeZh(e.type)].join(' ').toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).filter(Boolean).every(t => hay.includes(t))) return false;
  }
  if (f.tag && !e.tags.includes(f.tag)) return false;
  if (skip !== 'domain' && f.domain.size && !e.domains.some(d => f.domain.has(d))) return false;
  if (skip !== 'type' && f.type.size && !f.type.has(e.type)) return false;
  if (skip !== 'region' && f.region.size && !e.region.some(r => f.region.has(r))) return false;
  if (skip !== 'character' && f.character.size && ![...S.chars.get(e.id)].some(c => f.character.has(c))) return false;
  if (skip !== 'edition' && f.edition.size && !e.edition.some(x => f.edition.has(x))) return false;
  if (skip !== 'status' && f.status.size && !f.status.has(e.status)) return false;
  const yf = parseInt(f.yFrom, 10), yt = parseInt(f.yTo, 10);
  if ((yf || yt) && e.year == null) return false;
  if (yf && e.year < yf) return false;
  if (yt && e.year > yt) return false;
  return true;
}
function resetFilters(){ const f = S.f; f.q = ''; f.tag = ''; ['domain','type','region','character','edition','status'].forEach(k => f[k].clear()); f.yFrom = ''; f.yTo = ''; $('#q').value = ''; }
function applyPreset(p){
  resetFilters();
  for (const [k, v] of Object.entries(p.f)){ if (S.f[k] instanceof Set) v.forEach(x => S.f[k].add(x)); else S.f[k] = v; }
  go('archive');
}

/* ---------- universe ---------- */
function countdown(){
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let t = new Date(today.getFullYear(), 9, 23); if (today > t) t = new Date(today.getFullYear() + 1, 9, 23);
  const days = Math.round((t - today) / 864e5), n = t.getFullYear() - 1941;
  $('#countdown').innerHTML = days === 0
    ? `<b>今天</b><span>是 Dumbo 上映 <strong>${n} 周年</strong>。<br>1941-10-23 → ${t.getFullYear()}-10-23</span>`
    : `<b>${days}</b><span>天后是 Dumbo 上映 <strong>${n} 周年</strong>（${t.getFullYear()}-10-23）。<br>1941 年 10 月 23 日在美国首映。</span>`;
}
function renderStats(){
  const ys = S.list.map(e => e.year).filter(y => y != null);
  if (!ys.length){ $('#stats').innerHTML = ''; return; }
  $('#stats').innerHTML = `<div><dt>条目</dt><dd>${S.list.length}</dd></div><div><dt>关系</dt><dd>${S.edges.filter(x => !x.virtual).length}</dd></div><div><dt>跨越</dt><dd>${Math.min(...ys)}–${Math.max(...ys)}</dd></div>`;
}
function renderUniverse(){
  countdown(); renderStats();
  $('#presets').innerHTML = PRESETS.map((p, i) => `<button class="preset" data-preset="${i}">${esc(p.label)}</button>`).join('');
  const C = 480, R1 = 182, R2 = 318, RL = R2 + 13, GAP = 0.05;
  const groups = DOMAINS.map(d => ({d, items:S.list.filter(e => e.domains[0] === d.key).sort(byYear)}));
  const slots = groups.reduce((n, g) => n + Math.max(g.items.length, 1), 0);
  const step = (Math.PI * 2 - GAP * groups.length) / slots;
  const pos = new Map(), dpos = [];
  let a = -Math.PI / 2 + GAP / 2;
  for (const g of groups){
    const n = Math.max(g.items.length, 1), a0 = a;
    g.items.forEach((e, i) => { const t = a0 + step * (i + .5); pos.set(e.id, {t, x:C + R2 * Math.cos(t), y:C + R2 * Math.sin(t), e}); });
    const mid = a0 + step * n / 2;
    dpos.push({g, a0, a1:a0 + step * n, mid, x:C + R1 * Math.cos(mid), y:C + R1 * Math.sin(mid)});
    a += step * n + GAP;
  }
  const f1 = v => v.toFixed(1);
  let h = `<circle class="ring d" cx="${C}" cy="${C}" r="${R1}"/><circle class="ring" cx="${C}" cy="${C}" r="${R2}"/>`;
  for (const d of dpos){
    h += `<line class="spoke" x1="${C}" y1="${C}" x2="${f1(d.x)}" y2="${f1(d.y)}"/>`;
    const r = R2 - 14, sx = C + r * Math.cos(d.a0 + .01), sy = C + r * Math.sin(d.a0 + .01), ex = C + r * Math.cos(d.a1 - .01), ey = C + r * Math.sin(d.a1 - .01);
    h += `<path class="arc" style="stroke:var(--d-${d.g.d.key})" d="M${f1(sx)} ${f1(sy)}A${r} ${r} 0 ${d.a1 - d.a0 > Math.PI ? 1 : 0} 1 ${f1(ex)} ${f1(ey)}"/>`;
    const mx = C + (R2 - 14) * Math.cos(d.mid), my = C + (R2 - 14) * Math.sin(d.mid);
    h += `<line class="spoke" x1="${f1(d.x)}" y1="${f1(d.y)}" x2="${f1(mx)}" y2="${f1(my)}"/>`;
  }
  for (const x of S.edges){
    const p = pos.get(x.s), q = pos.get(x.t); if (!p || !q) continue;
    const cx = C + ((p.x + q.x) / 2 - C) * .12, cy = C + ((p.y + q.y) / 2 - C) * .12;
    h += `<path class="ch${x.virtual ? ' v' : ''}" data-s="${esc(x.s)}" data-t="${esc(x.t)}" d="M${f1(p.x)} ${f1(p.y)}Q${f1(cx)} ${f1(cy)} ${f1(q.x)} ${f1(q.y)}"/>`;
  }
  for (const [id, p] of pos){
    const dg = p.t * 180 / Math.PI, flip = Math.cos(p.t) < 0;
    const lx = C + RL * Math.cos(p.t), ly = C + RL * Math.sin(p.t);
    let lab = short(p.e); if ([...lab].length > 13) lab = [...lab].slice(0, 12).join('') + '…';
    h += `<circle class="dot" data-id="${esc(id)}" style="fill:${col(p.e)}" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${id === 'chr.dumbo' ? 7 : 4.6}"/>`;
    h += `<circle class="hit" data-id="${esc(id)}" cx="${f1(p.x)}" cy="${f1(p.y)}" r="10"><title>${esc(title(p.e))}</title></circle>`;
    h += `<text class="el" data-id="${esc(id)}" text-anchor="${flip ? 'end' : 'start'}" transform="translate(${f1(lx)} ${f1(ly)}) rotate(${f1(flip ? dg + 180 : dg)})">${esc(lab)}</text>`;
  }
  for (const d of dpos){
    h += `<g class="dn" data-dom="${d.g.d.key}" role="button" tabindex="0" aria-label="${esc(d.g.d.zh)}：${d.g.items.length} 个条目"><circle cx="${f1(d.x)}" cy="${f1(d.y)}" r="38" style="stroke:var(--d-${d.g.d.key})"/><text class="dz" x="${f1(d.x)}" y="${f1(d.y - 7)}">${esc(d.g.d.zh.length > 4 ? d.g.d.zh.slice(0, 2) : d.g.d.zh)}</text><text class="dc" x="${f1(d.x)}" y="${f1(d.y + 13)}">${d.g.items.length}</text></g>`;
  }
  h += `<g class="hub" data-id="chr.dumbo" role="button" tabindex="0" aria-label="打开 Dumbo 档案卡">
    <circle cx="${C}" cy="${C}" r="88" style="fill:var(--pink-wash)"/>
    <g transform="translate(${C} ${C - 18})">
      <ellipse cx="-36" cy="-2" rx="30" ry="27" style="fill:var(--hide)"/><ellipse cx="-38" cy="0" rx="19" ry="17" style="fill:var(--pink);opacity:.35"/>
      <ellipse cx="36" cy="-2" rx="30" ry="27" style="fill:var(--hide)"/><ellipse cx="38" cy="0" rx="19" ry="17" style="fill:var(--pink);opacity:.35"/>
      <circle r="24" style="fill:var(--hide)"/>
      <path d="M-7 12 C-9 28 -2 40 12 40 L13 33 C4 33 2 24 6 13 Z" style="fill:var(--hide)"/>
      <ellipse cx="-9" cy="-3" rx="3" ry="4.2" style="fill:var(--ink)"/><ellipse cx="9" cy="-3" rx="3" ry="4.2" style="fill:var(--ink)"/>
      <path d="M-11 -21 L0 -42 L11 -21 Z" style="fill:var(--gold)"/>
    </g>
    <text class="hub-t" x="${C}" y="${C + 60}">Dumbo</text></g>`;
  const svg = $('#orbit'); svg.innerHTML = h;
  $('#domains').innerHTML = groups.map(g => {
    const ex = [...g.items].sort((a, b) => deg(b.id) - deg(a.id)).slice(0, 3).map(short).join(' · ');
    const total = S.list.filter(e => e.domains.includes(g.d.key)).length;
    return `<button class="dcard" style="--c:var(--d-${g.d.key})" data-domgo="${g.d.key}"><span class="row"><h3>${esc(g.d.zh)}</h3><span class="n">${total}</span></span><span class="en">${esc(g.d.en)}</span><p>${esc(g.d.q)}</p><span class="ex">${esc(ex || '还没有条目')}</span></button>`;
  }).join('');
}
function orbitFocus(id){
  const svg = $('#orbit');
  $$('.on', svg).forEach(n => n.classList.remove('on'));
  if (!id){ svg.classList.remove('focus'); return; }
  svg.classList.add('focus');
  const nb = new Set([id]);
  $$('.ch', svg).forEach(p => { if (p.dataset.s === id || p.dataset.t === id){ p.classList.add('on'); nb.add(p.dataset.s); nb.add(p.dataset.t); } });
  $$('.dot,.el', svg).forEach(n => { if (nb.has(n.dataset.id)) n.classList.add('on'); });
  const e = S.byId.get(id); if (e) $$('.dn', svg).forEach(n => { if (n.dataset.dom === e.domains[0]) n.classList.add('on'); });
}
function orbitDomain(key){
  const svg = $('#orbit');
  $$('.on', svg).forEach(n => n.classList.remove('on'));
  svg.classList.add('focus');
  $$('.dot,.el', svg).forEach(n => { if (S.byId.get(n.dataset.id)?.domains.includes(key)) n.classList.add('on'); });
  $$('.dn', svg).forEach(n => { if (n.dataset.dom === key) n.classList.add('on'); });
}

/* ---------- archive ---------- */
const FACETS = [
  {key:'domain', label:'领域', opts:() => DOMAINS.map(d => [d.key, d.zh, `var(--d-${d.key})`]), val:e => e.domains},
  {key:'type', label:'类型', opts:() => Object.keys(TYPES).map(t => [t, TYPES[t][0]]), val:e => [e.type]},
  {key:'region', label:'地区', opts:() => Object.entries(REGIONS), val:e => e.region},
  {key:'character', label:'相关角色', opts:() => S.list.filter(e => e.type === 'Character').map(e => [e.id, title(e)]), val:e => [...S.chars.get(e.id)]},
  {key:'edition', label:'发行类型', opts:() => Object.entries(EDITIONS), val:e => e.edition},
  {key:'status', label:'来源可信度', opts:() => Object.entries(STATUS).map(([k, v]) => [k, v.zh]), val:e => [e.status]},
];
function cardHTML(e){
  const tags = e.tags.slice(0, 3).map(t => `<span class="tag">#${esc(t)}</span>`).join('');
  return `<button class="card" style="--c:${col(e)}" data-open="${esc(e.id)}">${e._origin !== 'seed' ? `<span class="mine">${e._origin === 'added' ? '新增' : '已编辑'}</span>` : ''}
    <span class="top"><span class="tchip">${esc(typeZh(e.type))}</span><span class="yr">${esc(e.year ?? '')}</span></span>
    <span class="t">${esc(title(e))}</span>${sub(e) ? `<span class="s">${esc(sub(e))}</span>` : ''}
    <span class="p">${esc(e.summary || '')}</span>
    <span class="foot"><span class="tags">${tags}</span><span class="st st-${e.status}">${esc(STATUS[e.status].zh)}</span></span></button>`;
}
function renderArchive(){
  const f = S.f;
  $('#facets').innerHTML = FACETS.map(fc => {
    const base = S.list.filter(e => matches(e, fc.key));
    const counts = {}; for (const e of base) for (const v of new Set(fc.val(e))) counts[v] = (counts[v] || 0) + 1;
    const opts = fc.opts().filter(([k]) => counts[k] || f[fc.key].has(k)).sort((a, b) => fc.key === 'character' ? (counts[b[0]] || 0) - (counts[a[0]] || 0) : 0);
    if (!opts.length) return '';
    return `<div class="fgroup"><h4>${esc(fc.label)}</h4><div class="fopts">${opts.map(([k, l, c]) =>
      `<button class="chip" data-facet="${fc.key}" data-val="${esc(k)}" aria-pressed="${f[fc.key].has(k)}"${c ? ` style="--c:${c}"` : ''}>${c ? '<span class="dt"></span>' : ''}${esc(l)} <span class="k">${counts[k] || 0}</span></button>`).join('')}</div></div>`;
  }).join('') + `<div class="fgroup"><h4>年份</h4><div class="years"><input id="yFrom" type="number" inputmode="numeric" placeholder="从" value="${esc(f.yFrom)}" aria-label="起始年份"><span>–</span><input id="yTo" type="number" inputmode="numeric" placeholder="到" value="${esc(f.yTo)}" aria-label="结束年份"></div></div>`;
  const res = S.list.filter(e => matches(e));
  const sorters = {year:byYear, 'year-desc':(a, b) => (b.year ?? -1) - (a.year ?? -1) || title(a).localeCompare(title(b), 'zh'), name:(a, b) => title(a).localeCompare(title(b), 'zh'), links:(a, b) => deg(b.id) - deg(a.id)};
  res.sort(sorters[f.sort] || byYear);
  $('#anum').textContent = res.length; $('#sort').value = f.sort;
  const act = [];
  if (f.q) act.push(['q', '', `搜索：${f.q}`]);
  if (f.tag) act.push(['tag', '', `#${f.tag}`]);
  for (const fc of FACETS) for (const v of f[fc.key]){ const o = fc.opts().find(x => x[0] === v); act.push([fc.key, v, `${fc.label}：${o ? o[1] : v}`]); }
  if (f.yFrom || f.yTo) act.push(['years', '', `年份：${f.yFrom || '…'}–${f.yTo || '…'}`]);
  $('#active').innerHTML = act.length ? act.map(([k, v, l]) => `<button class="chip" data-unset="${k}" data-val="${esc(v)}">${esc(l)} ✕</button>`).join('') + `<button class="btn ghost small" data-unset="all">清除全部</button>` : '';
  $('#results').innerHTML = res.length ? res.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1">没有符合这些条件的条目。试着去掉一个筛选条件${S.canEdit ? '，或者点右上角“添加条目”把它收进来' : ''}。</div>`;
}

/* ---------- graph ---------- */
let G = null;
function renderGraph(){
  const box = $('#graph');
  $('#legend').innerHTML = DOMAINS.map(d => `<span class="chip" style="--c:var(--d-${d.key});cursor:default"><span class="dt"></span>${esc(d.zh)}</span>`).join('');
  if (!window.d3){ box.innerHTML = '<div class="empty">关系网络需要 D3 图形库，但它没有加载成功。请检查网络后刷新页面；其他视图不受影响。</div>'; return; }
  if (!S.graphDirty && G) return;
  S.graphDirty = false;
  if (G) G.sim.stop();
  box.innerHTML = '';
  const w = Math.max(box.clientWidth, 320), h = Math.round(Math.max(520, Math.min(820, w * .7)));
  const nodes = S.list.map(e => ({id:e.id, e, dg:deg(e.id)}));
  const links = S.edges.map(x => ({source:x.s, target:x.t, virtual:!!x.virtual}));
  const rad = d => d.id === 'chr.dumbo' ? 16 : 4.5 + Math.sqrt(d.dg) * 2.1;
  const svg = d3.select(box).append('svg').attr('class', 'gsvg').attr('viewBox', [0, 0, w, h]).attr('role', 'img').attr('aria-label', 'Dumbo 宇宙关系网络');
  const root = svg.append('g');
  const link = root.append('g').selectAll('line').data(links).join('line').attr('class', d => 'gl' + (d.virtual ? ' v' : ''));
  const node = root.append('g').selectAll('g').data(nodes).join('g').attr('class', 'gn');
  node.append('circle').attr('r', rad).style('fill', d => col(d.e));
  node.append('text').text(d => short(d.e)).attr('x', d => rad(d) + 4).attr('y', 4).attr('class', d => d.dg >= 5 || d.id === 'chr.dumbo' ? 'show' : null);
  node.append('title').text(d => title(d.e));
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.virtual ? 110 : 52).strength(d => d.virtual ? .03 : .45))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('collide', d3.forceCollide(d => rad(d) + 5))
    .force('x', d3.forceX(w / 2).strength(.05)).force('y', d3.forceY(h / 2).strength(.08));
  const hub = nodes.find(n => n.id === 'chr.dumbo'); if (hub){ hub.fx = w / 2; hub.fy = h / 2; }
  const tick = () => { link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y); node.attr('transform', d => `translate(${d.x.toFixed(1)},${d.y.toFixed(1)})`); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches){ sim.stop(); for (let i = 0; i < 300; i++) sim.tick(); tick(); } else sim.on('tick', tick);
  const zoom = d3.zoom().scaleExtent([.3, 4])
    .filter(ev => ev.type === 'wheel' ? (ev.ctrlKey || ev.metaKey) : !ev.button)
    .on('zoom', ev => root.attr('transform', ev.transform));
  svg.call(zoom);
  node.call(d3.drag()
    .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
    .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); if (d.id !== 'chr.dumbo'){ d.fx = null; d.fy = null; } }));
  const hl = id => {
    const nb = new Set(id ? [id] : []);
    if (id) links.forEach(l => { if (l.source.id === id) nb.add(l.target.id); if (l.target.id === id) nb.add(l.source.id); });
    node.classed('dim', d => !!id && !nb.has(d.id)).classed('on', d => !!id && nb.has(d.id));
    link.classed('on', l => !!id && (l.source.id === id || l.target.id === id)).classed('dim', l => !!id && l.source.id !== id && l.target.id !== id);
  };
  node.on('mouseenter', (ev, d) => hl(d.id)).on('mouseleave', () => hl(G.pin || null)).on('click', (ev, d) => openEntity(d.id));
  G = {sim, svg, zoom, node, hl, pin:null, w, h,
    focus(id){ G.pin = id; hl(id); const n = nodes.find(x => x.id === id); if (!n) return; setTimeout(() => svg.transition().duration(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600).call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(1.6).translate(-n.x, -n.y)), 700); },
    search(q){ q = q.trim().toLowerCase(); node.classed('match', d => !!q && [d.e.zh, d.e.name, d.e.short, ...d.e.tags].join(' ').toLowerCase().includes(q)); }};
  G.search($('#gq').value);
}

/* ---------- timeline ---------- */
function renderTimeline(){
  $('#tlFilter').innerHTML = DOMAINS.map(d => `<button class="chip" style="--c:var(--d-${d.key})" data-tl="${d.key}" aria-pressed="${S.tl.has(d.key)}"><span class="dt"></span>${esc(d.zh)}</button>`).join('') + (S.tl.size ? '<button class="btn ghost small" data-tl="">显示全部</button>' : '');
  const items = S.list.filter(e => e.year != null && (!S.tl.size || e.domains.some(d => S.tl.has(d)))).sort(byYear);
  const years = new Map(); for (const e of items){ if (!years.has(e.year)) years.set(e.year, []); years.get(e.year).push(e); }
  for (let y = 1946; y <= 2026; y += 5) if (!years.has(y) && !S.tl.size) years.set(y, []);
  const ys = [...years.keys()].sort((a, b) => a - b);
  const dec = new Map(); for (const y of ys){ const d = Math.floor(y / 10) * 10; if (!dec.has(d)) dec.set(d, []); dec.get(d).push(y); }
  $('#timeline').innerHTML = [...dec].map(([d, list]) => `<section class="decade"><h3>${d}s</h3><ol>${list.map(y => {
    const n = y - 1941, ann = n > 0 && n % 5 === 0;
    const es = years.get(y);
    return `<li class="yrow${ann ? ' ann' : ''}"><div><div class="y">${y}</div>${ann ? `<span class="ab">${n} 周年</span>` : ''}</div><div class="items">${es.length ? es.map(e => `<button class="chip ent" style="--c:${col(e)}" data-open="${esc(e.id)}"><span class="dt"></span><span class="t">${esc(short(e))}</span></button>`).join('') : '<span style="color:var(--ink-3);font-size:13px;padding-top:3px">待收录</span>'}</div></li>`;
  }).join('')}</ol></section>`).join('') || '<div class="empty">这个领域还没有带年份的条目。</div>';
}

/* ---------- world ---------- */
function proj(lat, lng){
  const l = lng * Math.PI / 180, p = lat * Math.PI / 180, p2 = p * p, p4 = p2 * p2;
  const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
  const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
  return [(x + MAPDATA.xmax) * MAPDATA.k, (MAPDATA.ytop - y) * MAPDATA.k];
}
function renderWorld(){
  const svg = $('#map'); svg.setAttribute('viewBox', `0 0 ${MAPDATA.W} ${MAPDATA.H}`);
  const clusters = new Map();
  for (const e of S.list) if (Array.isArray(e.geo) && e.geo.length >= 2){
    const key = e.geo[2] || `${e.geo[0]},${e.geo[1]}`;
    if (!clusters.has(key)) clusters.set(key, {key, dir:e.geo[3] || 'r', pts:[], items:[]});
    const c = clusters.get(key); c.pts.push(proj(e.geo[0], e.geo[1])); c.items.push(e);
  }
  let h = '';
  for (let lat = -30; lat <= 60; lat += 30){ let d = ''; for (let lng = -180; lng <= 180; lng += 5){ const [x, y] = proj(lat, lng); d += (lng === -180 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1); } h += `<path class="grat" d="${d}"/>`; }
  h += `<path class="land" d="${MAPDATA.d}"/>`;
  for (const c of clusters.values()){
    const x = c.pts.reduce((s, p) => s + p[0], 0) / c.pts.length, y = c.pts.reduce((s, p) => s + p[1], 0) / c.pts.length;
    const a = {l:['end', -12, 4], r:['start', 12, 4], t:['middle', 0, -14], b:['middle', 0, 22]}[c.dir] || ['start', 12, 4];
    const sel = S.wsel.kind === 'cluster' && S.wsel.key === c.key;
    h += `<g class="pin${sel ? ' sel' : ''}" data-cluster="${esc(c.key)}" role="button" tabindex="0" aria-label="${esc(c.key)}：${c.items.length} 个条目"><circle class="o" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${10 + c.items.length * 2}"/><circle class="i" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5"/><text x="${(x + a[1]).toFixed(1)}" y="${(y + a[2]).toFixed(1)}" text-anchor="${a[0]}">${esc(c.key)} <tspan class="c">${c.items.length}</tspan></text></g>`;
  }
  svg.innerHTML = h;
  S._clusters = clusters;
  const counts = {}; for (const e of S.list) for (const r of e.region) counts[r] = (counts[r] || 0) + 1;
  $('#regions').innerHTML = Object.entries(REGIONS).map(([k, l]) => `<button class="rcard${counts[k] ? '' : ' zero'}" data-region="${k}" aria-pressed="${S.wsel.kind === 'region' && S.wsel.key === k}"><span>${esc(l)}</span><b>${counts[k] || 0}</b></button>`).join('');
  let items = [], head = '';
  if (S.wsel.kind === 'cluster' && clusters.has(S.wsel.key)){ items = clusters.get(S.wsel.key).items; head = `${S.wsel.key} 的地点与活动`; }
  else { const k = S.wsel.key; items = S.list.filter(e => e.region.includes(k) || (e.type === 'Region' && e.code === k)); head = `${REGIONS[k] || k}`; }
  items = [...items].sort(byYear);
  $('#wlist').innerHTML = `<h3>${esc(head)} · ${items.length}</h3>` + (items.length ? `<div class="grid">${items.map(cardHTML).join('')}</div>` : `<div class="empty">这里还没有条目。看到 ${esc(head)} 的 Dumbo 商品、活动或乐园内容时，${S.canEdit ? '用右上角的“添加条目”收进来，地区选这里即可。' : '可以把它加进档案。'}</div>`);
}

/* ---------- design ---------- */
const ERAS = [
  {when:'1941', t:'电影原版', p:{head:1, ear:1, eye:.72, body:1, trunk:1, blush:0, round:.9}, n:'动画里的比例更接近真实的幼象：头和身体分得比较开，鼻子长，眼睛小。情绪主要靠眉眼和耳朵的动作来表达。'},
  {when:'1950s', t:'早期商品', p:{head:1.02, ear:.9, eye:.8, body:1.04, trunk:.95, blush:0, round:.92}, n:'早期的橡胶、布偶类商品受工艺限制，造型被简化，颜色也比较少。'},
  {when:'1980s', t:'复古毛绒', p:{head:1.1, ear:1.04, eye:.95, body:.95, trunk:.8, blush:.15, round:.96}, n:'毛绒成为主力品类，头部开始放大，鼻子缩短，整体更圆润，便于抱在怀里。'},
  {when:'2000s', t:'Disney Store 风格', p:{head:1.18, ear:1.1, eye:1.12, body:.88, trunk:.68, blush:.4, round:1}, n:'门店毛绒的标准化造型：大头、大眼、短鼻，坐姿稳定，小帽和领圈成为固定配件。'},
  {when:'2020s', t:'萌化 / Baby', p:{head:1.3, ear:1.18, eye:1.32, body:.78, trunk:.52, blush:.85, round:1.04}, n:'日本插画系列、百元店小物和挂件把“萌”推到最大：头身比接近 1:1，眼睛占脸的很大比例，常加腮红。'},
];
function eraParams(v){
  const i = Math.min(3, Math.floor(v)), t = v - i, A = ERAS[i].p, B = ERAS[Math.min(4, i + 1)].p, o = {};
  for (const k in A) o[k] = A[k] + (B[k] - A[k]) * (v >= 4 ? 1 : t);
  return o;
}
function eleSVG(p){
  const cx = 200, hy = 168, hr = 60 * p.head, hry = hr * p.round, by = 292, bx = 70 * p.body, bry = 60 * p.body;
  const ex = hr + 30 * p.ear, erx = 52 * p.ear, ery = 60 * p.ear, eyx = 21 * p.head, ey = hy - 4, er = 6 * p.eye;
  const ty = hy + hry * .45, L = 72 * p.trunk;
  const top = hy - hry;
  return `<ellipse cx="200" cy="372" rx="120" ry="10" style="fill:var(--paper-2)"/>
  <g transform="rotate(-14 ${cx - ex} ${hy})"><ellipse cx="${cx - ex}" cy="${hy}" rx="${erx}" ry="${ery}" style="fill:var(--hide)"/><ellipse cx="${cx - ex - 4}" cy="${hy + 4}" rx="${erx * .66}" ry="${ery * .68}" style="fill:var(--pink);opacity:.32"/></g>
  <g transform="rotate(14 ${cx + ex} ${hy})"><ellipse cx="${cx + ex}" cy="${hy}" rx="${erx}" ry="${ery}" style="fill:var(--hide)"/><ellipse cx="${cx + ex + 4}" cy="${hy + 4}" rx="${erx * .66}" ry="${ery * .68}" style="fill:var(--pink);opacity:.32"/></g>
  <ellipse cx="${cx}" cy="${by}" rx="${bx}" ry="${bry}" style="fill:var(--hide-2)"/>
  <ellipse cx="${cx - bx * .45}" cy="${by + bry * .82}" rx="24" ry="15" style="fill:var(--hide)"/><ellipse cx="${cx + bx * .45}" cy="${by + bry * .82}" rx="24" ry="15" style="fill:var(--hide)"/>
  <ellipse cx="${cx}" cy="${hy + hry * .86}" rx="${hr * .82}" ry="13" style="fill:var(--gold)"/>
  <ellipse cx="${cx}" cy="${hy}" rx="${hr}" ry="${hry}" style="fill:var(--hide)"/>
  <path d="M${cx - 13} ${ty} C${cx - 16} ${ty + L * .7} ${cx - 4} ${ty + L} ${cx + 18} ${ty + L * .92} L${cx + 19} ${ty + L * .74} C${cx + 6} ${ty + L * .74} ${cx + 4} ${ty + L * .4} ${cx + 13} ${ty} Z" style="fill:var(--hide)"/>
  <circle cx="${cx - eyx * 1.75}" cy="${hy + hry * .3}" r="10" style="fill:var(--pink);opacity:${(p.blush * .55).toFixed(2)}"/><circle cx="${cx + eyx * 1.75}" cy="${hy + hry * .3}" r="10" style="fill:var(--pink);opacity:${(p.blush * .55).toFixed(2)}"/>
  <ellipse cx="${cx - eyx}" cy="${ey}" rx="${er}" ry="${er * 1.3}" style="fill:var(--ink)"/><ellipse cx="${cx + eyx}" cy="${ey}" rx="${er}" ry="${er * 1.3}" style="fill:var(--ink)"/>
  <circle cx="${cx - eyx + er * .35}" cy="${ey - er * .5}" r="${er * .32}" style="fill:var(--card)"/><circle cx="${cx + eyx + er * .35}" cy="${ey - er * .5}" r="${er * .32}" style="fill:var(--card)"/>
  <path d="M${cx - 26} ${top + 10} Q${cx} ${top - 30} ${cx + 26} ${top + 10} Z" style="fill:var(--gold)"/><ellipse cx="${cx}" cy="${top + 10}" rx="32" ry="6" style="fill:var(--gold)"/>`;
}
function renderDesign(){
  $('#eras').innerHTML = ERAS.map((e, i) => `<button class="chip" data-era="${i}" aria-pressed="${Math.round(S.era) === i}">${esc(e.when)} · ${esc(e.t)}</button>`).join('');
  drawEra();
}
function drawEra(){
  const v = S.era, p = eraParams(v), base = ERAS[0].p, e = ERAS[Math.round(v)];
  $('#ele').innerHTML = eleSVG(p);
  $('#eraSlider').value = v;
  $$('#eras .chip').forEach((b, i) => b.setAttribute('aria-pressed', String(Math.round(v) === i)));
  const m = [['耳朵 / 头', (p.ear / p.head) / (base.ear / base.head)], ['头 / 身体', (p.head / p.body) / (base.head / base.body)], ['眼睛大小', p.eye / base.eye], ['鼻子长度', p.trunk / base.trunk], ['腮红', null, p.blush]];
  $('#enote').innerHTML = `<div class="when">${esc(e.when)}</div><h3>${esc(e.t)}</h3><p>${esc(e.n)}</p>
    <div class="metrics">${m.map(([l, r, raw]) => { const val = r == null ? Math.round(raw * 100) : Math.round(r * 100); const wv = Math.min(100, r == null ? raw * 100 : r / 2 * 100); return `<div class="metric"><span>${l}</span><span class="bar"><i style="width:${wv.toFixed(0)}%"></i></span><span class="v">${val}</span></div>`; }).join('')}</div>
    <p class="note">数值是以 1941 年为 100 的示意指数（腮红为 0–100 的强度），用来比较趋势，不是测量数据。以后收录了各时期的实物照片，可以把真实测量值补进“造型”领域的条目里。</p>`;
}

/* ---------- schema ---------- */
const FIELDS = [
  ['id','唯一编号，类型前缀 + 名称','chr.timothy'], ['type','条目类型','Character'], ['zh / name','中文名 / 原名','蒂莫西 / Timothy Q. Mouse'],
  ['domains','所属领域，第一个是主领域','characters'], ['year · date · end','年份、具体日期、结束日期','2026 · 2026-08-14'], ['region','国家或地区，可多选','JP, US'],
  ['edition','发行类型，可多选','anniversary, event'], ['tags','自由标签','毛绒, 85周年'], ['continuity','所属故事线','1941 动画 / 2019 真人 / 乐园'],
  ['facts','按类型扩展的字段：价格、尺寸、渠道等','价格: ¥220'], ['rel','关系列表：[关系, 目标 id, 备注]','[friend_of, chr.dumbo]'],
  ['status','来源可信度','official'], ['source','来源标题与链接','Disney Parks Blog'], ['geo','经纬度与地点名，用于地图','[35.63, 139.88, 东京]'],
];
function renderSchema(){
  const tc = {}; for (const e of S.list) tc[e.type] = (tc[e.type] || 0) + 1;
  const rc = {}; for (const x of S.edges) rc[x.r] = (rc[x.r] || 0) + 1;
  const sc = {}; for (const e of S.list) sc[e.status] = (sc[e.status] || 0) + 1;
  const added = S.list.filter(e => e._origin !== 'seed').length;
  $('#schema').innerHTML = `
  <div class="panel"><h3>条目字段</h3><div class="tbl"><table><thead><tr><th>字段</th><th>含义</th><th>例子</th></tr></thead><tbody>${FIELDS.map(r => `<tr><td class="mono">${esc(r[0])}</td><td>${esc(r[1])}</td><td class="mono">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="panel"><h3>关系类型</h3><div class="tbl"><table><thead><tr><th>关系</th><th>从源头看</th><th>从目标看</th><th style="text-align:right">数量</th></tr></thead><tbody>${Object.entries(RELS).map(([k, v]) => `<tr><td class="mono">${k}</td><td>${esc(v[0])}</td><td>${esc(v[1])}</td><td class="num">${rc[k] || 0}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="panel"><h3>条目类型</h3><div class="fopts">${Object.entries(TYPES).map(([k, v]) => `<button class="chip" data-typego="${k}">${esc(v[0])} <span class="k">${k} · ${tc[k] || 0}</span></button>`).join('')}</div>
    <h3 style="margin-top:22px">来源可信度</h3><div class="tbl"><table><tbody>${Object.entries(STATUS).map(([k, v]) => `<tr><td><span class="st st-${k}">${esc(v.zh)}</span></td><td class="mono">${k}</td><td>${esc(v.desc)}</td><td class="num">${sc[k] || 0}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="panel"><h3>数据</h3>
    <p style="color:var(--ink-2)">档案目前有 ${SEED.length} 个条目，全部保存在 GitHub 仓库的 <a href="${REPO}/blob/main/data/entities.json" style="color:var(--focus)">data/entities.json</a> 里。想补充或更正条目，直接修改这个文件即可，格式说明见仓库的 <a href="${REPO}#readme" style="color:var(--focus)">README</a>。${S.db ? `你在页面上添加或修改过 ${added} 条。` : ''}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn" data-copy="all">复制全部数据（JSON）</button><button class="btn" data-copy="added">只复制新增和修改的条目</button></div>
    <textarea class="copyout" id="copyout" readonly hidden aria-label="导出的 JSON"></textarea></div>`;
}

/* ---------- drawer ---------- */
function openEntity(id, push = true){
  const e = S.byId.get(id); if (!e) return;
  if (push && S.cur && S.cur !== id && !$('#drawer').hidden) S.hist.push(S.cur);
  S.cur = id;
  const groups = new Map(), seen = new Set();
  for (const a of S.adj.get(id) || []){
    const lab = (RELS[a.x.r] || RELS.related_to)[a.dir === 'out' ? 0 : 1];
    if (seen.has(lab + '|' + a.other)) continue;
    seen.add(lab + '|' + a.other);
    if (!groups.has(lab)) groups.set(lab, []);
    groups.get(lab).push({o:S.byId.get(a.other), note:a.x.note});
  }
  const relCount = [...groups.values()].reduce((n, l) => n + l.length, 0);
  const facts = Object.entries(e.facts);
  const d = $('#drawer');
  d.innerHTML = `<div class="dhead"><div class="l">${S.hist.length ? '<button class="btn small" data-back>← 返回</button>' : ''}<span class="tchip" style="--c:${col(e)}">${esc(typeZh(e.type))}</span><span class="st st-${e.status}">${esc(STATUS[e.status].zh)}</span></div><button class="x" data-close aria-label="关闭">✕</button></div>
    <h2 class="dtitle">${esc(title(e))}</h2>${sub(e) ? `<p class="dsub">${esc(sub(e))}</p>` : ''}<p class="did">${esc(e.id)}${e._origin !== 'seed' ? ` · ${e._origin === 'added' ? '新增条目' : '已编辑'}` : ''}</p>
    <div class="dmeta">${e.year != null ? `<span><b>${esc(when(e))}</b></span>` : ''}${e.region.length ? `<span>${e.region.map(r => esc(REGIONS[r] || r)).join(' · ')}</span>` : ''}${e.domains.map(k => `<span style="color:var(--d-${k})">● ${esc(DOM[k]?.zh || k)}</span>`).join('')}</div>
    ${e.summary ? `<p class="dsum">${esc(e.summary)}</p>` : ''}
    ${facts.length ? `<div class="dsec"><h4>资料</h4><dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}
    ${e.continuity.length ? `<div class="dsec"><h4>故事线</h4><div class="fopts">${e.continuity.map(c => `<span class="tag" style="cursor:default">${esc(c)}</span>`).join('')}</div></div>` : ''}
    ${e.tags.length || e.edition.length ? `<div class="dsec"><h4>标签与发行类型</h4><div class="fopts">${e.edition.map(x => `<button class="chip" data-edgo="${esc(x)}">${esc(EDITIONS[x] || x)}</button>`).join('')}${e.tags.map(t => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div></div>` : ''}
    ${groups.size ? `<div class="dsec"><h4>关系 · ${relCount}</h4>${[...groups].map(([lab, list]) => `<div class="rgroup"><span class="lab">${esc(lab)}</span><div class="cs">${list.map(({o, note}) => `<button class="chip ent" style="--c:${col(o)}" data-open="${esc(o.id)}"><span class="dt"></span><span class="t">${esc(short(o))}</span>${note ? `<span class="note-i">${esc(note)}</span>` : ''}</button>`).join('')}</div></div>`).join('')}</div>` : ''}
    <div class="dsec"><h4>来源</h4>${e.source.length ? `<ol class="srcs">${e.source.map(s => s && s.url ? `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label || s.url)}</a></li>` : `<li>${esc(s && s.label || s)}</li>`).join('')}</ol>` : `<p style="color:var(--ink-3);font-size:13.5px">还没有记录来源。</p>`}</div>
    <div class="dact"><button class="btn small" data-locate="${esc(e.id)}">在关系网络中定位</button>${S.canEdit ? `<button class="btn small" data-edit="${esc(e.id)}">编辑</button>${e._origin === 'override' ? `<button class="btn small" data-restore="${esc(e.id)}">恢复原始版本</button>` : ''}<button class="btn small danger" data-del="${esc(e.id)}">删除</button>` : ''}</div>`;
  d.hidden = false; d.scrollTop = 0;
  $('[data-close]', d).focus({preventScroll:true});
  try { history.replaceState(null, '', '#' + id); } catch {}
}
function closeDrawer(){ $('#drawer').hidden = true; S.hist = []; S.cur = null; try { history.replaceState(null, '', '#' + S.view); } catch {} }

/* ---------- editing (db) ---------- */
function slug(s){ return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
function relRow(r = '', t = '', i = 0){
  return `<div class="relrow"><select id="f-rr-${i}" aria-label="关系类型">${Object.entries(RELS).filter(([k]) => k !== 'in_region').map(([k, v]) => `<option value="${k}"${k === r ? ' selected' : ''}>${esc(v[0])} · ${k}</option>`).join('')}</select><input id="f-rt-${i}" list="entList" value="${esc(t)}" placeholder="目标条目 id，如 chr.timothy" aria-label="目标条目"><button class="x" type="button" data-relrm aria-label="删除这条关系">✕</button></div>`;
}
function openForm(id){
  const e = id ? S.byId.get(id) : null;
  $('#entList').innerHTML = S.list.map(x => `<option value="${esc(x.id)}">${esc(title(x))}</option>`).join('');
  const m = $('#modal');
  const chk = (name, map, sel) => Object.entries(map).map(([k, l]) => `<label><input type="checkbox" id="f-${name}-${k}" name="${name}" value="${k}"${sel.includes(k) ? ' checked' : ''}> ${esc(l)}</label>`).join('');
  m.innerHTML = `<form class="mpanel" id="eform" novalidate><h3>${e ? '编辑条目' : '添加条目'}</h3><p style="color:var(--ink-2);font-size:13.5px">只要和 Dumbo 有直接或可追溯的关系，就可以收进来。不确定的信息也可以先记，把来源可信度标成“藏家记录”或“待核实”。</p>
  <div class="form">
    <div class="field"><label for="f-zh">中文名</label><input id="f-zh" value="${esc(e?.zh || '')}" placeholder="85 周年毛绒挂件"></div>
    <div class="field"><label for="f-name">原名 / 英文名</label><input id="f-name" value="${esc(e?.name || '')}" placeholder="Dumbo 85th Plush Keychain"></div>
    <div class="field"><label for="f-type">类型</label><select id="f-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}"${(e?.type || 'Merchandise') === k ? ' selected' : ''}>${esc(v[0])} · ${k}</option>`).join('')}</select></div>
    <div class="field"><label for="f-dom">主领域</label><select id="f-dom">${DOMAINS.map(d => `<option value="${d.key}"${(e?.domains[0] || 'merch') === d.key ? ' selected' : ''}>${esc(d.zh)}</option>`).join('')}</select></div>
    <div class="field full"><span class="lb">其他领域</span><div class="checks">${chk('dx', Object.fromEntries(DOMAINS.map(d => [d.key, d.zh])), e ? e.domains.slice(1) : [])}</div></div>
    <div class="field"><label for="f-year">年份</label><input id="f-year" type="number" inputmode="numeric" value="${esc(e?.year ?? '')}" placeholder="2026"></div>
    <div class="field"><label for="f-date">具体日期</label><input id="f-date" value="${esc(e?.date || '')}" placeholder="2026-10-23"></div>
    <div class="field full"><span class="lb">地区</span><div class="checks">${chk('rg', REGIONS, e?.region || [])}</div></div>
    <div class="field full"><span class="lb">发行类型</span><div class="checks">${chk('ed', EDITIONS, e?.edition || [])}</div></div>
    <div class="field full"><label for="f-tags">标签（用逗号分隔）</label><input id="f-tags" value="${esc((e?.tags || []).join(', '))}" placeholder="毛绒, 85周年, 挂件"></div>
    <div class="field full"><label for="f-sum">简介</label><textarea id="f-sum" placeholder="是什么、在哪里卖、有什么特别">${esc(e?.summary || '')}</textarea></div>
    <div class="field full"><label for="f-facts">资料（每行一项，“键: 值”）</label><textarea id="f-facts" placeholder="价格: ¥3,300&#10;尺寸: 12 cm&#10;零售: Disney Store Japan">${esc(Object.entries(e?.facts || {}).map(([k, v]) => `${k}: ${v}`).join('\n'))}</textarea></div>
    <div class="field full"><span class="lb">关系</span><div id="f-rels">${(e?.rel?.length ? e.rel : [['depicts','chr.dumbo']]).map((r, i) => relRow(r[0], r[1], i)).join('')}</div><button class="btn small" type="button" data-reladd style="align-self:flex-start">添加一条关系</button></div>
    <div class="field"><label for="f-status">来源可信度</label><select id="f-status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${(e?.status || 'collector-reported') === k ? ' selected' : ''}>${esc(v.zh)} · ${esc(v.desc)}</option>`).join('')}</select></div>
    <div class="field"><label for="f-id">编号</label><input id="f-id" value="${esc(e?.id || '')}" placeholder="留空自动生成"${e ? ' readonly' : ''}></div>
    <div class="field full"><label for="f-src">来源（每行一个，“标题 | 链接”）</label><textarea id="f-src" placeholder="Disney Store Japan 新品页 | https://...">${esc((e?.source || []).map(s => s && s.url ? `${s.label || ''} | ${s.url}` : (s?.label || s || '')).join('\n'))}</textarea></div>
  </div>
  <div class="mfoot"><span class="err" id="f-err" role="alert"></span><div style="display:flex;gap:8px"><button class="btn" type="button" data-mclose>取消</button><button class="btn primary" type="submit" id="f-save">保存</button></div></div></form>`;
  m.hidden = false; m.dataset.edit = e ? e.id : '';
  $('#f-zh').focus();
}
function closeForm(){ $('#modal').hidden = true; $('#modal').innerHTML = ''; }
async function submitForm(){
  const v = s => $(s).value.trim(), err = $('#f-err');
  const zh = v('#f-zh'), name = v('#f-name'), type = v('#f-type');
  if (!zh && !name){ err.textContent = '请至少填写中文名或原名。'; return; }
  const yearRaw = v('#f-year'); const year = yearRaw ? parseInt(yearRaw, 10) : null;
  if (yearRaw && !(year >= 1800 && year <= 2200)){ err.textContent = '年份需要是 1800 到 2200 之间的四位数字。'; return; }
  const date = v('#f-date');
  if (date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(date)){ err.textContent = '日期请写成 2026-10-23 这样的格式。'; return; }
  const editing = $('#modal').dataset.edit;
  let id = editing || v('#f-id');
  if (!id){ id = `${TYPES[type][1]}.${slug(name) || Date.now().toString(36)}`; let n = 2, b = id; while (S.byId.has(id)) id = `${b}-${n++}`; }
  if (!/^[A-Za-z0-9_.~:@+-]{1,120}$/.test(id) || id === '.' || id === '..'){ err.textContent = '编号只能包含字母、数字和 . _ - 等符号。'; return; }
  if (!editing && S.byId.has(id)){ err.textContent = `编号 ${id} 已经存在，换一个或留空自动生成。`; return; }
  const checked = n => $$(`input[name="${n}"]:checked`).map(x => x.value);
  const dom = v('#f-dom');
  const facts = {}; v('#f-facts').split('\n').forEach(l => { const m = l.match(/^\s*([^:：]+)[:：]\s*(.+)$/); if (m) facts[m[1].trim()] = m[2].trim(); });
  const source = v('#f-src').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [a, b] = l.split('|').map(s => s.trim()); return b ? {label:a || b, url:b} : (/^https?:\/\//.test(a) ? {label:a, url:a} : {label:a}); });
  const rel = [], bad = [];
  $$('#f-rels .relrow').forEach(r => { const rr = $('select', r).value, t = $('input', r).value.trim(); if (!t) return; if (S.byId.has(t) && t !== id) rel.push([rr, t]); else bad.push(t); });
  if (bad.length){ err.textContent = `找不到这些目标条目：${bad.join('、')}。请从下拉建议里选择已有的编号。`; return; }
  const obj = {id, type, zh, name, domains:[dom, ...checked('dx').filter(k => k !== dom)], year, date, region:checked('rg'), edition:checked('ed'),
    tags:v('#f-tags').split(/[,，]/).map(s => s.trim()).filter(Boolean), summary:v('#f-sum'), facts, rel, status:v('#f-status'), source, updated_at:new Date().toISOString()};
  const prev = editing ? S.byId.get(editing) : null;
  if (prev){ for (const k of ['short','continuity','geo','code','end']) if (prev[k] != null) obj[k] = prev[k]; }
  $('#f-save').disabled = true; err.textContent = '';
  const ok = await write(id, JSON.parse(JSON.stringify(obj)));
  if (ok){ closeForm(); toast(`已保存「${title(obj)}」`); setTimeout(() => openEntity(id, false), 50); }
  else { const b = $('#f-save'); if (b) b.disabled = false; }
}
async function write(id, body){
  if (!S.db){ toast('现在无法保存：需要在 claude.ai 里打开这个页面。'); return false; }
  try { await S.db.collection('entities').doc(id).set(body); S.remote.set(id, body); rebuild(); rerender(); return true; }
  catch (e){ handleDbError(e); return false; }
}
async function removeRemote(id){
  try { await S.db.collection('entities').doc(id).delete(); S.remote.delete(id); rebuild(); rerender(); return true; }
  catch (e){ handleDbError(e); return false; }
}
function handleDbError(e){
  const c = e && e.code;
  if (c === 'invalid_argument'){ S.canEdit = false; updateEditUI(); toast('你对这个页面没有编辑权限，内容没有保存。'); }
  else if (c === 'quota_exceeded') toast('页面数据库已满，没有保存。删除一些不需要的条目后再试。');
  else if (c === 'resource_exhausted') toast('操作太频繁了，请等几秒再保存。');
  else toast('暂时无法保存，请稍后再试。');
}
async function deleteEntity(id, btn){
  if (btn.dataset.confirm !== '1'){ btn.dataset.confirm = '1'; btn.textContent = '再点一次确认删除'; setTimeout(() => { if (btn.isConnected){ btn.dataset.confirm = ''; btn.textContent = '删除'; } }, 4000); return; }
  const e = S.byId.get(id); const isSeed = SEED.some(x => x.id === id);
  const ok = isSeed ? await write(id, {id, _deleted:true, updated_at:new Date().toISOString()}) : await removeRemote(id);
  if (ok){ closeDrawer(); toast(`已删除「${title(e)}」`); }
}
function updateEditUI(){
  $('#addBtn').hidden = !S.canEdit;
  $('#foot-db').textContent = S.db ? (S.canEdit ? '编辑模式：新增与修改会保存到页面数据库' : '只读模式') : '';
  if (!$('#drawer').hidden && S.cur) openEntity(S.cur, false);
}
async function initDb(){
  if (!window.claude || typeof window.claude.use !== 'function') return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db) return;
    S.db = db;
    db.collection('entities').onSnapshot(snap => {
      S.remote = new Map(snap.docs.map(d => [d.id, d.data()]));
      rebuild(); rerender();
    }, err => { console.warn('db subscription ended', err && err.code); });
    let can = true;
    if (user){ try { can = await user.canEdit(); } catch { can = false; } }
    S.canEdit = !!can; updateEditUI(); if (S.view === 'schema') renderSchema();
  } catch (e){ console.warn('db unavailable', e); }
}

/* ---------- misc ---------- */
let toastT = 0;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); }
function copyJSON(which){
  const list = which === 'added' ? S.list.filter(e => e._origin !== 'seed') : S.list;
  const txt = JSON.stringify(list.map(({_origin, ...e}) => e), null, 2);
  const out = $('#copyout');
  const fallback = () => { out.hidden = false; out.value = txt; out.focus(); out.select(); toast('已显示在下方文本框，按 Ctrl+C 复制。'); };
  try { navigator.clipboard.writeText(txt).then(() => toast(`已复制 ${list.length} 个条目的 JSON`), fallback); } catch { fallback(); }
}
function render(v){
  ({universe:renderUniverse, graph:renderGraph, archive:renderArchive, timeline:renderTimeline, world:renderWorld, design:renderDesign, schema:renderSchema})[v]();
}
function rerender(){ render(S.view); if (S.view !== 'universe') S._uniDirty = true; if (!$('#drawer').hidden && S.cur){ if (S.byId.has(S.cur)) openEntity(S.cur, false); else closeDrawer(); } }
function go(v, keepDrawer){
  if (!VIEWS.includes(v)) v = 'universe';
  S.view = v;
  $$('.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
  $$('.tabs button').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (v === 'archive'){ const fb = $('#facetsBox'); if (!S._fbInit){ S._fbInit = true; if (matchMedia('(max-width:860px)').matches) fb.open = false; } }
  render(v);
  if (!keepDrawer) closeDrawer();
  try { history.replaceState(null, '', '#' + v); } catch {}
  window.scrollTo({top:0});
}

/* ---------- events ---------- */
document.addEventListener('click', ev => {
  const t = ev.target;
  const c = sel => t.closest(sel);
  let el;
  if ((el = c('[data-view]'))) return go(el.dataset.view);
  if ((el = c('[data-go]'))) return go(el.dataset.go);
  if ((el = c('[data-close]'))) return closeDrawer();
  if ((el = c('[data-back]'))) { const p = S.hist.pop(); if (p) openEntity(p, false); return; }
  if ((el = c('[data-open]'))) return openEntity(el.dataset.open);
  if ((el = c('#orbit [data-id]'))) return openEntity(el.dataset.id);
  if ((el = c('[data-dom]'))) { resetFilters(); S.f.domain.add(el.dataset.dom); return go('archive'); }
  if ((el = c('[data-domgo]'))) { resetFilters(); S.f.domain.add(el.dataset.domgo); return go('archive'); }
  if ((el = c('[data-typego]'))) { resetFilters(); S.f.type.add(el.dataset.typego); return go('archive'); }
  if ((el = c('[data-edgo]'))) { resetFilters(); S.f.edition.add(el.dataset.edgo); return go('archive'); }
  if ((el = c('[data-tag]'))) { resetFilters(); S.f.tag = el.dataset.tag; return go('archive'); }
  if ((el = c('[data-preset]'))) return applyPreset(PRESETS[+el.dataset.preset]);
  if ((el = c('[data-facet]'))) { const s = S.f[el.dataset.facet], v = el.dataset.val; s.has(v) ? s.delete(v) : s.add(v); return renderArchive(); }
  if ((el = c('[data-unset]'))) {
    const k = el.dataset.unset;
    if (k === 'all') resetFilters(); else if (k === 'q'){ S.f.q = ''; $('#q').value = ''; } else if (k === 'tag') S.f.tag = ''; else if (k === 'years'){ S.f.yFrom = ''; S.f.yTo = ''; } else S.f[k].delete(el.dataset.val);
    return renderArchive();
  }
  if ((el = c('[data-tl]'))) { const k = el.dataset.tl; if (!k) S.tl.clear(); else S.tl.has(k) ? S.tl.delete(k) : S.tl.add(k); return renderTimeline(); }
  if ((el = c('[data-cluster]'))) { S.wsel = {kind:'cluster', key:el.dataset.cluster}; return renderWorld(); }
  if ((el = c('[data-region]'))) { S.wsel = {kind:'region', key:el.dataset.region}; return renderWorld(); }
  if ((el = c('[data-era]'))) { S.era = +el.dataset.era; return drawEra(); }
  if ((el = c('[data-copy]'))) return copyJSON(el.dataset.copy);
  if ((el = c('[data-zoom]'))) { if (G){ const k = +el.dataset.zoom; if (k) G.svg.transition().duration(250).call(G.zoom.scaleBy, k); else { G.pin = null; G.hl(null); G.svg.transition().duration(250).call(G.zoom.transform, d3.zoomIdentity); } } return; }
  if ((el = c('[data-locate]'))) { const id = el.dataset.locate; go('graph'); if (G) G.focus(id); return; }
  if ((el = c('#addBtn'))) return openForm(null);
  if ((el = c('[data-edit]'))) return openForm(el.dataset.edit);
  if ((el = c('[data-restore]'))) { const id = el.dataset.restore; removeRemote(id).then(ok => ok && toast('已恢复为原始版本')); return; }
  if ((el = c('[data-del]'))) return deleteEntity(el.dataset.del, el);
  if ((el = c('[data-mclose]'))) return closeForm();
  if ((el = c('[data-reladd]'))) { const box = $('#f-rels'); box.insertAdjacentHTML('beforeend', relRow('depicts', '', box.children.length + Date.now() % 1000)); return; }
  if ((el = c('[data-relrm]'))) { el.closest('.relrow').remove(); return; }
  if (t === $('#modal')) return closeForm();
});
document.addEventListener('submit', ev => { if (ev.target.id === 'eform'){ ev.preventDefault(); submitForm(); } });
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape'){ if (!$('#modal').hidden) closeForm(); else if (!$('#drawer').hidden) closeDrawer(); }
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.dn,.hub,.pin')){ ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
});
const orbit = $('#orbit');
orbit.addEventListener('mouseover', ev => { const n = ev.target.closest('[data-id]'); if (n) return orbitFocus(n.dataset.id); const d = ev.target.closest('[data-dom]'); if (d) return orbitDomain(d.dataset.dom); });
orbit.addEventListener('mouseleave', () => orbitFocus(null));
orbit.addEventListener('focusin', ev => { const d = ev.target.closest('[data-dom]'); if (d) orbitDomain(d.dataset.dom); else if (ev.target.closest('.hub')) orbitFocus('chr.dumbo'); });
orbit.addEventListener('focusout', () => orbitFocus(null));
let qT = 0;
$('#q').addEventListener('input', ev => { clearTimeout(qT); qT = setTimeout(() => { S.f.q = ev.target.value.trim(); if (S.view !== 'archive') go('archive'); else renderArchive(); }, 160); });
$('#q').addEventListener('keydown', ev => { if (ev.key === 'Enter'){ S.f.q = ev.target.value.trim(); go('archive'); } });
$('#gq').addEventListener('input', ev => { if (G) G.search(ev.target.value); });
$('#sort').addEventListener('change', ev => { S.f.sort = ev.target.value; renderArchive(); });
document.addEventListener('change', ev => { if (ev.target.id === 'yFrom' || ev.target.id === 'yTo'){ S.f[ev.target.id] = ev.target.value; renderArchive(); } });
$('#eraSlider').addEventListener('input', ev => { S.era = +ev.target.value; drawEra(); });
let rT = 0;
window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (S.view === 'graph'){ S.graphDirty = true; renderGraph(); } else S.graphDirty = true; }, 250); });

/* ---------- boot ---------- */
async function boot(){
  try {
    const r = await fetch('data/entities.json', {cache:'no-cache'});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    SEED = await r.json();
  } catch (e){
    console.warn('entities.json', e);
    $('#v-universe').insertAdjacentHTML('afterbegin', '<div class="empty" style="margin-bottom:24px">档案数据没有加载成功。请刷新页面重试；如果是在本地直接双击打开的文件，请改用 README 里的本地预览方式。</div>');
  }
  rebuild();
  const h = decodeURIComponent((location.hash || '').slice(1));
  if (VIEWS.includes(h)) go(h); else { go('universe'); if (S.byId.has(h)) openEntity(h); }
  window.addEventListener('hashchange', () => {
    const k = decodeURIComponent((location.hash || '').slice(1));
    if (VIEWS.includes(k)){ if (k !== S.view) go(k); }
    else if (S.byId.has(k) && k !== S.cur) openEntity(k);
  });
  initDb();
}
boot();
})();
