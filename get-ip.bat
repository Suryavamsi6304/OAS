@echo off
echo Getting your IP address for network access...
echo.
echo Your IP addresses:
ipconfig | findstr /i "IPv4"
echo.
echo Share this URL with your friend:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo http://%%b:3000
    )
)
echo.
pause