# 🚀 Cloud Deployment Guide - FREE Hosting

Deploy your Argyle news ticker to the cloud for free! This guide covers multiple free hosting options.

## 🌟 Option 1: Render (Recommended - Easiest)

### Step 1: Prepare Your Repository
1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for cloud deployment"
   git push origin main
   ```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `argyle-news-ticker`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click "Create Web Service"

### Step 3: Get Your Cloud URL
- Render will give you a URL like: `https://argyle-news-ticker.onrender.com`
- Your news API will be: `https://argyle-news-ticker.onrender.com/api/news`

---

## 🌟 Option 2: Railway (Alternative)

### Step 1: Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js and deploy

### Step 2: Get Your Cloud URL
- Railway provides a URL like: `https://argyle-news-ticker-production.up.railway.app`

---

## 🌟 Option 3: Vercel (Serverless)

### Step 1: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project" → Import your repository
3. Vercel will auto-detect and deploy

### Step 2: Get Your Cloud URL
- Vercel provides a URL like: `https://argyle-news-ticker.vercel.app`

---

## 🔧 Update Your Frontend

Once deployed, update your frontend to use the cloud URL:

### Option A: Update in HTML
```html
<script>
initNewsTicker({
    target: '#news-ticker',
    endpoint: 'https://your-app-name.onrender.com/api/news',
    speed: 60,
    gap: 48
});
</script>
```

### Option B: Environment Variable
```javascript
const NEWS_API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-app-name.onrender.com/api/news'
    : 'http://localhost:3005/api/news';
```

---

## 📱 Test Your Cloud Deployment

### 1. Check Health
```bash
curl https://your-app-name.onrender.com/api/health
```

### 2. Test News API
```bash
curl https://your-app-name.onrender.com/api/news
```

### 3. Test in Browser
Visit: `https://your-app-name.onrender.com/`

---

## 🔄 Automatic Updates

### Render Auto-Deploy
- **Free**: Automatic deployment on every GitHub push
- **No manual intervention needed**

### Railway Auto-Deploy
- **Free**: Automatic deployment on every GitHub push
- **Real-time updates**

### Vercel Auto-Deploy
- **Free**: Automatic deployment on every GitHub push
- **Preview deployments for PRs**

---

## 💰 Cost Breakdown

### Render Free Tier
- ✅ **750 hours/month** (enough for 24/7)
- ✅ **512MB RAM**
- ✅ **Shared CPU**
- ✅ **Custom domains**
- ✅ **SSL certificates**
- ❌ **Sleeps after 15 minutes of inactivity**

### Railway Free Tier
- ✅ **$5 credit monthly** (usually enough)
- ✅ **512MB RAM**
- ✅ **Shared CPU**
- ✅ **Custom domains**
- ❌ **Credit expires monthly**

### Vercel Free Tier
- ✅ **Unlimited deployments**
- ✅ **100GB bandwidth/month**
- ✅ **Custom domains**
- ✅ **SSL certificates**
- ❌ **Serverless function limits**

---

## 🚨 Important Notes

### 1. **Sleep Mode (Render)**
- Free tier apps sleep after 15 minutes of inactivity
- First request after sleep takes 10-30 seconds
- Consider upgrading to $7/month for always-on

### 2. **Rate Limiting**
- External APIs may rate-limit cloud IPs
- Your current 5-minute intervals are perfect

### 3. **Environment Variables**
- Set `NODE_ENV=production` in cloud dashboard
- This enables production optimizations

---

## 🔍 Troubleshooting

### Common Issues

**App won't start:**
- Check build logs in cloud dashboard
- Ensure `package.json` has correct `start` script
- Verify Node.js version compatibility

**API returns errors:**
- Check cloud app logs
- Verify environment variables
- Test locally first

**Slow response times:**
- Free tier apps may have cold starts
- Consider upgrading to paid tier for better performance

---

## 🎯 Next Steps

1. **Choose your platform** (Render recommended for beginners)
2. **Deploy following the steps above**
3. **Update your frontend** with the new cloud URL
4. **Test thoroughly** in production
5. **Monitor performance** in cloud dashboard

---

## 🆘 Need Help?

- **Render**: Excellent documentation and support
- **Railway**: Great Discord community
- **Vercel**: Comprehensive guides and examples

**Your news ticker will work 24/7 in the cloud for FREE! 🎉**
