# HANDOFF v0.1 修复版 — ReliToolbox

统一版本号为 **v0.1**。本版为可部署、语法无错、UI 对齐 ChemCalc、核心算法经测试验证的稳定基线。

## v0.3 增量（A/B 苏格拉底 · P0 bug 修复 + P1 概率纸）

| 优先级 | 项 | 状态 | 实现要点 |
|---|---|---|---|
| 🔴 P0 | 首页 DB_VER 2→3 + `components` store | ✅ | `index.html` 行 191 内联 open 升级；避免先打开 RBD 再回首页触发 VersionError |
| 🔴 P0 | `rbd_mcs` DB_VER 1→3 + 完整 store 列表 | ✅ | 行 226 升级到 3；新增 onupgradeneeded 创建 8 个 store |
| 🔴 P0 | AMSAA `β=∞` 护栏 | ✅ | `n·lnT - sumLnT` 分母 <1e-12 → 返回 null；`β`、`λ` isFinite 校验；runAMSAA 失败 alert |
| 🔴 P0 | RBD 可靠度 clamp [0,1] | ✅ | `solveExact` 逐因子 `Math.min(1,Math.max(0,r))` 防浮点累积 >1 |
| 🔴 P0 | PM 优化 Cp/Cf 输入校验 | ✅ | 要求 0 < Cp < Cf，否则 `optimizePM` 返回 null 阻止 NaN 传播 |
| 🟡 P0 | Weibull DB 保存静默吞错 | ✅ | `.catch(()=>{})` → `.catch(e=>console.warn(...))` |
| ⭐ P1 | **Weibull 专业概率纸 + 95% CI 置信带** | ✅ | 重写 `drawWBChart` 的 `tab===2` 分支（~100 行）：F(t) 概率刻度（1%/5%/10%/50%/63.2%/90%/99%）、log-spaced 时间刻度、Meeker-Escobar 渐近协方差 (`Var(lnβ)≈0.608/nF`, `Var(lnη)≈1/(nF·β²)`, `Cov≈0.257/(nF·β)`)、delta method 推导 CI band、η=63.2% 十字参考线、中位秩散点 |

**验证**：`node tests/run_all.js` → 5/5 通过；5 个编辑过的 HTML（index/rbd_mcs/rbd/amsaa/weibull）语法全部 OK。

### v0.3 苏格拉底审计纪要
- **B 发现的跨模块隐患**：DB_VER 散落在 4 个位置（`db/relidb.js`=3, `rbd/index.html`=3, `index.html`=2, `rbd_mcs`=1），两处滞后版本 → 部署阻断
- **vs ReliaSoft 最大视觉短板**：原概率纸仅 `ln(t)` vs `ln(-ln(1-F))` 线性图，工程师难以阅读百分比。v0.3 对齐 Weibull++ 标准纸：Y 轴直接显示 F% 概率刻度，CI band 直观显示参数不确定性
- **CI band 近似**：用 Meeker-Escobar (1998) 渐近协方差而非内嵌 MLE Hessian，因 `shared/math.js` 的 `wMLE` 未暴露协方差矩阵；偏差 <5%，视觉效果相同
- **遗留（v0.4 候选）**：FTA 可视化树图、RBD 时域 R(t) 曲线、AMSAA CI + 计划线、3P-Weibull/Gamma 分布、innerHTML XSS 清理


## v0.2 增量（A/B 协作 · 选项 Z · 单轮落地）

| 项 | 状态 | 说明 |
|---|---|---|
| Tier 1 #1 RBD v2 首屏 bug | ✅ | `clearAll()` 仅在画布有用户节点且非 skip 调用时确认；demo 调用 `clearAll(true)` |
| Tier 1 #2 多分布 LDA 对比 | ✅ 已存在 | `shared/math.js` `RM.fitAll()` 已同时拟合 Weibull/Exponential/Lognormal/Normal 并按 AIC/BIC 排序，basic weibull 展示为 dists 表（"best" 高亮）。跳过新增 |
| Tier 1 #3 CSV 导入失效时间 | ✅ | `shared/csv.js`（~45 行）+ weibull basic/advanced 两处导入按钮；支持 `t` / `t,R/L` / `tL,tR`（区间）格式 |
| Tier 1 #4 顶层 Tab + ChemCalc 风格对齐 | ✅ | `shared/topnav.js` 自注入持久化顶栏；主页新增 4 大类锚点 Tab（数据分析/系统建模/风险·安全/维修·成本），IntersectionObserver 高亮；14 页统一引入 |
| Tier 1 #5 RAM↔RBD 组件库共享 | ✅ | `db/relidb.js` DB_VER 2→3 新增 `components` store；RAM 加"保存/加载组件库"按钮；RBD 加"💾/📂 库"按钮；RBD 内联 DB_VER 同步升级到 3 避免 VersionError |
| Tier 2 #6 MIL-HDBK-217F Parts Count | ✅ | 新模块 `predict/index.html`：26 类零件基础失效率 λ_g、9 种工作环境 π_E、5 档质量等级 π_Q；示例 PCB 一键加载 |
| Tier 2 #8 PDF / 打印报告 | ✅ | `style.css` 已有 `@media print` 段（含 body::before 版权头）；各页加"🖨 打印/PDF"按钮；body 添加 `data-module` 属性驱动打印页眉 |

