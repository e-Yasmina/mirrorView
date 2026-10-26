@echo off
:: Check for permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Requesting administrative privileges to unregister Virtual Camera...
    powershell -Command "Start-Process cmd -ArgumentList '/c `"%~f0`"' -Verb RunAs"
    exit /b
)

pushd "%~dp0"
echo Unregistering MirrorView Virtual Camera DirectShow Filter...
regsvr32.exe /u /s "%~dp0UnityCaptureFilter64.dll"
regsvr32.exe /u /s "%~dp0UnityCaptureFilter32.dll"

echo.
echo ====================================================================
echo  MirrorView Virtual Camera has been cleanly unregistered.
echo ====================================================================
echo.
pause
