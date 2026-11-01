@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 goto usar_python
py -3 -m unittest discover -s tests -v
goto fim
:usar_python
python -m unittest discover -s tests -v
:fim
pause
