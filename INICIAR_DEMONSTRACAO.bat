@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 goto usar_python
py -3 app.py --demo --open-browser
goto fim
:usar_python
python app.py --demo --open-browser
:fim
if errorlevel 1 pause
