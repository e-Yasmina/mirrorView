@echo off
setlocal EnableDelayedExpansion

:: Check for Administrative Privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo [MirrorView] Requesting Administrator Privileges to register Virtual Camera...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin_mv.vbs"
    echo UAC.ShellExecute "cmd.exe", "/k `"%~f0`"", "", "runas", 1 >> "%temp%\getadmin_mv.vbs"
    "%temp%\getadmin_mv.vbs"
    del "%temp%\getadmin_mv.vbs" 2>nul
    exit /b
)

:: Running with Administrator Privileges
CD /D "%~dp0"

echo ====================================================================
echo  MirrorView Virtual Camera - Windows DirectShow Driver Registration
echo ====================================================================
echo Directory: %CD%
echo.

if not exist "UnityCaptureFilter64.dll" (
    echo [ERROR] UnityCaptureFilter64.dll not found in %CD%
    pause
    exit /b 1
)

echo [1/2] Registering 64-bit DirectShow Virtual Camera Filter...
regsvr32 "UnityCaptureFilter64.dll" "/i:UnityCaptureName=MirrorView Virtual Camera"

echo [2/2] Registering 32-bit DirectShow Virtual Camera Filter...
if exist "UnityCaptureFilter32.dll" (
    regsvr32 "UnityCaptureFilter32.dll" "/i:UnityCaptureName=MirrorView Virtual Camera"
)

echo.
echo ====================================================================
echo  SUCCESS: Virtual Camera registered!
echo.
echo  NEXT STEPS FOR GOOGLE MEET / TEAMS:
echo  1. In Google Meet, click Settings ^> Video.
echo  2. In the "Camera" dropdown, select "MirrorView Virtual Camera"
echo     (or "Unity Video Capture").
echo  3. You will no longer see "Another app is using the camera"!
echo ====================================================================
echo.
pause
