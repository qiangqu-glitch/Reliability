# ReliToolbox v0.3 — FRACAS数据联动

**交付日期**: 2026-04-13
**域名**: reliability.chemcalc.cn
**部署**: Cloudflare Pages（推送GitHub自动部署）

---

## v0.3 新增内容

### ✅ 1. Equipment 故障录入 Tab（FRACAS基础）
- 每台设备卡片新增 ⚡ 按钮，展开故障记录面板
- 故障录入字段：日期、TTF、TTR、失效模式、根本原因、截尾标记、备注
- 自动统计 MTBF/MTTR/可用度（注明"统计值，非Weibull拟合"）
- 故障数据写入共享 `failures` 表（ReliDB.addFailure）
- 同步更新 equipment 记录的 `mtbf_stat` / `mttr_stat` 字段

### ✅ 2. Weibull ← Equipment 故障数据联动
- Weibull 输入页新增"从设备故障台账加载"卡片
- 下拉选择设备 → 一键加载 TTF/截尾数据 → 工程师手动点击分析
- 支持从 Equipment 模块"→ Weibull分析"按钮直接跳转（sessionStorage传参）
- **设计原则**：数据自动加载，分析仍由工程师确认触发（避免无意义自动计算）

### ✅ 3. RBI → Equipment 风险回写
- calcRBI() 计算完成后，自动将结果写入 `rbi_assessments` 表
- 同步将风险等级（H/M/L）和下次检验年份回写到 `equipments` 表对应记录
- Equipment 模块风险列即时反映 RBI 评估结果，无需手动录入

---

## 数据流全景（v0.3完成后）

```
Equipment台账
  ↓ ⚡故障录入      → failures表
  ↓ → Weibull跳转   → weibull模块（手动分析）→ weibull_results表
  ↓ 风险显示         ← rbi_assessments表 ← RBI计算
```

---

## 下一步 v0.4 建议

### P1 — Weibull结果保存到DB
- runWB() 完成后，将 β、η、MTTF、B10 写入 weibull_results 表
- Equipment 模块显示最新 Weibull 结果（非统计均值）

### P2 — PDF导出
- FMEA/RBI/Weibull结果一键生成PDF报告（工程交付必需）

### P3 — Equipment 风险仪表板
- 主页增加风险分布图（高/中/低设备数量饼图）

---

## 新对话启动Prompt

> 我是屈博士，继续开发 ReliToolbox。
> 当前版本 v0.3，域名 reliability.chemcalc.cn。
> 部署：Cloudflare Pages，单文件HTML，无构建链。
> 共享DB: ReliToolbox IndexedDB VER=2，8张表，db/relidb.js统一管理。
> 数据流：Equipment故障录入→failures表；Weibull从failures加载；RBI结果回写equipment.risk。
> 请读 HANDOFF_v0.3.md 了解完整状态。
> 下一步做：[从上面P1/P2/P3选择]
