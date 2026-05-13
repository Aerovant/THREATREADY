@echo off
echo === Building...
cd /d D:\cyberprep-api\my-app
call npm run build
if errorlevel 1 goto :error

echo === Copying to Landing_Page...
xcopy /E /I /Y D:\cyberprep-api\my-app\dist\* D:\Landing_Page\app\

echo === Pushing to cyberprep-api...
cd /d D:\cyberprep-api
git add my-app/src
git commit -m "deploy: update interview"
git push origin main

echo === Pushing to Landing_Page...
cd /d D:\Landing_Page
git add app/
git commit -m "deploy: update dashboard"
git push origin main

echo === Done. Wait 1 min, then check threatready.io/app/
goto :end

:error
echo Build failed.
:end
pause