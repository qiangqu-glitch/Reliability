# ReliToolbox v0.1 — 统一整合交付包

**交付日期**: 2026-04-13
**网站域名**: reliability.chemcalc.cn
**部署平台**: Cloudflare Pages

---

## 本次 v0.1 修复内容（统一整合）

### ✅ 修复1：IndexedDB 数据库名冲突（关键bug）
- `equipment/index.html` 的 `DB='ReliDB'` 改为 `DB='ReliToolbox'`
- 现在所有模块统一使用同一数据库 `ReliToolbox`，数据共享正常

### ✅ 修复2：统一主页（13模块完整注册）
- 根 `index.html` = `home/index.html`（内容完全同步）
- 新增 SIL / AMSAA / Equipment 三个模块卡片（之前标"待上线"或缺失）
- 13个模块全部在主页有入口卡片

### ✅ 修复3：_redirects 补全（16条路由）
- 新增 /fta /alloc /rbd-mcs /equipment /rbd /home 等8条缺失路由
- 根路径 / → index.html

### ✅ 修复4：版本号全局统一为 v0.1
- 所有模块 footer/title 从 v4.1~v4.5 统一为 v0.1

### ✅ 修复5：导航返回链接补全
- alloc / fta / rbd_mcs / fmea 模块头部新增"← ReliToolbox 主页"按钮

### ✅ 修复6：清理废弃文件
- 删除 rbd/rbd_builder.html（v1旧版）
- 删除 HANDOFF v4.3/v4.4/v4.5（保留本文件）

---

## 模块全清单

| 目录 | 模块 | 状态 | 备注 |
|------|------|------|------|
| weibull/ | Weibull分析 | ✅ | MLE·截尾·B-Life |
| weibull/weibull_advanced.html | Weibull高级 | ✅ | 区间截尾·CI |
| fmea/ | FMEA/RCM | ✅ | IndexedDB持久化 |
| lcc/ | 生命周期成本 | ✅ | NPV·EAC |
| ram/ | RAM仿真 | ✅ | 事件驱动MC |
| ram/ram_worker.html | RAM Worker版 | ✅ | Web Worker改进版 |
| rbi/ | RBI检验 | ✅ | API 580/581 |
| spa/ | 备件优化 | ✅ | Poisson模型 |
| sil/ | SIL计算 | ✅ | IEC 61508/61511 |
| amsaa/ | 可靠性增长 | ✅ | Crow-AMSAA |
| fta/ | 故障树FTA | ✅ | MOCUS算法 |
| alloc/ | 可用度分配 | ✅ | AGREE/Equal |
| rbd_mcs/ | RBD最小割集 | ✅ | MCS分析 |
| rbd/index.html | RBD画布 | ✅ | 拖拽构建 |
| equipment/ | 设备管理 | ✅ v0.1新 | CRUD台账 |

---

## 部署步骤

```bash
# 1. 将 Reliability/ 目录内容推送到 GitHub 仓库根目录
git add -A
git commit -m "ReliToolbox v0.1 - unified release"
git push

# 2. Cloudflare Pages 自动部署（已连接仓库则自动触发）

# 3. 访问验证
# https://reliability.chemcalc.cn/         → 主页（13模块）
# https://reliability.chemcalc.cn/weibull  → Weibull分析
# https://reliability.chemcalc.cn/equipment → 设备管理
```

---

## 数据库架构（所有模块共享）

- **数据库名**: `ReliToolbox`（IndexedDB，浏览器本地）
- **版本**: VER=1
- **8张表**: equipments / failures / fmea / fmea_worksheets / weibull_results / fta_models / rbd_models / rbi_assessments

---

## 下一步优先工作

### P1 — 数据闭环（高价值）
1. **FRACAS闭环**: failures表写入 → 自动触发Weibull重算 → 更新equipment.mtbf
2. **Equipment → FMEA联动**: FMEA设备下拉从equipments表读取（当前fmea用手动输入）
3. **Equipment → RBI联动**: RBI评估结果回写equipment.risk字段

### P2 — 功能增强
4. **RAM Worker版设为默认**: 更新主页ram卡片链接从 `ram/index.html` → `ram/ram_worker.html`
5. **weibull_advanced集成**: 合并到weibull/index.html作为"高级模式"tab
6. **PDF报告导出**: FMEA/RBI/Weibull结果一键生成PDF

### P3 — 远期
7. **RBD拖拽画布升级**: rbd_v2与rbd_mcs联动
8. **Markov三状态RAM**: 补充解析方法

---

## 新对话启动 Prompt

> 我是屈博士，继续开发 ReliToolbox。
> 当前版本 v0.1，域名 reliability.chemcalc.cn，
> 部署在 Cloudflare Pages，单文件HTML架构，不引入构建链。
> 共享数据库名统一为 'ReliToolbox'（IndexedDB VER=1，8张表）。
> 请读 HANDOFF_v0.1.md 了解完整状态。
> 下一步做：[从上面P1列表选择]
