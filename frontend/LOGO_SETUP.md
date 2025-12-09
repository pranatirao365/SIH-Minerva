# MinerVa Logo Setup Instructions

## Adding the Logo to the Landing Screen

The landing screen has been created and will display when the app starts. Currently, it uses the default icon.png as a placeholder.

### To add the MinerVa logo:

1. **Save the logo image** with the mining helmet and pickaxes to:
   ```
   frontend/assets/images/minerva-logo.png
   ```

2. The logo should be:
   - **Format**: PNG with transparent background (or the cream color #F5F1E8)
   - **Size**: At least 512x512 pixels for best quality
   - **Content**: The mining helmet with pickaxes design shown in the reference image

3. **Alternative**: If you want to use a different image name, update line 113 in `app/index.tsx`:
   ```typescript
   source={require('../assets/images/YOUR_LOGO_NAME.png')}
   ```

## Landing Screen Features

The landing screen includes:
- ✅ Animated fade-in and scale effect
- ✅ MinerVa logo (once you add the image)
- ✅ "MinerVa" app name in orange (#F59E0B)
- ✅ "Safety First, Always" tagline
- ✅ Mining tools emoji decoration
- ✅ 3-second display duration before navigating to the main app
- ✅ Cream/beige background (#F5F1E8) matching the logo design

## Colors Used

The landing screen uses colors from the logo:
- **Background**: #F5F1E8 (cream/beige)
- **App Name**: #F59E0B (orange - matches helmet)
- **Text**: #1F2937 (dark navy - matches pickaxes)
- **Subtitle**: #374151 (gray)

## Current Status

✅ Landing screen is implemented in `app/index.tsx`
✅ Animation effects are working
⏳ Waiting for logo image to be added to `assets/images/minerva-logo.png`

Once you add the logo image, the landing screen will be complete!
