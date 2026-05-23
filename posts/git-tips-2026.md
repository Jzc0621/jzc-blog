---
title: 5 个我每天都在用的 Git 技巧
date: 2026-05-12
tag: 技术
excerpt: 不是 rebase 教程，是真正每天都会敲的命令。
---

## 1. `git stash -p`

有时候改了一半，需要切分支，但又不想提交半成品。`git stash -p` 可以逐个 hunk 选择要 stash 的内容：

```bash
git stash -p
# y = stash this hunk
# n = don't stash this hunk
# s = split into smaller hunks
```

比 `git stash --all` 精细得多。

## 2. `git log --oneline --graph -20`

比 `git log` 好看 100 倍：

```
* a1b2c3d 添加搜索功能
* d4e5f6g 修复首页样式
|\
| * h7i8j9k 实验性功能
|/
* k0l1m2n 初始化
```

## 3. 修改上一次提交的信息

```bash
git commit --amend -m "新的提交信息"
```

注意：只能改还没 push 的提交。已经 push 了的别 amend。

## 4. `git checkout -`

回到上一个分支，像 `cd -` 一样好用：

```bash
git checkout main
# ...做些事...
git checkout -    # 回到之前的分支
```

## 5. `git blame` 查历史

```bash
git blame path/to/file.py -L 42,50
```

只看第 42 到 50 行是谁改的、什么时候改的、为什么改的（配合 `git log --follow` 看完整历史）。

## 额外赠送

```bash
# 撤销最后一次 commit，保留改动
git reset --soft HEAD~1

# 查看某个文件在所有 commit 中的变化
git log -p -- path/to/file
```

这些不是冷门命令，是每天能帮你省 30 秒的东西。省下来的时间积少成多。
