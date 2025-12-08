@echo off
echo Deploying Firestore Rules to Firebase...
cd /d "%~dp0"
call firebase deploy --only firestore:rules
echo.
echo Rules deployed successfully!
pause
