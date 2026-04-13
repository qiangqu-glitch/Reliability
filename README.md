# ReliToolbox v0.1

可靠性工程师工具箱 | Reliability Engineer Toolbox

## 模块 / Modules (13个已上线)

| 模块 | 描述 | 状态 |
|------|------|------|
| [Weibull](weibull/) | MLE拟合 · B-Life · 截尾数据 | ✅ Live |
| [Weibull+](weibull/weibull_advanced.html) | 区间截尾 · 置信区间 | ✅ Live |
| [FMEA/RCM](fmea/) | RPN自动计算 · Pareto图 · IndexedDB持久化 | ✅ Live |
| [LCC](lcc/) | NPV · EAC · 多方案对比 | ✅ Live |
| [RAM](ram/) | 事件驱动Monte Carlo · 产能传递 | ✅ Live |
| [RBI](rbi/) | API 580/581 · 5×5风险矩阵 | ✅ Live |
| [Spare Parts](spa/) | Poisson模型 · 服务水平优化 | ✅ Live |
| [SIL](sil/) | IEC 61508/61511 · PFD/PFH | ✅ Live |
| [AMSAA](amsaa/) | Crow-AMSAA 可靠性增长 | ✅ Live |
| [FTA](fta/) | 故障树 · MOCUS最小割集 · Birnbaum重要度 | ✅ Live |
| [Alloc](alloc/) | 可用度/可靠性分配 · AGREE/Equal/Weighted | ✅ Live |
| [RBD/MCS](rbd_mcs/) | RBD最小割集分析 | ✅ Live |
| [Equipment](equipment/) | 设备管理台账 · MTBF · 检验计划 | ✅ v0.1 新 |

## 部署 / Deployment

- **Cloudflare Pages**: 推送此仓库 → 自动部署
- **域名**: `reliability.chemcalc.cn`（在Cloudflare DNS添加CNAME）
- **主入口**: `index.html`（根目录）
- **伴生站点**: [ChemCalc](https://chemcalc.cn)

## 文件结构 / Structure

```
reliability/
├── index.html              # 主页（13个模块导航）
├── _redirects              # Cloudflare路由规则（完整）
├── shared/
│   ├── style.css           # 统一深色渐变主题
│   └── math.js             # 共享数学引擎
├── db/
│   └── relidb.js           # IndexedDB统一数据层（ReliToolbox库）
├── weibull/index.html
├── fmea/index.html
├── lcc/index.html
├── ram/index.html
├── rbi/index.html
├── spa/index.html
├── sil/index.html
├── amsaa/index.html
├── fta/index.html
├── alloc/index.html
├── rbd_mcs/index.html
└── equipment/index.html
```

## 数据层 / Data Layer

所有模块共享同一 IndexedDB 数据库 `ReliToolbox`，表结构：

| 表名 | 用途 |
|------|------|
| equipments | 设备台账（Equipment模块管理） |
| failures | 故障记录（FRACAS） |
| fmea | FMEA条目 |
| fmea_worksheets | FMEA工作集 |
| weibull_results | Weibull拟合结果 |
| fta_models | FTA模型 |
| rbd_models | RBD模型 |
| rbi_assessments | RBI评估结果 |

## 架构原则

1. 单文件HTML模块，无构建链
2. 所有模块共享 `ReliToolbox` IndexedDB（统一数据库名）
3. Cloudflare Pages直接部署，无服务器
4. 不引入Pyodide/React/Vite等重框架

## 关联项目 / Related

- [ChemCalc](https://chemcalc.cn) — 化工流程计算工具箱
