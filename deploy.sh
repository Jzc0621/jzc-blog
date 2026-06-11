#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== 1. 安装依赖 ==="
pip install flask markdown pygments python-frontmatter pillow flask-sqlalchemy psycopg2-binary

echo "=== 2. 构建静态页面 ==="
python build.py

echo "=== 3. 推送到 GitHub Pages ==="
cp -r dist /tmp/jzc-dist

git checkout --orphan gh-pages 2>/dev/null
git rm -rf . 2>/dev/null

cp -r /tmp/jzc-dist/* .
cp /tmp/jzc-dist/.nojekyll .
rm -rf __pycache__

git add -A
git commit -m "Update blog"
git push -f origin gh-pages

git checkout master
echo "=== 完成！刷新 www.jiazhichao.xyz ==="
