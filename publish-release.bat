@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ===============================================
echo MiniMax 发布流水线一键触发
echo ===============================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
  echo [错误] 未检测到 git
  pause
  exit /b 1
)

for /f %%i in ('git status --porcelain') do set DIRTY=1
if defined DIRTY (
  echo [错误] 当前工作区有未提交改动，请先提交后再发布
  pause
  exit /b 1
)

set /p TAG=请输入要发布的 Tag（例如 v1.0.4）:
if "%TAG%"=="" (
  echo [错误] Tag 不能为空
  pause
  exit /b 1
)

if /i not "%TAG:~0,1%"=="v" (
  echo [错误] Tag 必须以 v 开头，例如 v1.0.4
  pause
  exit /b 1
)

git fetch --tags
git rev-parse "%TAG%" >nul 2>nul
if %errorlevel% equ 0 (
  echo [错误] Tag 已存在：%TAG%
  pause
  exit /b 1
)

echo [步骤] 推送 main 分支...
git push origin main
if %errorlevel% neq 0 (
  echo [错误] main 推送失败
  pause
  exit /b 1
)

echo [步骤] 创建并推送 Tag：%TAG%
git tag %TAG%
if %errorlevel% neq 0 (
  echo [错误] Tag 创建失败
  pause
  exit /b 1
)

git push origin %TAG%
if %errorlevel% neq 0 (
  echo [错误] Tag 推送失败
  pause
  exit /b 1
)

echo.
echo [成功] 已触发发布流水线
start "" "https://github.com/hss-ai/MiniMax-TokenPlan-Agent/actions"
start "" "https://github.com/hss-ai/MiniMax-TokenPlan-Agent/releases"
pause
