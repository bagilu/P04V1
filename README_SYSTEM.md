# P04 微笑漣漪系統 V2.8 完整版

## 版本定位

本版為完整整合版，不是補丁包。

## 視覺風格

- 80% 遊戲化教育風：活潑色彩、成就感、友善卡片、表格徽章。
- 20% Apple 專業風：清晰字體、留白、玻璃感卡片、低雜訊排版。

## Function 命名

所有 Edge Function 均使用 `P04_` 開頭：

```text
P04_submit_smile_event
P04_get_home_stats
P04_get_records_by_date
P04_get_recent_notice
P04_get_my_records
```

## 資料表

使用既有小寫資料表：

```text
tblp04smileevents
tblp04maillog
```

## 新增功能

主畫面排行榜下方直接內建：

1. 我的微笑紀錄
2. 我的回應紀錄

每頁 10 筆，以 `created_at DESC` 排序。

## ZIP 規則

ZIP 最外層包含同名資料夾：

```text
P04V2_8_full_gamified_apple_my_records/
```

## 非破壞性原則

`sql_setup.sql` 不會刪除既有資料，只補欄位與索引。