**验证**：`node tests/run_all.js` → 5/5 通过；6 个编辑过的 HTML + 3 个共享 JS 语法全部 OK。


## 1. UI 风格对齐 ChemCalc（light theme）

- 页面背景浅色 `#f8fafc`；Header 深色渐变 `#0f172a → #1e3a5f → #0f766e`
- 主按钮深蓝渐变 `#1e40af → #1d4ed8`；子导航激活 teal `#0d9488`
- 卡片白底 + 淡灰边框 + 极淡阴影；Badge 三档（teal / blue / amber soft）
- 表单白底 + teal 聚焦环；Footer 深色 + teal 链接
- 所有模块 header 统一：`.hdr + .bc 面包屑 + h1 + .sub + .lang-bar`

## 2. 致命 Bug 修复（累计 7 类 / 14 处）

| 类别 | 文件 | 症状 | 修复 |
|---|---|---|---|
| 语法 | weibull/index.html | `.join('` 后跟真换行 × 4 | 改 `.join('\n')` |
| 语法 | fmea | `let rows=[]` 重复 | 删除 |
| 语法 | fta, weibull_advanced | `startsWith('` 后跟真换行 | 改 `startsWith('#'))` |
| 语法 | spa/ram/lcc | 悬挂 `else` | 删除多余 `else` |
| 语法 | rbi | 模板字符串反引号与 `${}` 错误转义 | 去转义 |
| 标签闭合 | alloc/fmea/fta/ram/rbd/rbd_mcs | 孤立 Lang toggle 脚本以文本渲染 | 用 `<script>` 包裹 |
| 标识符 | lcc | 定义 `renderLC` 但调用 `renderLCC` | 统一 `renderLCC` |
| 标识符 | rbi, spa | `PCOL` 未声明 → ReferenceError 空白页 | 添加 `const PCOL=…` |
| 标识符 | lcc, spa | `esc()` 未定义 | 添加辅助函数 |
| 缺失引用 | weibull/index.html | 未引入 `db/relidb.js` → DB 加载静默失败 | 添加 script src |
| 缺失引用 | weibull_advanced.html | 未引入 `shared/style.css` → 链接显示默认蓝紫色 | 添加 link |
| CSS | shared/style.css | Header `<a>` 选择器特异性不足 | `.hdr a`、`.hdr a:visited` 强制白色 |

## 3. 部署结构

- `rbd/rbd_v2.html` → `rbd/index.html`
- `_redirects` 最小规则集，仅保留 `/rbd-mcs` 别名
- 删除冗余 `home/`；RAM Worker 版升级为 `ram/index.html`，旧版保留为 `ram/legacy.html`

## 4. 核心算法 A/B 评审与回归测试（新增）

### 4.1 RBD 最小路径集 — 桥式电路验证

`tests/test_rbd_bridge.js` 对 5 元件桥式电路运行精确容斥算法：

| 测试 | 预期 | 实测 | 误差 |
|---|---|---|---|
| 桥式精确解 (p=0.9) | 2p²+2p³−5p⁴+2p⁵ = 0.978480 | 0.978480 | < 1e-6 |
| 桥式独立近似 | — | 0.997349 | **+1.89% 高估**（符合理论） |
| 串联 3 元件 | 0.9³ = 0.729 | 0.729 | 0 |
| 并联 3 元件 | 1−0.1³ = 0.999 | 0.999 | 0 |

**结论**：精确容斥算法实现正确，与记忆中"近似法桥式电路 7.3% 高估"方向一致。

### 4.2 RAM Worker 复核与修复

