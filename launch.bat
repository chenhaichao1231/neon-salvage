@echo off
setlocal DisableDelayedExpansion
rem Open only the local game. No downloads, installation or settings changes.
if not exist "%~dp0index.html" (
  echo Game file missing. Extract the full ZIP before launching.
  pause
  exit /b 1
)
start "" "%~dp0index.html"
endlocal
