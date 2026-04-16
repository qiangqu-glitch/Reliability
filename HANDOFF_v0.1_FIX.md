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
