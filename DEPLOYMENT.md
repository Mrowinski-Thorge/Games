# 🚀 Deployment Guide

This guide will help you deploy the Game Hub PWA to various hosting platforms.

## Prerequisites

- All files from the repository
- A web server that supports HTTPS (required for Service Workers)

## Option 1: GitHub Pages (Recommended)

GitHub Pages is free and automatically provides HTTPS.

### Steps:

1. **Push to GitHub** (already done):
```bash
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Source", select the branch (e.g., `main` or `claude/create-hub-website-for-games`)
   - Select root directory `/`
   - Click **Save**

3. **Wait for deployment**:
   - GitHub will build and deploy your site
   - Usually takes 1-2 minutes
   - Your site will be available at: `https://[username].github.io/[repo-name]/`

4. **Test the PWA**:
   - Visit the URL
   - Open DevTools → Application → Service Workers
   - Verify the Service Worker is registered
   - Test offline mode

### Custom Domain (Optional)

If you have a custom domain:
1. Add a `CNAME` file with your domain
2. Configure DNS settings at your domain provider
3. Enable HTTPS in GitHub Pages settings

## Option 2: Netlify

Netlify offers automatic deployments with HTTPS.

### Steps:

1. **Create Netlify account**: Go to [netlify.com](https://netlify.com)

2. **Deploy via Git**:
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the branch
   - Build settings: Leave empty (no build needed)
   - Deploy directory: `/` (root)
   - Click "Deploy site"

3. **Configure**:
   - Netlify automatically provides HTTPS
   - You'll get a URL like `https://[random-name].netlify.app`
   - Can configure custom domain in settings

### Create `netlify.toml` (Optional)

```toml
[build]
  publish = "."

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
```

## Option 3: Vercel

Similar to Netlify, very easy to deploy.

### Steps:

1. **Create Vercel account**: Go to [vercel.com](https://vercel.com)

2. **Import project**:
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Framework Preset: "Other"
   - Click "Deploy"

3. **Configure**:
   - Automatic HTTPS
   - URL: `https://[project-name].vercel.app`

## Option 4: Local Server (Development)

For local testing and development.

### Python (Simple HTTP Server)

```bash
# Python 3
cd /path/to/Games
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Visit: `http://localhost:8000`

**Note**: Service Workers require HTTPS in production. For local testing, `localhost` is allowed without HTTPS.

### Node.js (http-server)

```bash
npm install -g http-server
cd /path/to/Games
http-server -p 8000
```

### PHP

```bash
cd /path/to/Games
php -S localhost:8000
```

## Option 5: Traditional Web Hosting

If you have traditional web hosting (cPanel, FTP, etc.):

1. **Upload files** via FTP/SFTP:
   - Upload all files to `public_html` or web root
   - Maintain directory structure

2. **Ensure HTTPS**:
   - Service Workers require HTTPS
   - Most modern hosts provide free SSL certificates (Let's Encrypt)
   - Enable HTTPS in your hosting control panel

3. **Configure `.htaccess` (Apache)** (optional):

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proper MIME types
<IfModule mod_mime.c>
  AddType application/manifest+json .json
  AddType image/svg+xml .svg
</IfModule>

# Cache control for Service Worker
<FilesMatch "sw\.js$">
  Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>
```

## Post-Deployment Checklist

After deploying, verify these items:

### ✅ Service Worker
- [ ] Open DevTools → Application → Service Workers
- [ ] Service Worker should be "activated and running"
- [ ] Check for any errors in console

### ✅ Manifest
- [ ] DevTools → Application → Manifest
- [ ] All icons should load correctly
- [ ] Name and theme color should be correct

### ✅ Offline Functionality
- [ ] Visit the site
- [ ] Open DevTools → Network
- [ ] Set to "Offline" mode
- [ ] Reload page - should still work
- [ ] Try loading each game

### ✅ Cache
- [ ] DevTools → Application → Cache Storage
- [ ] Should see cache entries
- [ ] Verify all assets are cached

### ✅ Installation
- [ ] Browser should show "Install" button/prompt
- [ ] Test installation on desktop
- [ ] Test on mobile (Android/iOS)

### ✅ Games
- [ ] All three games should load
- [ ] Escape Road should save/restore state
- [ ] Home button should work
- [ ] Auto-save should work (check console logs)

## Troubleshooting

### Service Worker not registering

**Problem**: "Service Worker registration failed"

**Solutions**:
- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Verify `sw.js` is in the root directory
- Clear browser cache and reload

### Games not loading

**Problem**: Games show blank screen

**Solutions**:
- Check browser console for CORS errors
- Verify all game files are uploaded
- Check that iframe `src` paths are correct
- Ensure external CDN resources are accessible

### Offline mode not working

**Problem**: Site doesn't work offline

**Solutions**:
- Verify Service Worker is active
- Check that all resources are cached
- Look for failed fetch requests in console
- Wait for cache to complete (can take a few seconds on first load)

### Icons not showing

**Problem**: PWA icons don't display

**Solutions**:
- Verify icon files exist and are accessible
- Check manifest.json icon paths
- Use absolute paths (starting with `/`)
- Clear browser cache
- Try different icon sizes

## Performance Optimization

### Enable Compression

Add to `.htaccess` (Apache):
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
```

### CDN (Optional)

For better performance worldwide:
- Use Cloudflare (free tier available)
- Configure caching rules
- Enable HTTP/2

## Monitoring

### Check PWA Score

Use Lighthouse (in Chrome DevTools):
1. Open DevTools → Lighthouse
2. Select "Progressive Web App"
3. Click "Generate report"
4. Aim for 90+ score

### Analytics (Optional)

To track usage, add analytics:
- Google Analytics
- Plausible (privacy-friendly)
- Simple Analytics

Add tracking code to `index.html` before `</body>`.

## Updating the App

When you make changes:

1. **Update files** (push to GitHub or upload)

2. **Update Service Worker version**:
   ```javascript
   // In sw.js
   const CACHE_NAME = 'game-hub-v2'; // Increment version
   ```

3. **Users will auto-update** on next visit

4. **Optional**: Add update notification in `app.js`

## Support

For issues or questions:
- Check the [README.md](README.md)
- Review browser console errors
- Check GitHub Issues

---

**Ready to deploy? Start with GitHub Pages for the easiest setup!**
