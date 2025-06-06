# 🚀 CAREERATE DEPLOYMENT GUIDE

## Quick Start (5 minutes)

### 1. **Start Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys (optional - works without them)
npm run dev
```

### 2. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

### 3. **Test the Platform**
- Open http://localhost:3000
- Click "Get Started" 
- Try the AI chat with messages like:
  - "Help me create a Terraform configuration"
  - "How do I troubleshoot Kubernetes pods?"
  - "Set up AWS monitoring with CloudWatch"

---

## 🔧 COMPLETE SETUP

### **Prerequisites**
```bash
# Required
Node.js 18+ 
npm or yarn

# Optional but recommended
MongoDB (local or cloud)
OpenAI API Key (for real AI responses)
Anthropic API Key (alternative to OpenAI)
```

### **Backend Configuration**

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# AI APIs (optional - app works with mock responses)
OPENAI_API_KEY=sk-your-openai-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Database (optional - uses in-memory if not provided)
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/careerate

# Security
SESSION_SECRET=your-random-session-secret
JWT_SECRET=your-random-jwt-secret

# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

3. **Start Development Server**
```bash
npm run dev
```

### **Frontend Configuration**

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Environment Setup**
```bash
# Create .env.local
echo "REACT_APP_BACKEND_URL=http://localhost:5000" > .env.local
```

3. **Start Development Server**
```bash
npm run dev
```

---

## 🌐 PRODUCTION DEPLOYMENT

### **Azure Deployment (Recommended)**

#### **Backend to Azure App Service**

1. **Create Azure Resources**
```bash
# Create resource group
az group create --name careerate-rg --location eastus

# Create App Service plan
az appservice plan create --name careerate-plan --resource-group careerate-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group careerate-rg --plan careerate-plan --name careerate-backend --runtime "NODE|18-lts"
```

2. **Configure Environment Variables**
```bash
az webapp config appsettings set --resource-group careerate-rg --name careerate-backend --settings \
    OPENAI_API_KEY="your-openai-key" \
    MONGODB_CONNECTION_STRING="your-mongo-connection" \
    SESSION_SECRET="your-session-secret" \
    JWT_SECRET="your-jwt-secret" \
    NODE_ENV="production" \
    CORS_ORIGIN="https://your-frontend-domain.com"
```

3. **Deploy Backend**
```bash
cd backend
npm run build
az webapp deployment source config-zip --resource-group careerate-rg --name careerate-backend --src backend.zip
```

#### **Frontend to Azure Static Web Apps**

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Deploy to Azure Static Web Apps**
```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./dist --app-name careerate-frontend
```

### **Alternative: Docker Deployment**

1. **Create Dockerfile for Backend**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

2. **Create Dockerfile for Frontend**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

3. **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_CONNECTION_STRING=mongodb://mongo:27017/careerate
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:5000

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## 🔌 EXTENSIONS SETUP

### **Chrome Extension**

1. **Build Extension**
```bash
cd chrome_extension
npm install
npm run build
```

2. **Load in Chrome**
- Open Chrome → Extensions → Developer mode → Load unpacked
- Select the `chrome_extension/dist` folder
- Extension will appear in toolbar

3. **Configure Extension**
- Click extension icon
- Set backend URL: `http://localhost:5000` (or your production URL)
- Grant necessary permissions

### **VSCode Extension**

1. **Build Extension**
```bash
cd vscode-extension
npm install
npm run build
```

2. **Install Locally**
```bash
# Package extension
npx vsce package

# Install .vsix file
code --install-extension careerate-*.vsix
```

3. **Publish to Marketplace**
```bash
# Setup
npm install -g vsce
vsce login your-publisher-name

# Publish
vsce publish
```

---

## 📊 MONITORING & ANALYTICS

### **Application Insights (Azure)**
```bash
# Add to backend
npm install applicationinsights

# Configure in server.ts
import appInsights from 'applicationinsights';
appInsights.setup('your-instrumentation-key').start();
```

### **Custom Analytics**
The platform includes built-in analytics:
- User activity tracking
- AI agent usage metrics
- Performance monitoring
- Error tracking

Access at: `http://localhost:3000/dashboard`

---

## 🔒 SECURITY CHECKLIST

### **Production Security**
- [ ] Set strong JWT_SECRET and SESSION_SECRET
- [ ] Configure CORS_ORIGIN to your domain only
- [ ] Use HTTPS in production
- [ ] Set up rate limiting (already configured)
- [ ] Configure MongoDB authentication
- [ ] Use Azure Key Vault for secrets
- [ ] Enable Application Insights monitoring

### **API Keys Security**
- [ ] Store API keys in environment variables
- [ ] Use Azure Key Vault in production
- [ ] Rotate API keys regularly
- [ ] Monitor API usage and billing

---

## 🚀 TEAM COLLABORATION SETUP

### **Microsoft Teams Integration**
1. Create Teams app in App Studio
2. Configure webhook URL: `https://your-backend/api/teams/webhook`
3. Add environment variables:
```env
TEAMS_APP_ID=your-teams-app-id
TEAMS_APP_PASSWORD=your-teams-app-password
```

### **Slack Integration**
1. Create Slack app at api.slack.com
2. Configure slash commands: `/careerate`, `/troubleshoot`
3. Add environment variables:
```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

---

## 🎯 WHAT YOU GET

### **✅ Working Features**
- **AI Chat Interface** with streaming responses
- **Multi-Agent System** (Terraform, Kubernetes, AWS, etc.)
- **Real-time Collaboration** via WebSocket
- **Chrome Extension** for context collection
- **VSCode Extension** for AI assistance
- **Analytics Dashboard** with usage metrics
- **REST API** for all functionality
- **Modern React Frontend** with Tailwind CSS

### **🎯 AI Capabilities**
- Context-aware responses based on current tool/repository
- Specialized agents for different DevOps domains
- Code generation and troubleshooting
- Infrastructure guidance and best practices
- Real-time streaming responses

### **📱 Multi-Platform**
- **Web App**: Full-featured dashboard and chat
- **Chrome Extension**: Context collection from GitHub, AWS Console, etc.
- **VSCode Extension**: Integrated AI assistance while coding
- **API**: Integrate with Slack, Teams, or custom tools

---

## 🆘 TROUBLESHOOTING

### **Common Issues**

**Backend won't start:**
```bash
# Check dependencies
npm install

# Check environment
cp .env.example .env

# Check MongoDB connection
# If no MongoDB, app will start with warnings but work
```

**Frontend build errors:**
```bash
# Clear cache
npm run build -- --force

# Check dependencies
npm install
```

**AI responses not working:**
- Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env
- App works with mock responses if no API keys provided

**WebSocket connection issues:**
- Check CORS_ORIGIN in backend .env
- Ensure frontend is pointing to correct backend URL

### **Getting Help**
- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Test with curl to isolate frontend vs backend issues

---

## 🎉 SUCCESS!

If everything is set up correctly, you should have:

1. **Backend running** at http://localhost:5000/health ✅
2. **Frontend running** at http://localhost:3000 ✅
3. **AI chat working** (even with mock responses) ✅
4. **Real-time updates** via WebSocket ✅
5. **Extensions loadable** in Chrome/VSCode ✅

**You now have a complete AI pair programming platform for DevOps teams!** 🚀