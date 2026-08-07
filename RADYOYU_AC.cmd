@echo off
setlocal
cd /d "%~dp0"
start "" "C:\Users\SeLoCaN\AppData\Local\Programs\Python\Python314\pythonw.exe" "%~dp0radio_server.py" --background
endlocal
