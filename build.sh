#!/bin/bash
# Railway构建脚本：先构建前端，再准备后端

set -e

echo "====== 构建前端 ======"
cd frontend
npm install
npm run build
cd ..

echo "====== 复制前端构建产物 ======"
rm -rf backend/static
cp -r frontend/dist backend/static

echo "====== 构建完成 ======"
ls -la backend/static/
