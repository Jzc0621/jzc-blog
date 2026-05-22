---
title: Python 异步编程入门：从回调到 async/await
date: 2026-05-20
tag: 技术
excerpt: 用厨房做早餐的场景解释协程、事件循环和 Future 的关系。
---

## 厨房比喻

想象你在做早餐：

1. 你把面包放进烤面包机（**启动一个任务**）
2. 不用站在那等面包烤好，你转身去煎鸡蛋（**切换到另一个任务**）
3. 面包机"叮"一声（**任务完成通知**）
4. 你回来取面包（**获取结果**）

这就是异步编程的核心思想——**在等待的时候做别的事**。

## 同步 vs 异步

先看同步版本的"做早餐"：

```python
import time

def make_toast():
    print("面包放进烤面包机...")
    time.sleep(3)  # 模拟等待 3 秒
    print("面包烤好了!")
    return "Toast"

def fry_eggs():
    print("开始煎鸡蛋...")
    time.sleep(5)  # 模拟等待 5 秒
    print("鸡蛋煎好了!")
    return "Eggs"

# 同步执行：总共 8 秒
toast = make_toast()
eggs = fry_eggs()
```

再看异步版本：

```python
import asyncio

async def make_toast():
    print("面包放进烤面包机...")
    await asyncio.sleep(3)  # 不阻塞，让出控制权
    print("面包烤好了!")
    return "Toast"

async def fry_eggs():
    print("开始煎鸡蛋...")
    await asyncio.sleep(5)
    print("鸡蛋煎好了!")
    return "Eggs"

async def make_breakfast():
    # 并发执行：总共 5 秒（取最长）
    toast, eggs = await asyncio.gather(
        make_toast(),
        fry_eggs()
    )
    print(f"早餐完成: {toast} + {eggs}")

asyncio.run(make_breakfast())
```

## 关键概念

| 概念 | 厨房比喻 | 代码 |
|------|----------|------|
| 协程 (coroutine) | 你做一道菜的过程 | `async def` 函数 |
| 事件循环 (event loop) | 你在厨房里来回走动，检查各个任务 | `asyncio.run()` |
| await | 等面包机"叮"一下 | `await` 关键字 |
| gather | 同时做多件事 | `asyncio.gather()` |

## 什么时候用 async

- 大量 I/O 操作：网络请求、文件读写、数据库查询
- 需要并发但不想要多线程的复杂性
- Web 服务器处理并发请求

**不适合** CPU 密集型计算——那需要用多进程。

## 一个实际例子

```python
import asyncio
import aiohttp

async def fetch_url(session, url):
    async with session.get(url) as response:
        return await response.text()

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# 同时请求 10 个 URL，总共只要最长那个的时间
urls = [f"https://api.example.com/item/{i}" for i in range(10)]
results = asyncio.run(fetch_all(urls))
```

## 总结

协程不难，难的是忘掉"顺序执行"的思维习惯。下次写 I/O 密集的 Python 代码时，试试 `async/await`。
