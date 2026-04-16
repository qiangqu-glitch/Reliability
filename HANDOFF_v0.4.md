# ReliToolbox v0.4 — 数据链路闭合 + PM优化 + PDF导出

**交付日期**: 2026-04-13
**域名**: reliability.chemcalc.cn
**部署**: Cloudflare Pages

---

## v0.4 新增内容

### 1. Weibull结果写入DB（数据链路最后一环）
- runWB()分析完成后，自动将 β/η/MTTF/B10/B50/AIC 写入 `weibull_results` 表
- 自动尝试匹配设备台账中的 equipId（按tag名称模糊匹配）
- Equipment 模块的设备列表现在直接显示最新 Weibull β 和 η 值

### 2. PM间隔优化模块（全新，/pm）
- 数学模型：Age Replacement Model，成本率 C(T) = (Cp·R(T) + Cf·(1-R(T))) / ∫R(t)dt
- 数值积分：Simpson法则，500点，精度足够工程使用
- 二级搜索：粗扫200点 + 细搜optT±5%范围300点
- 从设备台账直接加载 Weibull 参数（需先做Weibull分析）
- β≤1 时给出警告（DFR/CFR不适合时间基准PM）
- 输出：成本率曲线图、Cf/Cp敏感性柱状图、区间对比表、中英双语工程建议
- 内置打印/PDF导出按钮

### 3. 全局PDF打印支持
- shared/style.css 新增 @media print 规则
- 打印时自动隐藏：header、按钮、搜索栏、弹窗、no-print元素
- Weibull/FMEA/RBI/SPA/PM 模块均已添加"🖨️ 打印/导出PDF"按钮

---

## 完整数据流（v0.4闭合）

```
Equipment台账（设备信息）
  ↓ ⚡故障录入           → failures表（TTF/TTR/模式/根因）
  ↓ → Weibull分析跳转
      → Weibull加载故障数据 → 分析 → weibull_results表（β/η/MTTF）
      → Equipment显示β/η
  ↓ → PM优化模块         ← weibull_results表（加载β/η）
      → 输出最优PM间隔 T*
  ↓ 风险等级显示          ← rbi_assessments表 ← RBI评估
```

---

## 14个模块清单

| 模块 | 路径 | 状态 |
|------|------|------|
| Weibull分析 | /weibull | ✅ v0.4新增DB写入+打印 |
| FMEA/RCM | /fmea | ✅ 打印 |
| LCC生命周期成本 | /lcc | ✅ |
| RAM仿真 | /ram (Worker) | ✅ |
| RBI基于风险检验 | /rbi | ✅ 打印 |
| 备件优化 | /spa | ✅ 打印 |
| SIL计算 | /sil | ✅ |
| 可靠性增长AMSAA | /amsaa | ✅ |
| 故障树FTA | /fta | ✅ |
| 可用度分配 | /alloc | ✅ |
| RBD最小割集 | /rbd-mcs | ✅ |
| RBD画布 | /rbd | ✅ |
| 设备管理 | /equipment | ✅ v0.4显示Weibull结果 |
| **PM间隔优化** | **/pm** | ✅ **v0.4新增** |

---

## 下一步 v0.5 建议

### P1 — FMEA中显示设备Weibull结果
- FMEA工作表中，选择设备后自动显示其最新β/MTTF供参考

### P2 — Equipment风险仪表板
- 主页增加快速统计（高风险设备数、检验到期数）

### P3 — LCC联动Equipment
- LCC模块从Equipment读取CAPEX/年维修费等参数

---

## 新对话启动Prompt

> 我是屈博士，继续开发 ReliToolbox。
> 当前版本 v0.4，域名 reliability.chemcalc.cn。
> 部署：Cloudflare Pages，单文件HTML，无构建链。
> 共享DB: ReliToolbox IndexedDB VER=3，9张表(含components组件库)，db/relidb.js统一管理。
> 数据流已闭合：failures→Weibull→weibull_results→PM优化；RBI→equipment.risk
> 14个模块，含全局PDF打印支持。
> 请读 HANDOFF_v0.4.md 了解完整状态。
> 下一步做：[P1/P2/P3]