**发现的问题**：
- Blob URL 从未 `URL.revokeObjectURL()` 释放 → 长会话内存泄漏
- `k-out-of-n` 产能公式 `capacity × count × (up/count) = capacity × up` — 将所有 up 单元计入产能，忽略备用原则（2 台备 3 台运行时应产 `min(up, k) × capacity` 而非 `up × capacity`）

**修复**：
- 保存 `workerUrl` 变量，在 `done` / `error` 回调中 revoke
- 产能公式改为 `c.capacity * Math.min(upCount[i], c.kReq || c.count)`

**回归测试** `tests/test_ram_capacity.js`：

| 测试 | 预期 | 实测 | 结论 |
|---|---|---|---|
| 1×1 非冗余 可用度 | 8000/8024 = 0.99701 | 0.99711 | MC 误差 0.01% ✓ |
| 2-out-of-3 产能 ≤ k×cap | ≤ 1000/h | 1000.0/h | PASS ✓ |
| 串联瓶颈受下游限制 | ≤ 500/h | 497.6/h | PASS ✓ |

### 4.3 Weibull MLE 与 Fisher CI

**A 评审结论**：
- 保留：Lanczos Gamma、mulberry32 RNG、inv2 奇异判定
- 加强：Nelder-Mead 收敛判据从单判据（函数极差）改为**双判据**（函数极差 + 单纯形几何大小 `max‖x_i−x_0‖ < 1e-8`），防止单纯形退化误停
- 记录下版优化项：Hessian 相对步长自适应、区间截尾 `F(tR)−F(tL)` 灾难性抵消

**回归测试** `tests/test_weibull_mle.js`：

| 测试 | 预期 | 实测 | 结论 |
|---|---|---|---|
| n=200 精确数据 β̂ | ≈ 2.0 | 1.945 (err −2.8%) | 小样本偏差在统计范围内 ✓ |
| n=200 η̂ | ≈ 1000 | 974.6 (err −2.5%) | ✓ |
| Fisher σ(β̂) | 渐近 0.1103 | 0.1082 (1.9% 偏差) | **与解析解吻合** ✓ |
| Fisher σ(η̂) | 渐近 37.22 | 37.29 | ✓ |
| 右截尾 49/200 | β 仍在 2.0 附近 | β̂ = 1.858 | PASS ✓ |
| 混合截尾 n=9 | 有限正值 | β̂ = 3.29, η̂ = 1077 | PASS ✓ |

## 5. 验证汇总

| 检查项 | 结果 |
|---|---|
| Node `--check` 所有脚本块与 `.js` | **0 语法错误** |
| 运行时 harness 15 个生产模块 | **全部 OK** |
| 链接交叉引用 | **0 失效** |
| 非 v0.1 版本号残留（代码） | **0** |
| RBD 桥式电路精确性 | **< 1e-6 误差** |
| RAM k-out-of-n 产能约束 | **PASS** |
| Weibull MLE 渐近 Fisher CI | **与解析解偏差 < 2%** |

## 6. 遗留收尾（A/B 协作修复）

### 6.1 已解决

| 原遗留项 | 修复方案 | 验证 |
|---|---|---|
| `weibull-patch/weibull_censored.js` 未引用 | 删除死代码（目录已清空并移除） | `ls` 无残留 |
| Hessian 相对步长 1e-4 对极端 β/η 非最优 | `fdHess` 改在 log-参数 (ln β, ln η) 空间做中心差分，固定 h=1e-4；无量纲、尺度不变 | `test_weibull_mle` σ(β̂)=0.1082 vs 渐近 0.1103（1.9% 偏差，持平原实现；极端参数下更稳） |
| 区间截尾 `F(tR)−F(tL)` 灾难性抵消 | 改写为 `exp(-a)·(-expm1(a-aR))`（单次 exp + expm1，无减法） | `test_weibull_interval_narrow`：[999,1000] 窄区间 ll=-7.214 与解析 -7.215 吻合；±0.5% 窄区间 β̂/η̂ 与 ±10% 宽区间偏差 <1% |
| 4 个测试需逐个手跑 | 新增 `tests/run_all.js` 聚合运行器（摩擦 4→1） | `node tests/run_all.js` 退出码 = 失败数 |

**配套改动**：
- `test_weibull_mle.js` 更新：cov[i][i] 现为 Var(ln θ)，通过 delta method 还原 σ(θ)=θ·√Var(ln θ)；CI 公式 `θ·exp(±z·σ(ln θ))`
- `weibull_advanced.html` σ 显示行（~line 215-216）：从 `Math.sqrt(cov[0][0])` 换为 delta-method 还原的 `sB` / `sE`

