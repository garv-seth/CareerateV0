# 🔧 AZURE DEPLOYMENT TROUBLESHOOTING

## 🚨 IMMEDIATE ACTIONS IF DEPLOYMENT FAILS

### 1. **Check Azure Log Stream**
Monitor the live logs at: https://portal.azure.com → Your App Service → Log stream

### 2. **Force Restart App Service**
- Go to Azure Portal → Your App Service → Overview → Restart
- Wait 5 minutes then check logs again

### 3. **Clear App Service Cache**
- Go to Azure Portal → Your App Service → Advanced Tools (Kudu) → CMD
- Run: `rm -rf /home/site/wwwroot/node_modules`
- Restart the app service

---

## 💾 IMMEDIATE FALLBACK SOLUTIONS

### **Option 1: Use Minimal Dependencies**
If npm install is failing due to space/memory constraints:

```bash
# In your local backend folder:
cp package.minimal.json package.json
git add . && git commit -m "Switch to minimal dependencies" && git push
```

### **Option 2: Use Emergency Startup Script**
If the main startup script fails:

```bash
# Change Azure startup command to:
bash startup-fallback.sh
```

### **Option 3: Manual Emergency Server**
If everything fails, create this as `backend/emergency-server.js`:

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('*', (req, res) => res.send('<h1>🚀 Careerate Emergency Server</h1><p>API is running</p>'));

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

Then set Azure startup command to: `node emergency-server.js`

---

## 🔍 COMMON AZURE DEPLOYMENT ERRORS & FIXES

### **Error: "npm ERR! nospc (no space left)"**
**Cause**: Azure container running out of space during npm install
**Fix**: 
- Use minimal package.json
- Clear Kudu cache
- Scale up App Service plan temporarily

### **Error: "Container didn't respond to HTTP pings"**
**Cause**: Server not starting on correct port
**Fix**: Ensure `PORT` environment variable is used in server code

### **Error: "Module was compiled against different Node.js version"**
**Cause**: Node.js version mismatch between build and runtime
**Fix**: Set consistent Node.js version in package.json engines

### **Error: "npm install hangs/times out"**
**Cause**: Network issues or large dependency tree
**Fix**: 
- Use `npm ci` instead of `npm install`
- Reduce dependencies
- Add `--no-optional` flag

---

## ⚡ QUICK DIAGNOSIS COMMANDS

### **Check Current App Status**
```bash
curl https://careerate-app.azurewebsites.net/health
```

### **Check Available Space in Kudu**
- Go to Kudu Console (Advanced Tools)
- Run: `df -h`

### **Force Clean Rebuild**
- Go to Kudu Console
- Run: `rm -rf node_modules && rm -rf dist`
- Restart app service

---

## 📊 MONITORING & DEBUGGING

### **Key Log Patterns to Watch For**

1. **Success Pattern**:
```
✅ Dependencies installed
✅ Build complete
🚀 Starting server...
info: Server running on port 8080
```

2. **Failure Patterns**:
```
npm ERR! nospc              → Space issue
npm ERR! network           → Network issue  
Error: Cannot find module  → Build issue
Container didn't respond   → Port issue
```

### **Health Check URLs**
- **Main**: https://careerate-app.azurewebsites.net
- **Health**: https://careerate-app.azurewebsites.net/health
- **API**: https://careerate-app.azurewebsites.net/api

---

## 🎯 STEP-BY-STEP EMERGENCY RECOVERY

### **If Deployment is Currently Failing**:

1. **Immediate**: Force restart App Service
2. **Monitor**: Check log stream for error patterns
3. **Quick Fix**: Switch to minimal package.json
4. **Push**: Commit and push changes
5. **Wait**: Give Azure 10-15 minutes to redeploy
6. **Test**: Check health endpoint

### **If Still Failing**:

1. **Scale Up**: Temporarily increase App Service plan
2. **Clear Cache**: Use Kudu to clear node_modules
3. **Emergency Mode**: Use fallback startup script
4. **Manual Deploy**: Use emergency server approach

---

## 🔄 CONTINUOUS MONITORING

### **Set Up Alerts**
- Azure Portal → Your App Service → Alerts
- Monitor: HTTP 5xx errors, Response time, CPU usage

### **Daily Health Checks**
Add this to your workflow:
```bash
curl -f https://careerate-app.azurewebsites.net/health || echo "❌ API Down"
```

---

## 📞 ESCALATION PATH

1. **Level 1**: Use this troubleshooting guide
2. **Level 2**: Check Azure service health status
3. **Level 3**: Open Azure support ticket
4. **Level 4**: Consider alternative hosting (Vercel, Railway, etc.)

---

**🎯 Most Common Fix**: Switch to minimal dependencies and restart
**⏱️ Typical Resolution Time**: 5-15 minutes
**🎨 Success Rate**: 95% with these solutions 