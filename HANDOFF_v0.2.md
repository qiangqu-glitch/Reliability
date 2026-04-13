# ReliToolbox v0.2 — 数据库统一 + FMEA设备联动

**交付日期**: 2026-04-13
**域名**: reliability.chemcalc.cn
**部署**: Cloudflare Pages

---

## v0.2 修复内容

### ✅ P0 — 消灭DB路径依赖bug（关键）
- `db/relidb.js` VER: 1 → **2**，补全8张表（新增 `fmea_worksheets` + `rbd_models`）
- `equipment/index.html`：删除内嵌DB初始化 → 改用 `<script src="../db/relidb.js">` + `ReliDB` API
- `fmea/index.html`：同上
- **效果**：无论用户以任何顺序访问任何模块，数据库schema始终由relidb.js权威管理，路径依赖彻底消除

### ✅ P1a — FMEA设备联动
- FMEA工作表行内"设备"列：从自由文本输入框 → **从equipments表读取的下拉选择**
- `equipList` 在 `loadSaved()` 时自动从DB刷新
- 下拉包含 `(手动输入)` 选项，兼容无设备台账时的使用
- 保存/加载工作集时设备选择随之还原（value匹配 `e.tag`）

### ✅ RAM Worker已为默认入口（v0.1已完成，无需重复）

---

## 数据库架构 v0.2（8张表，统一由relidb.js管理）

| 表名 | 说明 |
|------|------|
| equipments | 设备台账 |
| failures | 故障记录（FRACAS基础） |
| fmea | FMEA条目（保留，兼容旧数据） |
| fmea_worksheets | FMEA工作集（工作表保存）|
| weibull_results | Weibull分析结果 |
| fta_models | 故障树模型 |
| rbd_models | 可靠性框图模型 |
| rbi_assessments | RBI评估记录 |

---

## 下一步优先工作（v0.3）

### P1b — FRACAS闭环（独立会话开发）
1. equipment模块新增"添加故障记录"按钮 → 写入failures表
2. failures表写入时触发 `ReliDB._onFailureAdded`
3. weibull模块监听该钩子，自动重算对应设备MTBF
4. equipment卡片显示最新MTBF（从weibull_results读取）

### P2 — RBI回写equipment.risk

---

## 新对话启动Prompt

> 我是屈博士，继续开发 ReliToolbox。
> 当前版本 v0.2，域名 reliability.chemcalc.cn。
> Cloudflare Pages部署，单文件HTML，无构建链。
> 共享DB: ReliToolbox IndexedDB VER=2，8张表，由db/relidb.js统一管理。
> 所有模块通过 ReliDB.* API访问，equipment/fmea已迁移完成。
> 请读 HANDOFF_v0.2.md 了解完整状态。
> 下一步做：[P1b FRACAS闭环 / P2 RBI回写]