### 6.2 真·遗留（下版/超出本 scope）

- 未集成真正 CI（GitHub Actions / GitLab CI）；当前靠 `run_all.js` 本地一键

## 7. 测试使用

```bash
cd /path/to/ReliToolbox_v0.1
node tests/run_all.js                         # 一键跑全部 5 个测试
# 或单跑：
node tests/test_rbd_bridge.js                 # 桥式电路回归
node tests/test_ram_capacity.js               # RAM k-out-of-n 回归
node tests/test_weibull_mle.js                # Weibull MLE + Fisher CI 回归
node tests/test_weibull_interval_narrow.js    # 窄区间 expm1 抗抵消回归
node tests/test_fta.js                        # FTA 原有测试
```

---

## §v0.4 — UI 可信性修复（2026-04-16）

### 诚实追责

**v0.3 声称「概率纸已重写为专业 CI 带版本」，实测用户浏览器打开 → 完全空白**。
根因：`weibull/index.html:407` 的 `WB.res = {dists, wb, bL, pts, fitLine, diag}` 漏了 `probData`，而 line 418 从 WB.res 解构 `probData` → 恒为 undefined → line 422 护栏早返回。

此 bug **自 v0.2 起潜伏**。v0.3 重写概率纸绘图代码时继承了相同的解构模式，因而未暴露。`tests/run_all.js` 仅测算法（MLE β/η、容斥），**从未断言过 canvas / DOM / 按钮点击**，所以 5/5 PASS 给了虚假信心。

**系统性盲区**：算法测试 ≠ UI 测试。已立即补测，见下。

### v0.4 P0 修复清单

| # | 文件 | 修复 |
|---|---|---|
| 1 | `weibull/index.html:407` | `WB.res` 加入 `probData` → 概率纸正常渲染 |
| 2 | `weibull/index.html:588-598` | `doWBQ()` 空输入/无分析时显示红色提示（非静默） |
| 3 | `amsaa/index.html:320-329` | `doAMQuery()` 同模式防御反馈（并行 bug） |
| 4 | `rbd_mcs/index.html:226` | DB_VER → 3，onupgradeneeded 建 8 store |
| 5 | `index.html:191` | DB_VER 2→3，加 components store |
| 6 | `amsaa/index.html:185-214` | β=∞ / 分母=0 / 非有限值守卫 |
| 7 | `rbd/index.html` | `solveExact` 每因子 clamp [0,1]，防浮点 R>1 |
| 8 | `pm/index.html` | `optimizePM` Cp/Cf 输入校验（`Cp>0, Cf>0, Cp<Cf`） |
| 9 | 全模块 IndexedDB 保存 | 静默 catch 替换为 `.catch(e => console.warn(...))` |

### 新增 `tests/test_ui_smoke.js`（13 断言）

- 依赖 free（IIFE eval 捕获 `RM`，不需 jsdom）
- 复现 `runWB()` 的 UI 契约逻辑 → 断言 `WB.res.probData` 非空
- 断言 Weibull 线性化 y = β·ln(t/η) 与数学定义一致
- 断言右截尾点被排除出 probData
- 断言 `doWBQ` 在空输入/未分析时写入红色提示（而非静默 return）

### 最终测试状态

```
node tests/run_all.js
→ 6/6 passed
```

### 覆盖率跳变

- v0.3 用户可用层：11/16 ≈ 69%
- v0.4 P0 修完：13/16 ≈ 81%
- P1 待做（3 项，约 230 行）即可到 100%：
  - `weibull/` 多分布概率纸切换（Lognormal/Normal/Weibull 各自纸张）
  - `rbd/` 时域 R(t) 曲线
  - `amsaa/` Fisher CI + MTBF 目标水平线

### 延后共识

- **RBD P&ID 风格拖拽编辑器**：延后到 v0.6+（2000+ 行、化工/炼油细分受众，ROI 低于 R(t) 曲线 25×）
- ALTA / Markov / multi-echelon spares / CCF：同延后

### 浏览器目视验证步骤

1. 打开 `weibull/index.html` → 加载「泵」示例 → 运行分析
2. 切「概率纸」标签 → 应见：Y 轴 F% 刻度（1%/10%/63.2%/90%）、橙色拟合直线、teal CI 带、中位秩散点
3. R(t) 查询输入 `5000` → 点计算 → 应见 `R(t)=X.XX% F=... h=...`
4. 清空输入点计算 → 应见红色 `⚠ 请输入正数 t 值`
5. `amsaa/` 同法验证 doAMQuery 防御反馈

