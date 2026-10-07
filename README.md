# Dumbo Universe · 小飞象宇宙档案

以 Dumbo 为中心的非官方 IP 百科。只要和小飞象有直接或可追溯的关系，就可以收进来：1941 年电影、角色、幕后人物、乐园设施、商品、系列与联名、周年纪念、地区限定、文化足迹。

在线访问：<https://xinyi-liu-ai.github.io/dumbo-universe/>

## 页面

| 页面 | 内容 |
| --- | --- |
| 宇宙 | 首页。Dumbo 在中心，内圈是 7 个栏目入口，外圈是全部条目 |
| 故事与角色 | 两部电影、1941 版的十个剧情场景、角色、歌曲与幕后 |
| 乐园 | 六座旋转飞象的开放顺序和照片，乐园限定商品 |
| 商品与系列 | 按系列整理的商品，以及零售渠道 |
| 关系网络 | 完整关系图。Dumbo 固定在中心，按关系远近分圈；名字随缩放逐级显示；不同性质的关系用不同线型 |
| 时间轴 | 1939 年至今，整五周年用金色标出 |
| 世界 | 地图与地区列表 |
| 造型演变 | Dumbo 各时期造型的示意图 |
| 全部档案 | 搜索框旁边的入口，可按领域、类型、地区、角色、发行类型、来源可信度、年份筛选 |
| 数据结构 | 维护用，不在导航里。访问 `#schema` 打开，可以查看类型与关系说明、导出 JSON |

## 文件结构

```
index.html              页面结构
assets/style.css        样式
assets/app.js           交互逻辑
assets/world-land.js    世界地图底图（Natural Earth 110m）
data/entities.json      全部条目，增删改都在这里
```

## 添加或修改条目

所有数据都在 `data/entities.json`，它是一个数组，每个元素是一个条目。可以直接在 GitHub 网页上点文件右上角的铅笔图标编辑，保存（Commit）后一两分钟网站就会更新。

一件商品的例子：

```json
{
  "id": "mer.dsj_85_plush",
  "type": "Merchandise",
  "zh": "85 周年毛绒（日本 Disney Store）",
  "short": "DSJ 85周年毛绒",
  "name": "Dumbo 85th Anniversary Plush",
  "domains": ["merch"],
  "year": 2026,
  "date": "2026-10-01",
  "region": ["JP"],
  "edition": ["anniversary"],
  "tags": ["毛绒", "85周年", "Disney Store Japan"],
  "summary": "一句话说明它是什么。",
  "facts": { "品类": "毛绒", "价格": "¥3,300", "尺寸": "约 20 cm" },
  "status": "official",
  "source": [{ "label": "Disney Store Japan 商品页", "url": "https://..." }],
  "rel": [
    ["part_of_collection", "col.dsj_85"],
    ["depicts", "chr.dumbo"],
    ["sold_by", "ret.dsj"],
    ["released_for", "ann.85"]
  ]
}
```

注意：JSON 里每个条目之间要用逗号隔开，最后一个条目后面不能有逗号；字符串必须用英文双引号。

### 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 唯一编号，类型前缀 + 名称，例如 `chr.timothy`、`mer.d23_plush` |
| `type` | 是 | 条目类型，见下表 |
| `zh` / `name` | 至少一个 | 中文名 / 原名 |
| `short` | 否 | 图上显示的短名称 |
| `domains` | 是 | 所属领域，第一个是主领域：`origins` `characters` `screen` `parks` `merch` `collections` `events` `world` `design` `culture` |
| `year` · `date` · `end` | 否 | 年份、具体日期（`YYYY-MM-DD`）、结束日期 |
| `region` | 否 | `US` `JP` `CN` `HK` `TW` `KR` `FR` `UK` `GLOBAL` |
| `edition` | 否 | `standard` `limited` `anniversary` `event` `park` `regional` `store` `collab` `blind` `promo` |
| `tags` | 否 | 自由标签 |
| `continuity` | 否 | 故事线：`1941 动画`、`2019 真人`、`电视`、`乐园` |
| `summary` | 否 | 简介 |
| `facts` | 否 | 按类型扩展的字段（价格、尺寸、渠道等），键值都是文字 |
| `rel` | 否 | 关系列表，每项是 `[关系, 目标 id]` 或 `[关系, 目标 id, 备注]` |
| `status` | 是 | 来源可信度：`official` `catalog` `archive` `secondary` `collector-reported` `unknown` |
| `source` | 否 | `[{ "label": "标题", "url": "链接" }]` |
| `geo` | 否 | 地图位置：`[纬度, 经度, "地点名", "标签方向 l/r/t/b"]`，同名地点会合并成一个点 |
| `image` | 否 | 详情页顶部的图片：`{"src": "图片地址", "credit": "作者", "license": "授权", "page": "来源页面", "note": "备注"}`。自己拍的照片可以放进仓库的 `images/` 文件夹，`src` 写 `images/文件名.jpg`。没有图片时会显示按类型绘制的插图 |

### 条目类型

`Work` 作品 · `Character` 角色 · `Person` 人物 · `Attraction` 游乐设施 · `Place` 地点 · `Event` 活动 · `Anniversary` 周年 · `Collection` 系列 · `Merchandise` 商品 · `Retailer` 零售商 · `Brand` 品牌 · `Publication` 出版物 · `Music` 音乐 · `Media` 发行版本 · `Award` 奖项 · `Artwork` 美术 · `Concept` 概念 · `CulturalArtifact` 文化物件 · `Region` 地区

### 常用关系

`appears_in` 登场于 · `depicts` 描绘角色 · `best_friend_of` 最好的朋友 · `friend_of` 朋友 · `parent_of` 父母 · `sibling_of` 兄弟姐妹 · `helps` 帮助 · `based_on` 改编自 · `adaptation_of` 翻拍自 · `edition_of` 发行版本 · `written_by` `directed_by` `composed_by` `voiced_by` 幕后 · `part_of_collection` 属于系列 · `sold_by` 销售渠道 · `released_for` 纪念 · `celebrates` 庆祝 · `featured_at` 亮相活动 · `version_of` 其他版本 · `uses_motif` 母题 · `associated_with` `related_to` 关联

完整列表见网站的「数据结构」页。关系只需要写一个方向，页面会自动在目标条目上显示反向关系。

## 本地预览

页面通过 `fetch` 读取数据，直接双击 `index.html` 打开会读不到数据。在这个文件夹里运行：

```bash
python -m http.server 8000
```

然后打开 <http://localhost:8000>。

## 说明

非官方粉丝资料库，与 The Walt Disney Company 无关联。角色与作品名称归各自权利人所有。造型演变页的插图是根据各时期常见风格绘制的示意图。乐园照片、1939 年原作插画和明信片来自 Wikimedia Commons，均为 CC 授权或公有领域，作者与授权标注在每张图片下方。地图底图来自 [Natural Earth](https://www.naturalearthdata.com/)（公有领域），经 [world-atlas](https://github.com/topojson/world-atlas) 转换。
