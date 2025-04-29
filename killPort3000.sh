#!/bin/bash

echo "正在查找并终止所有使用3000端口的进程..."

# 查找使用3000端口的进程
PIDS=$(lsof -ti:3000)

if [ -z "$PIDS" ]; then
  echo "没有找到使用3000端口的进程。"
  exit 0
fi

echo "发现以下进程正在使用3000端口:"
for PID in $PIDS; do
  PROCESS_INFO=$(ps -p $PID -o comm=)
  echo "PID: $PID, 进程: $PROCESS_INFO"
done

echo "正在终止这些进程..."
for PID in $PIDS; do
  kill -9 $PID
  echo "已终止进程 $PID"
done

echo "再次检查3000端口..."
CHECK_AGAIN=$(lsof -ti:3000)
if [ -z "$CHECK_AGAIN" ]; then
  echo "所有使用3000端口的进程已成功终止。"
else
  echo "警告：仍有进程在使用3000端口。"
  echo "剩余进程: $CHECK_AGAIN"
fi 