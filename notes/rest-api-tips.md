---
title: REST API 设计要点
date: 2026-05-19
tag: 便签
excerpt: 统一错误格式、分页规范、版本控制。
---

REST API 设计三要点：

1. 统一错误格式：`{"error": {"code": "...", "message": "..."}}`
2. 分页规范：`?page=1&size=20`，响应里带 `total` 和 `has_next`
3. 版本控制：URL 前缀 `/api/v1/` 比 Header 版本号更直观

顺便，永远不要在 GET 请求里用 body。