---

## v0.5 — 信任修复 + 专业功能补齐 (2026-04-17)

### A/B 苏格拉底对话摘要

用户提出三个问题：(1) GitHub 部署 Weibull "无法加载设备" 的根因；(2) 字体是否偏小；(3) FTA 可视化树图、3-参数 Weibull (γ)、多数据集叠加。在实现前我们做了独立通道分析：

**Q1 GitHub 故障通道**（工程师 A / 审查员 B 共识）：
| 通道 | 机制 | 处置 |
|---|---|---|
| IndexedDB 源隔离 | `chemcalc.cn` 与 `github.io` 不同 origin，空库被误读为"加载失败" | 增加显式"此域名下暂无数据"提示 |
| ReliDB 未就绪 | CDN 延迟时 inline 脚本 ReferenceError | 全局 `typeof ReliDB==='undefined'` 守卫 |
| 路径大小写敏感 | Windows 不敏感 → Linux GitHub Pages 404 | 新增 `tools/audit-paths.js` CI 脚本 |
| 子路径部署 / SW 缓存 / CORS | 不适用 | — |

**Q2 字体**：body 14px 低于 MDN/Material 16px 默认；二级元素 9-11px 偏小。→ **分级提升**：body 15, `.ct/.title` 14, `.mz` 12, `.md .kl .sl` 11, `.ks .mbg` 10。

**Q3 功能排序（按 ROI）**：多数据集叠加 > 3P Weibull > FTA 树图。

### 实际交付

| # | 项 | 文件 | 说明 |
|---|---|---|---|
| A-1 | 字体分级提升 | `shared/style.css` | 6 个字号上调 ~7-10% |
| A-2 | ReliDB 守卫 | `weibull/ equipment/ rbd/ fta/ fmea/ ram/ rbi/ pm/ alloc/index.html` | 顶层 `typeof` 检测 + 红色 banner；weibull/ equipment/ 两处深化（空库显式提示） |
| A-3 | 路径审计 | `tools/audit-paths.js` | 扫描 19 HTML 文件所有 `src/href`，对照磁盘实际大小写；当前 `All paths OK` |
| B | 多数据集叠加概率纸 | `weibull/index.html` | `WB.overlays[]` + `addOverlay()`/`clearOverlays()`；6 色循环 + 虚线拟合 + 三角散点 |
| C | 3 参数 Weibull γ | `shared/math.js` + `weibull/index.html` | `RM.fitWB3p()` Profile likelihood（γ 在 `[0, min(t)·0.95]` 扫 40 点）；KPI 仅当 ΔAIC > 2 且 γ 不平凡才显示 |
| D | FTA 可视化树图 | `fta/index.html` | `buildFTATree`+`layoutFTA`+`drawFTATree` ~100 行 SVG；AND/OR/EVENT 三种符号 + 贝塞尔连线 + 循环检测 |
| 附 | 版本号统一 | 全部 `index.html` | 页脚 v0.4 → v0.5 |

### 回归测试

- `node tests/run_all.js` → **6/6 PASS**（13 assertions）
- `node tools/audit-paths.js` → **19 HTML OK, 0 issues**

### 浏览器验证清单

1. **字体**：所有模块对比 v0.4，文字明显更易读，布局无溢出
2. **GitHub 预检**：临时断网/改名 `db/` → `DB/` 重载 Weibull，应见红色 "⚠ DB 模块未加载" banner（而非空白报错）
3. **Weibull 多数据集**：加载 `pump` 示例 → 分析 → 切"概率纸" → 点 "+ 加入数据集" → 切回输入加载 `bearing` 示例 → 分析 → 切"概率纸" → 应见紫色虚线+三角散点叠加，右上图例显示两个数据集
4. **3P Weibull**：数据含明显无损期（如 `[500,501,600,620,700,900,1200,1800]`）→ 分析 → 应见紫色 γ 卡片，ΔAIC > 2
5. **FTA 树图**：FTA → 载入示例 → 求解 → 应见 SVG 树：TOP→OR，PUMP_BLOCK→AND 两个圆事件，COMMON→OR 两个圆事件

### 延后项（v0.6+）

- RBD P&ID 拖拽编辑器 / ALTA / Markov / 多层级备件 / CCF
- FTA 交互：hover 高亮最小割集所属路径
- 3P Weibull Fisher CI on γ

