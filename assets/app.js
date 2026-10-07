/* Dumbo Universe · app */
(() => {
'use strict';
const REPO = 'https://github.com/xinyi-liu-ai/dumbo-universe';
let SEED = [];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const DOMAINS = [
  {key:'origins', zh:'起源', en:'Origins'},
  {key:'characters', zh:'角色', en:'Characters'},
  {key:'screen', zh:'影视与媒体', en:'Screen & Media'},
  {key:'parks', zh:'乐园', en:'Parks'},
  {key:'merch', zh:'商品', en:'Merchandise'},
  {key:'collections', zh:'系列与联名', en:'Collections'},
  {key:'events', zh:'周年与活动', en:'Events'},
  {key:'world', zh:'世界', en:'Around the World'},
  {key:'design', zh:'造型', en:'Design'},
  {key:'culture', zh:'文化足迹', en:'Culture'},
];
const DOM = Object.fromEntries(DOMAINS.map(d => [d.key, d]));
/* Editorial chapters for the home page; they group the data domains for readers. */
const CHAPTERS = [
  {key:'story', zh:'故事', en:'The Story', view:'story', domains:['origins','screen','culture'], c:'origins', q:'1939 年的原作、1941 年的电影、2019 年的重拍，以及它们留下的歌和争议'},
  {key:'characters', zh:'角色', en:'Characters', view:'story', anchor:'chars', domains:['characters'], c:'characters', q:'珍宝太太、Timothy、乌鸦们，还有 2019 版的 Farrier 一家'},
  {key:'parks', zh:'乐园', en:'Parks', view:'parks', domains:['parks'], c:'parks', q:'从 1955 年的 Disneyland 开始，六座乐园都有自己的飞象'},
  {key:'merch', zh:'商品', en:'Merchandise', view:'merch', domains:['merch','collections'], c:'merch', q:'周年系列、艺术家合作、百元店小物和 D23 限定'},
  {key:'years', zh:'85 年', en:'85 Years', view:'timeline', domains:['events'], c:'events', q:'1941 → 2026，每五年一次的周年纪念'},
  {key:'world', zh:'世界', en:'Around the World', view:'world', domains:['world'], c:'world', q:'美国、日本、中国、法国，Dumbo 在哪里'},
  {key:'design', zh:'造型', en:'Design Evolution', view:'design', domains:['design'], c:'design', q:'大耳朵、小帽子和越来越圆的脸'},
];
const CH = Object.fromEntries(CHAPTERS.map(c => [c.key, c]));
const CH_OF = {};
CHAPTERS.forEach(c => c.domains.forEach(d => { if (!CH_OF[d]) CH_OF[d] = c.key; }));
const TYPES = {Work:['作品','work'], Character:['角色','chr'], Person:['人物','per'], Attraction:['游乐设施','attr'], Place:['地点','place'], Event:['活动','evt'], Anniversary:['周年','ann'], Collection:['系列','col'], Merchandise:['商品','mer'], Retailer:['零售商','ret'], Brand:['品牌','brand'], Publication:['出版物','pub'], Music:['音乐','mus'], Media:['发行版本','med'], Award:['奖项','award'], Artwork:['美术','art'], Concept:['概念','con'], CulturalArtifact:['文化物件','cul'], Region:['地区','reg']};
const RELS = {
  appears_in:['登场作品','登场角色与事物'], depicts:['描绘角色','相关商品与作品'], best_friend_of:['最好的朋友','最好的朋友'], friend_of:['朋友','朋友'],
  parent_of:['孩子','父母'], sibling_of:['兄弟姐妹','兄弟姐妹'], helps:['帮助对象','帮助者'], manager_of:['经纪对象','经纪人'],
  delivers:['送来的孩子','送子者'], mocks:['嘲笑对象','嘲笑者'],
  based_on:['改编自','改编作品'], adaptation_of:['翻拍自','翻拍版本'], sequel_of:['前作','续作'], edition_of:['影片','发行版本'],
  written_by:['作者 / 编剧','创作'], directed_by:['导演','导演作品'], produced_by:['制片','制片作品'], animated_by:['动画师','动画作品'],
  composed_by:['作曲','作曲作品'], lyrics_by:['作词','作词作品'], performed_by:['演唱','演唱作品'], voiced_by:['配音','配音角色'],
  illustrated_by:['插画','插画作品'], song_in:['所属作品','歌曲'], won:['获奖','获奖作品'], nominated_for:['提名','提名作品'],
  part_of_collection:['所属系列','系列单品'], sold_by:['销售渠道','销售的商品与系列'], released_for:['纪念','纪念商品与版本'],
  celebrates:['庆祝对象','周年纪念'], featured_at:['亮相活动','活动内容'], located_at:['位于','包含'], version_of:['原版','其他版本'],
  references:['提及','被提及于'], uses_motif:['母题','出现于'], associated_with:['关联','关联'], related_to:['相关','相关'],
  in_region:['地区','该地区条目'],
};
/* How a relation is drawn in the graph: story = solid, make = medium, merch = thin, assoc = dotted, geo = faint dashed. */
const REL_KIND = {};
Object.entries({
  story:['friend_of','best_friend_of','parent_of','sibling_of','helps','manager_of','delivers','mocks','appears_in'],
  make:['based_on','adaptation_of','sequel_of','edition_of','version_of','written_by','directed_by','produced_by','animated_by','composed_by','lyrics_by','performed_by','voiced_by','illustrated_by','song_in','won','nominated_for'],
  merch:['depicts','part_of_collection','sold_by','released_for','celebrates','featured_at'],
  assoc:['uses_motif','associated_with','related_to','references'],
  geo:['in_region','located_at'],
}).forEach(([k, list]) => list.forEach(r => { REL_KIND[r] = k; }));
const KINDS = [['story','剧情与人物关系'], ['make','创作与作品谱系'], ['merch','商品、系列与纪念'], ['assoc','关联与引用'], ['geo','地区']];
/* How relations are grouped in the detail panel. */
const REL_GROUPS = [
  ['家人', ['parent_of','sibling_of']],
  ['朋友与搭档', ['best_friend_of','friend_of','manager_of']],
  ['互动', ['helps','delivers','mocks']],
  ['登场与出现', ['appears_in','depicts']],
  ['幕后', ['written_by','directed_by','produced_by','animated_by','composed_by','lyrics_by','performed_by','voiced_by','illustrated_by']],
  ['作品谱系', ['based_on','adaptation_of','sequel_of','edition_of','version_of','song_in']],
  ['荣誉', ['won','nominated_for']],
  ['商品、系列与纪念', ['part_of_collection','sold_by','released_for','celebrates','featured_at']],
  ['关联概念', ['uses_motif','associated_with','related_to','references']],
  ['地区', ['in_region','located_at']],
];
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
const ICON = {
  film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  disc:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5"/>',
  note:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  carousel:'<path d="M12 2v3"/><path d="M3.5 9 12 5l8.5 4z"/><path d="M6 9v7M12 9v9M18 9v7"/><circle cx="6" cy="17" r="1.6"/><circle cx="18" cy="17" r="1.6"/><path d="M3 21h18"/>',
  ticket:'<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14.5 7.5v1.5M14.5 11.25v1.5M14.5 15v1.5"/>',
  stack:'<rect x="7" y="3" width="13" height="14" rx="2"/><path d="M4 7v11a3 3 0 0 0 3 3h10"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  store:'<path d="M4 10v10h16V10"/><path d="M3 10 5 4h14l2 6"/><path d="M3 10c0 2.2 4.5 2.2 4.5 0 0 2.2 4.5 2.2 4.5 0 0 2.2 4.5 2.2 4.5 0 0 2.2 4.5 2.2 4.5 0"/><path d="M10 20v-5h4v5"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  feather:'<path d="M20 4C11 4 6 9 5 19"/><path d="M20 4c0 8-5.5 12.5-13 12"/><path d="M5 19l-2 2M9 15l6-6"/>',
  sparkle:'<path d="M12 3c.6 4.7 2.3 6.4 7 7-4.7.6-6.4 2.3-7 7-.6-4.7-2.3-6.4-7-7 4.7-.6 6.4-2.3 7-7z"/><path d="M19 16v4M17 18h4"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 20h8"/>',
  brush:'<path d="M14.5 3.5 20.5 9.5 12 18l-6-6z"/><path d="M6 12c-2 .5-3 2-3 4 0 1.5-.5 3-1 4 3.5 0 7-.5 8-4"/>',
  magazine:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
  star:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  mouse:'<circle cx="6.5" cy="7.5" r="4"/><circle cx="17.5" cy="7.5" r="4"/><path d="M5 15c0-4 3-7 7-7s7 3 7 7c0 3-3 5.5-7 5.5S5 18 5 15z"/><path d="M10 14h.01M14 14h.01M12 17v.5"/>',
  bird:'<path d="M2 13c4-.5 6.5-3.5 7.5-7.5 2 4.5 5 6.5 9 6.5l3.5-2-2 4.5c-3 5-10.5 6-15 2.5z"/><path d="M17 11h.01"/>',
  train:'<rect x="3" y="6" width="11" height="10" rx="2"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18.5" r="2"/><circle cx="17" cy="18.5" r="2"/><path d="M6 2.5v3.5M3 10h11"/>',
  hat:'<path d="M7 4h10v11H7z"/><path d="M3 15.5h18"/><path d="M7 11h10"/>',
};
const ICON_OF_TYPE = {Work:'film', Character:'star', Person:'person', Attraction:'carousel', Place:'pin', Event:'ticket', Anniversary:'ticket', Collection:'stack', Merchandise:'tag', Retailer:'store', Brand:'tag', Publication:'book', Music:'note', Media:'disc', Award:'trophy', Artwork:'brush', Concept:'sparkle', CulturalArtifact:'magazine', Region:'pin'};
const ICON_OF_ID = {'chr.dumbo':'elephant', 'chr.mrsjumbo':'elephant', 'chr.matriarch':'elephant', 'des.ears':'elephant', 'con.pinkelephants':'elephant', 'chr.timothy':'mouse', 'chr.stork':'bird', 'chr.crows':'bird', 'chr.caseyjr':'train', 'attr.caseyjr':'train', 'chr.ringmaster':'hat', 'chr.clowns':'hat', 'des.hatcollar':'hat', 'con.feather':'feather'};
/* The 1941 plot as ten scenes, in story order. */
const BEATS = [
  {t:'送子鹳送来的宝宝', d:'马戏团的冬季驻地，鹳鸟们给动物妈妈们送来宝宝。送子鹳先生最后一个赶到，把 Jumbo Jr. 交给了珍宝太太。', ids:['chr.stork','chr.mrsjumbo']},
  {t:'一对太大的耳朵', d:'宝宝打了个喷嚏，露出一对巨大的耳朵。象群立刻笑成一团，给他起了外号 Dumbo。', ids:['chr.matriarch','des.ears']},
  {t:'“疯象”', d:'马戏团开张后，一群男孩围着 Dumbo 取笑他的耳朵。珍宝太太为保护儿子发了怒，被当成疯象关进笼子。', ids:['chr.mrsjumbo','chr.ringmaster']},
  {t:'Timothy 站了出来', d:'象群把 Dumbo 孤立在一边。小老鼠 Timothy 吓跑了怕老鼠的大象们，决定帮 Dumbo 成为明星。', ids:['chr.timothy']},
  {t:'大象金字塔', d:'Timothy 夜里在团长耳边出主意，让 Dumbo 站上大象金字塔的顶端。结果 Dumbo 被自己的耳朵绊倒，金字塔和大帐篷一起塌了。', ids:['chr.ringmaster']},
  {t:'小丑节目', d:'Dumbo 被降去演小丑，在“着火的高楼”节目里扮演从高台上往下跳的宝宝。', ids:['chr.clowns']},
  {t:'Baby Mine', d:'Timothy 带 Dumbo 去见被关起来的妈妈。母子只能隔着栏杆，用鼻子拥抱。', ids:['mus.babymine','chr.mrsjumbo']},
  {t:'粉红大象', d:'Dumbo 和 Timothy 误喝了掺了香槟的水，看到一场粉红大象游行的幻觉。', ids:['con.pinkelephants','mus.pinkparade']},
  {t:'树上醒来', d:'第二天，两人在一棵高树上醒来。乌鸦们起初嘲笑他们；Timothy 推断 Dumbo 是用耳朵飞上来的。乌鸦们送给 Dumbo 一根“魔法羽毛”。', ids:['chr.crows','mus.elephantfly','con.feather']},
  {t:'飞起来', d:'下一场表演里，Dumbo 从高处跳下时羽毛掉了。Timothy 告诉他羽毛从来没有魔法。Dumbo 靠自己飞了起来，成了明星，珍宝太太也被放了出来。', ids:['con.flight','chr.timothy']},
];
const VIEWS = ['universe','story','parks','merch','graph','timeline','world','design','archive','schema'];

const S = {
  remote:new Map(), list:[], byId:new Map(), edges:[], adj:new Map(), chars:new Map(),
  view:'universe', db:null, canEdit:false, showGeo:false, hist:[], cur:null, graphDirty:true, tl:new Set(), wsel:{kind:'region', key:'JP'}, era:0,
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
const chapterOf = e => CH_OF[e.domains[0]] || 'story';
function goChapter(key){
  const ch = CH[key]; if (!ch) return;
  go(ch.view);
  if (ch.anchor){ const el = document.getElementById(ch.anchor); if (el) el.scrollIntoView({block:'start'}); }
}
function renderUniverse(){
  countdown(); renderStats();
  $('#presets').innerHTML = PRESETS.map((p, i) => `<button class="preset" data-preset="${i}">${esc(p.label)}</button>`).join('');
  const C = 480, R1 = 182, R2 = 318, RL = R2 + 13, GAP = 0.06;
  const groups = CHAPTERS.map(ch => ({ch, items:S.list.filter(e => chapterOf(e) === ch.key).sort(byYear)}));
  const slots = groups.reduce((n, g) => n + Math.max(g.items.length, 1), 0);
  const step = (Math.PI * 2 - GAP * groups.length) / slots;
  const pos = new Map(), cpos = [];
  let a = -Math.PI / 2 + GAP / 2;
  for (const g of groups){
    const n = Math.max(g.items.length, 1), a0 = a;
    g.items.forEach((e, i) => { const t = a0 + step * (i + .5); pos.set(e.id, {t, x:C + R2 * Math.cos(t), y:C + R2 * Math.sin(t), e, c:g.ch.c}); });
    const mid = a0 + step * n / 2;
    cpos.push({g, a0, a1:a0 + step * n, mid, x:C + R1 * Math.cos(mid), y:C + R1 * Math.sin(mid)});
    a += step * n + GAP;
  }
  const f1 = v => v.toFixed(1);
  let h = `<circle class="ring d" cx="${C}" cy="${C}" r="${R1}"/><circle class="ring" cx="${C}" cy="${C}" r="${R2}"/>`;
  for (const d of cpos){
    h += `<line class="spoke" x1="${C}" y1="${C}" x2="${f1(d.x)}" y2="${f1(d.y)}"/>`;
    const r = R2 - 14, sx = C + r * Math.cos(d.a0 + .01), sy = C + r * Math.sin(d.a0 + .01), ex = C + r * Math.cos(d.a1 - .01), ey = C + r * Math.sin(d.a1 - .01);
    h += `<path class="arc" style="stroke:var(--d-${d.g.ch.c})" d="M${f1(sx)} ${f1(sy)}A${r} ${r} 0 ${d.a1 - d.a0 > Math.PI ? 1 : 0} 1 ${f1(ex)} ${f1(ey)}"/>`;
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
    h += `<circle class="dot" data-id="${esc(id)}" style="fill:var(--d-${p.c})" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${id === 'chr.dumbo' ? 7 : 4.6}"/>`;
    h += `<circle class="hit" data-id="${esc(id)}" cx="${f1(p.x)}" cy="${f1(p.y)}" r="10"><title>${esc(title(p.e))}</title></circle>`;
    h += `<text class="el" data-id="${esc(id)}" text-anchor="${flip ? 'end' : 'start'}" transform="translate(${f1(lx)} ${f1(ly)}) rotate(${f1(flip ? dg + 180 : dg)})">${esc(lab)}</text>`;
  }
  for (const d of cpos){
    const ch = d.g.ch;
    h += `<g class="dn" data-ch="${ch.key}" role="button" tabindex="0" aria-label="${esc(ch.zh)}：${d.g.items.length} 个条目"><circle cx="${f1(d.x)}" cy="${f1(d.y)}" r="38" style="stroke:var(--d-${ch.c})"/><text class="dz" x="${f1(d.x)}" y="${f1(d.y - 7)}">${esc(ch.zh)}</text><text class="dc" x="${f1(d.x)}" y="${f1(d.y + 13)}">${d.g.items.length}</text></g>`;
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
  $('#orbit').innerHTML = h;
  $('#domains').innerHTML = groups.map(g => {
    const ex = [...g.items].sort((a, b) => deg(b.id) - deg(a.id)).slice(0, 3).map(short).join(' · ');
    return `<button class="dcard" style="--c:var(--d-${g.ch.c})" data-ch="${g.ch.key}"><span class="row"><h3>${esc(g.ch.zh)}</h3><span class="n">${g.items.length}</span></span><span class="en">${esc(g.ch.en)}</span><p>${esc(g.ch.q)}</p><span class="ex">${esc(ex || '还没有条目')}</span></button>`;
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
  const e = S.byId.get(id); if (e) $$('.dn', svg).forEach(n => { if (n.dataset.ch === chapterOf(e)) n.classList.add('on'); });
}
function orbitChapter(key){
  const svg = $('#orbit');
  $$('.on', svg).forEach(n => n.classList.remove('on'));
  svg.classList.add('focus');
  $$('.dot,.el', svg).forEach(n => { const e = S.byId.get(n.dataset.id); if (e && chapterOf(e) === key) n.classList.add('on'); });
  $$('.dn', svg).forEach(n => { if (n.dataset.ch === key) n.classList.add('on'); });
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

/* ---------- visuals ---------- */
function iconName(e){
  if (ICON_OF_ID[e.id]) return ICON_OF_ID[e.id];
  if (e.type === 'Character' && e.continuity.includes('2019 真人')) return 'person';
  return ICON_OF_TYPE[e.type] || 'sparkle';
}
function iconSVG(name){
  if (name === 'elephant') return `<svg class="ic" viewBox="-52 -46 104 92" aria-hidden="true"><g fill="currentColor"><ellipse cx="-30" cy="-2" rx="22" ry="20" opacity=".5"/><ellipse cx="30" cy="-2" rx="22" ry="20" opacity=".5"/><circle r="19"/><path d="M-6 10C-8 24-2 34 10 34l1-6C3 28 1 20 5 11z"/></g><circle cx="-7" cy="-3" r="2.6" style="fill:var(--card)"/><circle cx="7" cy="-3" r="2.6" style="fill:var(--card)"/><path d="M-9-17 0-36 9-17z" style="fill:var(--gold)"/></svg>`;
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ICON.sparkle}</svg>`;
}
function credit(img){
  const who = esc(img.credit || '未署名'), lic = esc(img.license || '');
  return `图片：${img.page ? `<a href="${esc(img.page)}" target="_blank" rel="noopener noreferrer">${who}</a>` : who}${lic ? ` · ${lic}` : ''}${img.note ? ` · ${esc(img.note)}` : ''}`;
}
function visual(e, cls){
  const img = e.image && typeof e.image === 'object' ? e.image : (typeof e.image === 'string' ? {src:e.image} : null);
  if (img && img.src) return `<figure class="vis photo ${cls}"><div class="ph"><img src="${esc(img.src)}" alt="${esc(title(e))}" loading="lazy" referrerpolicy="no-referrer"></div><figcaption>${credit(img)}</figcaption></figure>`;
  const big = e.type === 'Anniversary' && e.year ? `<span class="art-n">${e.year - 1941}</span>` : iconSVG(iconName(e));
  return `<div class="vis art ${cls}" style="--c:${col(e)}" aria-hidden="true">${big}${e.year != null && e.type !== 'Anniversary' ? `<span class="art-y">${esc(e.year)}</span>` : ''}</div>`;
}

/* ---------- graph ---------- */
let G = null;
function hopsFrom(root){
  const h = new Map([[root, 0]]), q = [root];
  while (q.length){
    const id = q.shift();
    for (const a of S.adj.get(id) || []){
      if (a.x.virtual || REL_KIND[a.x.r] === 'geo' || h.has(a.other)) continue;
      h.set(a.other, h.get(id) + 1); q.push(a.other);
    }
  }
  return h;
}
function renderGraph(){
  const box = $('#graph');
  $('#legend').innerHTML = DOMAINS.map(d => `<button class="chip" style="--c:var(--d-${d.key})" data-gdom="${d.key}" aria-pressed="${!!G && G.domPin === d.key}"><span class="dt"></span>${esc(d.zh)}</button>`).join('');
  $('#elegend').innerHTML = KINDS.map(([k, l]) => `<span class="ek"><svg width="36" height="10" aria-hidden="true"><line class="gl k-${k}" x1="2" y1="5" x2="34" y2="5"/></svg>${esc(l)}</span>`).join('')
    + `<label class="ek"><input type="checkbox" id="geoToggle"${S.showGeo ? ' checked' : ''}> 显示地区连线</label>`;
  if (!window.d3){ box.innerHTML = '<div class="empty">关系网络需要 D3 图形库，但它没有加载成功。请检查网络后刷新页面；其他页面不受影响。</div>'; return; }
  if (!S.graphDirty && G) return;
  S.graphDirty = false;
  if (G) G.sim.stop();
  box.innerHTML = '';
  const w = Math.max(box.clientWidth, 320), h = Math.round(Math.max(540, Math.min(860, w * .72)));
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 34;
  const ringR = [0, .3, .56, .8, .97].map(f => f * R);
  const hop = hopsFrom('chr.dumbo');
  const isRoot = d => d.id === 'chr.dumbo';
  const nodes = S.list.map(e => ({id:e.id, e, dg:deg(e.id), hop:hop.has(e.id) ? Math.min(hop.get(e.id), 4) : 4}));
  /* Label tiers: 0 = Dumbo, 1 = core story nodes shown at rest, 2 = shown when zoomed in, 3 = shown when zoomed in further. */
  const CORE = ['characters', 'origins', 'screen', 'parks', 'events'];
  nodes.forEach(n => { n.tier = isRoot(n) ? 0 : ((n.hop === 1 && CORE.includes(n.e.domains[0]) && n.dg >= 3) || n.dg >= 10) ? 1 : (n.hop === 1 || n.dg >= 5) ? 2 : 3; });
  const links = S.edges.map(x => ({source:x.s, target:x.t, kind:x.virtual ? 'geo' : (REL_KIND[x.r] || 'assoc')}));
  const rad = d => isRoot(d) ? 26 : Math.min(13, 4 + Math.sqrt(d.dg) * 1.5);
  const svg = d3.select(box).append('svg').attr('class', 'gsvg').attr('viewBox', [0, 0, w, h]).attr('role', 'img').attr('aria-label', 'Dumbo 宇宙关系网络');
  const root = svg.append('g');
  root.append('g').attr('class', 'rings').selectAll('circle').data(ringR.slice(1, 4)).join('circle').attr('cx', cx).attr('cy', cy).attr('r', r => r);
  const link = root.append('g').selectAll('line').data(links).join('line').attr('class', d => `gl k-${d.kind}`);
  const node = root.append('g').selectAll('g').data(nodes).join('g').attr('class', d => 'gn' + (isRoot(d) ? ' root' : '') + (d.tier <= 1 ? ' lbl' : ''));
  node.append('circle').attr('r', rad).style('fill', d => col(d.e));
  node.append('text').text(d => short(d.e)).attr('x', d => isRoot(d) ? 0 : rad(d) + 4).attr('y', d => isRoot(d) ? rad(d) + 20 : 4).attr('text-anchor', d => isRoot(d) ? 'middle' : null);
  node.append('title').text(d => title(d.e));
  const dist = {story:58, make:70, merch:58, assoc:80, geo:160}, str = {story:.5, make:.35, merch:.35, assoc:.2, geo:.015};
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(l => dist[l.kind]).strength(l => str[l.kind]))
    .force('charge', d3.forceManyBody().strength(-110))
    .force('collide', d3.forceCollide(d => rad(d) + 5))
    .force('radial', d3.forceRadial(d => ringR[d.hop], cx, cy).strength(d => isRoot(d) ? 0 : .6));
  const hub = nodes.find(isRoot); if (hub){ hub.fx = cx; hub.fy = cy; }
  const tick = () => { link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y); node.attr('transform', d => `translate(${d.x.toFixed(1)},${d.y.toFixed(1)})`); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches){ sim.stop(); for (let i = 0; i < 300; i++) sim.tick(); tick(); } else sim.on('tick', tick);
  const zoom = d3.zoom().scaleExtent([.4, 5])
    .filter(ev => ev.type === 'wheel' ? (ev.ctrlKey || ev.metaKey) : !ev.button)
    .on('zoom', ev => { root.attr('transform', ev.transform); const k = ev.transform.k, lv = k < 1.3 ? 1 : k < 2.1 ? 2 : 3; node.classed('lbl', d => d.tier <= lv); });
  svg.call(zoom);
  node.call(d3.drag()
    .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
    .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); if (!isRoot(d)){ d.fx = null; d.fy = null; } }));
  const nb = new Map(nodes.map(n => [n.id, new Set()]));
  links.forEach(l => { const s = l.source.id, t = l.target.id; l.nb = true; nb.get(s).add(t); nb.get(t).add(s); });
  const geoNb = new Map(nodes.map(n => [n.id, new Set()]));
  links.forEach(l => { if (l.kind !== 'geo'){ geoNb.get(l.source.id).add(l.target.id); geoNb.get(l.target.id).add(l.source.id); } });
  node.on('mouseenter', (ev, d) => { G.hover = d.id; paintGraph(); })
      .on('mouseleave', () => { G.hover = null; paintGraph(); })
      .on('click', (ev, d) => { ev.stopPropagation(); G.sel = d.id; G.domPin = null; paintGraph(); openEntity(d.id); });
  svg.on('click', ev => { if (ev.target.closest && ev.target.closest('.gn')) return; if (G.sel){ G.sel = null; paintGraph(); } });
  G = {sim, svg, zoom, node, link, w, h, sel:null, hover:null, dom:null, domPin:null,
    nbOf: id => (S.showGeo ? nb : geoNb).get(id) || new Set(),
    focus(id){
      G.sel = id; paintGraph();
      const n = nodes.find(x => x.id === id); if (!n) return;
      const go2 = () => svg.transition().duration(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600).call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(1.7).translate(-n.x, -n.y));
      setTimeout(go2, 650);
    },
    search(q){ q = q.trim().toLowerCase(); node.classed('match', d => !!q && [d.e.zh, d.e.name, d.e.short, ...d.e.tags].join(' ').toLowerCase().includes(q)); }};
  applyGeo();
  G.search($('#gq').value);
}
function applyGeo(){
  if (!G) return;
  G.link.style('display', d => d.kind === 'geo' && !S.showGeo ? 'none' : null);
  G.node.style('display', d => d.e.type === 'Region' && !S.showGeo ? 'none' : null);
}
function paintGraph(){
  if (!G) return;
  const {node, link} = G;
  const dom = G.dom || G.domPin;
  if (dom && !G.hover){
    const inDom = d => d.e.domains.includes(dom);
    node.classed('dim', d => !inDom(d)).classed('on', inDom).classed('n2', false).classed('sel', false);
    link.classed('on', false).classed('on2', l => inDom(l.source) && inDom(l.target)).classed('dim', l => !(inDom(l.source) && inDom(l.target)));
    return;
  }
  const f = G.hover || G.sel;
  if (!f){
    node.classed('dim', false).classed('on', false).classed('n2', false).classed('sel', false);
    link.classed('on', false).classed('on2', false).classed('dim', false);
    return;
  }
  const n1 = G.nbOf(f), n2 = new Set();
  if (!G.hover || G.hover === G.sel) for (const a of n1) for (const b of G.nbOf(a)) if (b !== f && !n1.has(b)) n2.add(b);
  const hit = l => l.source.id === f || l.target.id === f;
  const hit2 = l => !hit(l) && ((n1.has(l.source.id) && n2.has(l.target.id)) || (n2.has(l.source.id) && n1.has(l.target.id)));
  node.classed('sel', d => d.id === f).classed('on', d => d.id === f || n1.has(d.id)).classed('n2', d => n2.has(d.id)).classed('dim', d => d.id !== f && !n1.has(d.id) && !n2.has(d.id));
  link.classed('on', hit).classed('on2', hit2).classed('dim', l => !hit(l) && !hit2(l));
}

/* ---------- story & characters ---------- */
function chip(e){ return e ? `<button class="chip ent" style="--c:${col(e)}" data-open="${esc(e.id)}"><span class="dt"></span><span class="t">${esc(short(e))}</span></button>` : ''; }
function roleToDumbo(e){
  if (e.id === 'chr.dumbo') return '主角';
  const roles = [];
  for (const a of S.adj.get(e.id) || []){
    if (a.other !== 'chr.dumbo' || a.x.virtual) continue;
    const lab = (RELS[a.x.r] || RELS.related_to)[a.dir === 'out' ? 1 : 0];
    if (!roles.includes(lab)) roles.push(lab);
  }
  return roles.join(' · ');
}
function renderStory(){
  const g = id => S.byId.get(id);
  const film = (id, lead) => { const e = g(id); if (!e) return ''; const f = Object.entries(e.facts).slice(0, 5);
    return `<article class="film" style="--c:${col(e)}"><div class="fy">${esc(e.year)}</div><div class="fb"><h3>${esc(title(e))}</h3><p class="fl">${esc(lead)}</p><dl class="facts">${f.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><button class="btn small" data-open="${esc(id)}">打开档案卡</button></div></article>`; };
  const chars = S.list.filter(e => e.type === 'Character');
  const c41 = chars.filter(e => !e.continuity.includes('2019 真人')).sort((a, b) => deg(b.id) - deg(a.id));
  const c19 = chars.filter(e => e.continuity.includes('2019 真人'));
  const ccard = e => { const who = e.facts['配音'] || e.facts['饰演'] || ''; const role = roleToDumbo(e);
    return `<button class="ccard" data-open="${esc(e.id)}">${visual(e, 'cvis')}<span class="cn">${esc(title(e))}</span><span class="ce">${esc(e.name || '')}</span>${role ? `<span class="cr">与 Dumbo：${esc(role)}</span>` : ''}${who ? `<span class="cw">${e.facts['配音'] ? '配音' : '饰演'} ${esc(who)}</span>` : ''}</button>`; };
  const rows = list => list.map(e => `<button class="lrow" data-open="${esc(e.id)}"><span class="ly">${esc(e.year ?? '')}</span><span class="lt">${esc(title(e))}</span><span class="ls">${esc((e.summary || '').split('。')[0])}</span></button>`).join('');
  const songs = S.list.filter(e => e.type === 'Music' && e.domains[0] === 'origins');
  const people = S.list.filter(e => e.type === 'Person' && e.domains[0] === 'origins');
  const screen = S.list.filter(e => e.domains[0] === 'screen' && !['work.dumbo2019'].includes(e.id) && e.type !== 'Person').sort(byYear);
  const culture = S.list.filter(e => chapterOf(e) === 'story' && e.domains[0] === 'culture').sort(byYear);
  $('#story').innerHTML = `
    <div class="films">${film('work.dumbo1941', '迪士尼第 4 部动画长片，也是最短的之一。没有台词的主角，一根羽毛，一次起飞。')}${film('work.dumbo2019', '蒂姆·波顿的真人重拍。动物不再说话，故事交给了照顾 Dumbo 的人类家庭。')}</div>
    <div class="section-t"><h2>1941 版的故事</h2><span class="eyebrow">十个场景，按剧情顺序</span></div>
    <ol class="beats">${BEATS.map((b, i) => `<li><span class="bn">${i + 1}</span><div><h3>${esc(b.t)}</h3><p>${esc(b.d)}</p><div class="fopts">${b.ids.map(id => chip(g(id))).join('')}</div></div></li>`).join('')}</ol>
    <div class="section-t" id="chars"><h2>角色</h2><span class="eyebrow">1941 动画</span></div>
    <div class="cgrid">${c41.map(ccard).join('')}</div>
    <div class="section-t"><h2>2019 真人版的人们</h2><span class="eyebrow">另一条故事线</span></div>
    <div class="cgrid">${c19.map(ccard).join('')}</div>
    <div class="two">
      <div><div class="section-t"><h2>歌曲</h2></div><div class="lrows">${rows(songs)}</div></div>
      <div><div class="section-t"><h2>幕后</h2></div><div class="fopts">${people.map(chip).join('')}</div>${chip(g('pub.rollabook'))}</div>
    </div>
    <div class="section-t"><h2>其他影视与发行版本</h2></div><div class="lrows">${rows(screen)}</div>
    ${culture.length ? `<div class="section-t"><h2>文化足迹</h2></div><div class="lrows">${rows(culture)}</div>` : ''}`;
}

/* ---------- parks ---------- */
function renderParks(){
  const rides = S.list.filter(e => e.type === 'Attraction' && e.tags.includes('旋转飞象')).sort(byYear);
  const other = S.list.filter(e => chapterOf(e) === 'parks' && !rides.includes(e)).sort(byYear);
  const X = y => 40 + (y - 1950) / 80 * 720;
  let t = `<line class="ax" x1="${X(1950)}" y1="70" x2="${X(2030)}" y2="70"/>`;
  for (let y = 1950; y <= 2030; y += 10) t += `<line class="tk" x1="${X(y)}" y1="66" x2="${X(y)}" y2="74"/><text class="tkl" x="${X(y)}" y="${y % 20 === 10 ? 92 : 92}">${y}</text>`;
  rides.forEach((e, i) => { const up = i % 2 === 0, x = X(e.year);
    t += `<g class="pm" data-open="${esc(e.id)}"><line x1="${x}" y1="70" x2="${x}" y2="${up ? 38 : 102}"/><circle cx="${x}" cy="70" r="6"/><text x="${x}" y="${up ? 30 : 116}">${esc((e.short || '').replace('飞象 · ', ''))} ${e.year}</text></g>`; });
  const pcard = e => `<button class="pcard" data-open="${esc(e.id)}">${visual(e, 'pvis')}<span class="pt">${esc(title(e))}</span><span class="pp">${esc(e.facts['园区'] || '')}</span><span class="pd"><b>${esc(e.date || e.year || '')}</b>${e.facts['改造'] ? ` · ${esc(e.facts['改造'])}` : ''}</span></button>`;
  const parkOnly = S.list.filter(e => e.edition.includes('park'));
  $('#parks').innerHTML = `
    <div class="panel ptl"><h3>六座飞象的开放顺序</h3><div class="tbl"><svg viewBox="0 0 800 130" role="img" aria-label="1955 年到 2016 年六座飞象的开放年份">${t}</svg></div></div>
    <div class="pgrid">${rides.map(pcard).join('')}</div>
    ${other.length ? `<div class="section-t"><h2>乐园里的其他 Dumbo</h2></div><div class="pgrid">${other.map(pcard).join('')}</div>` : ''}
    <div class="section-t"><h2>乐园限定商品</h2></div>
    ${parkOnly.length ? `<div class="grid">${parkOnly.map(cardHTML).join('')}</div>` : '<div class="empty">还没有收录乐园限定商品。各乐园的飞象周边、徽章、爆米花桶都属于这里。</div>'}`;
}

/* ---------- merch ---------- */
function renderMerch(){
  const cols = S.list.filter(e => e.type === 'Collection').sort((a, b) => String(b.date || b.year || '').localeCompare(String(a.date || a.year || '')));
  const itemsOf = id => (S.adj.get(id) || []).filter(a => a.dir === 'in' && a.x.r === 'part_of_collection').map(a => S.byId.get(a.other));
  const inCol = new Set(cols.flatMap(c => itemsOf(c.id).map(e => e.id)));
  const loose = S.list.filter(e => e.type === 'Merchandise' && !inCol.has(e.id)).sort(byYear);
  const rets = S.list.filter(e => e.type === 'Retailer');
  const retOf = id => (S.adj.get(id) || []).filter(a => a.dir === 'out' && a.x.r === 'sold_by').map(a => S.byId.get(a.other));
  const block = c => { const items = itemsOf(c.id), ret = retOf(c.id);
    return `<section class="colsec" style="--c:${col(c)}"><div class="colh"><div><div class="colm">${esc(c.date || c.year || '')}${c.region.length ? ` · ${c.region.map(r => esc(REGIONS[r] || r)).join(' · ')}` : ''}${ret.length ? ` · ${ret.map(r => esc(short(r))).join('、')}` : ''}</div><h3><button class="linkish" data-open="${esc(c.id)}">${esc(title(c))}</button></h3></div><span class="st st-${c.status}">${esc(STATUS[c.status].zh)}</span></div>
      <p class="colp">${esc(c.summary || '')}</p>
      <div class="colf">${['件数', '价格', '发售', '首发', '线上'].filter(k => c.facts[k]).map(k => `<span><em>${k}</em>${esc(c.facts[k])}</span>`).join('')}<span><em>已收录</em>${items.length} 件</span></div>
      ${items.length ? `<div class="grid">${items.map(cardHTML).join('')}</div>` : '<p class="colempty">单品待补充。</p>'}</section>`; };
  $('#merch').innerHTML = cols.map(block).join('')
    + (loose.length ? `<div class="section-t"><h2>未归入系列的商品</h2></div><div class="grid">${loose.map(cardHTML).join('')}</div>` : '')
    + `<div class="section-t"><h2>零售渠道</h2></div><div class="fopts">${rets.map(chip).join('')}</div>
       <p style="margin-top:20px"><button class="btn" data-domgo="merch">在全部档案里按地区、发行类型筛选商品</button></p>`;
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
function relationsHTML(id){
  const rows = new Map(), seen = new Set();
  for (const a of S.adj.get(id) || []){
    const r = RELS[a.x.r] ? a.x.r : 'related_to', lab = RELS[r][a.dir === 'out' ? 0 : 1];
    if (seen.has(lab + '|' + a.other)) continue;
    seen.add(lab + '|' + a.other);
    let gi = REL_GROUPS.findIndex(g => g[1].includes(r)); if (gi < 0) gi = 8;
    const key = gi + '|' + lab;
    if (!rows.has(key)) rows.set(key, {gi, ri:REL_GROUPS[gi][1].indexOf(r), lab, items:[]});
    rows.get(key).items.push({o:S.byId.get(a.other), note:a.x.note});
  }
  const list = [...rows.values()].sort((a, b) => a.gi - b.gi || a.ri - b.ri);
  const n = list.reduce((s, r) => s + r.items.length, 0);
  let html = '', cur = -1;
  for (const r of list){
    if (r.gi !== cur){ if (cur !== -1) html += '</div>'; cur = r.gi; html += `<div class="rsec"><h5>${esc(REL_GROUPS[r.gi][0])}</h5>`; }
    html += `<div class="rgroup"><span class="lab">${esc(r.lab)}</span><div class="cs">${r.items.map(({o, note}) => `<button class="chip ent" style="--c:${col(o)}" data-open="${esc(o.id)}"><span class="dt"></span><span class="t">${esc(short(o))}</span>${note ? `<span class="note-i">${esc(note)}</span>` : ''}</button>`).join('')}</div></div>`;
  }
  if (cur !== -1) html += '</div>';
  return {html, n};
}
function openEntity(id, push = true){
  const e = S.byId.get(id); if (!e) return;
  if (push && S.cur && S.cur !== id && !$('#drawer').hidden) S.hist.push(S.cur);
  S.cur = id;
  const rel = relationsHTML(id);
  const facts = Object.entries(e.facts);
  const line = [e.year != null ? esc(when(e)) : '', esc(typeZh(e.type)), e.region.length ? e.region.map(r => esc(REGIONS[r] || r)).join(' · ') : ''].filter(Boolean).join(' · ');
  const d = $('#drawer');
  d.innerHTML = `<div class="dhead"><div class="l">${S.hist.length ? '<button class="btn small" data-back>← 返回</button>' : ''}</div><button class="x" data-close aria-label="关闭">✕</button></div>
    ${visual(e, 'dvis')}
    <h2 class="dtitle">${esc(title(e))}</h2>${sub(e) ? `<p class="dsub">${esc(sub(e))}</p>` : ''}
    <div class="dmeta"><span class="dline">${line}</span><span class="st st-${e.status}">${esc(STATUS[e.status].zh)}</span>${e._origin !== 'seed' ? `<span class="tag" style="cursor:default">${e._origin === 'added' ? '新增条目' : '已编辑'}</span>` : ''}</div>
    ${e.summary ? `<p class="dsum">${esc(e.summary)}</p>` : ''}
    ${facts.length ? `<div class="dsec"><h4>资料</h4><dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}
    ${e.continuity.length ? `<div class="dsec"><h4>故事线</h4><div class="fopts">${e.continuity.map(c => `<span class="tag" style="cursor:default">${esc(c)}</span>`).join('')}</div></div>` : ''}
    ${e.tags.length || e.edition.length ? `<div class="dsec"><h4>标签与发行类型</h4><div class="fopts">${e.edition.map(x => `<button class="chip" data-edgo="${esc(x)}">${esc(EDITIONS[x] || x)}</button>`).join('')}${e.tags.map(t => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div></div>` : ''}
    ${rel.n ? `<div class="dsec"><h4>关系 · ${rel.n}</h4>${rel.html}</div>` : ''}
    <div class="dsec"><h4>来源</h4>${e.source.length ? `<ol class="srcs">${e.source.map(s => s && s.url ? `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label || s.url)}</a></li>` : `<li>${esc(s && s.label || s)}</li>`).join('')}</ol>` : `<p style="color:var(--ink-3);font-size:13.5px">还没有记录来源。</p>`}</div>
    <div class="dact"><button class="btn small" data-locate="${esc(e.id)}">在关系网络中查看</button>${S.canEdit ? `<button class="btn small" data-edit="${esc(e.id)}">编辑</button>${e._origin === 'override' ? `<button class="btn small" data-restore="${esc(e.id)}">恢复原始版本</button>` : ''}<button class="btn small danger" data-del="${esc(e.id)}">删除</button>` : ''}</div>`;
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
  ({universe:renderUniverse, story:renderStory, parks:renderParks, merch:renderMerch, graph:renderGraph, archive:renderArchive, timeline:renderTimeline, world:renderWorld, design:renderDesign, schema:renderSchema})[v]();
}
function rerender(){ render(S.view); if (S.view !== 'universe') S._uniDirty = true; if (!$('#drawer').hidden && S.cur){ if (S.byId.has(S.cur)) openEntity(S.cur, false); else closeDrawer(); } }
function go(v, keepDrawer){
  if (!VIEWS.includes(v)) v = 'universe';
  S.view = v;
  $$('.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
  $$('[data-view]').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
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
  if ((el = c('[data-ch]'))) return goChapter(el.dataset.ch);
  if ((el = c('[data-gdom]'))) { if (G){ G.domPin = G.domPin === el.dataset.gdom ? null : el.dataset.gdom; G.sel = null; paintGraph(); $$('#legend [data-gdom]').forEach(b => b.setAttribute('aria-pressed', String(G.domPin === b.dataset.gdom))); } return; }
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
orbit.addEventListener('mouseover', ev => { const n = ev.target.closest('[data-id]'); if (n) return orbitFocus(n.dataset.id); const d = ev.target.closest('[data-ch]'); if (d) return orbitChapter(d.dataset.ch); });
orbit.addEventListener('mouseleave', () => orbitFocus(null));
orbit.addEventListener('focusin', ev => { const d = ev.target.closest('[data-ch]'); if (d) orbitChapter(d.dataset.ch); else if (ev.target.closest('.hub')) orbitFocus('chr.dumbo'); });
orbit.addEventListener('focusout', () => orbitFocus(null));
const legend = $('#legend');
const legendHover = ev => { const b = ev.target.closest('[data-gdom]'); if (b && G){ G.dom = b.dataset.gdom; paintGraph(); } };
const legendOut = () => { if (G){ G.dom = null; paintGraph(); } };
legend.addEventListener('mouseover', legendHover); legend.addEventListener('focusin', legendHover);
legend.addEventListener('mouseleave', legendOut); legend.addEventListener('focusout', legendOut);
document.addEventListener('change', ev => { if (ev.target.id === 'geoToggle'){ S.showGeo = ev.target.checked; applyGeo(); paintGraph(); } });
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
