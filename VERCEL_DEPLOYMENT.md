# Vercel Deployment Guide for Dizit Solutions

## 🚀 Pre-Deployment Checklist

### ✅ **1. Environment Variables Setup**
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Core Configuration (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB=Dizitsolution
JWT_SECRET=your-jwt-secret-key-at-least-32-characters

# Vercel URLs (CRITICAL)
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app/api
NEXTAUTH_URL=https://your-app-name.vercel.app

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
ADMIN_EMAIL=admin@example.com
EMAIL_SERVICE=gmail

# Payment Gateways
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
STRIPE_SECRET_KEY=your-stripe-secret-key

# Admin Authentication
ADMIN_AUTH_SECRET=dizit-admin-secret-2024
ADMIN_SECRET_KEY=dizit-admin-secret-2024

# Contact Information
NEXT_PUBLIC_WHATSAPP_NUMBER=9112564731
NEXT_PUBLIC_CALL_NUMBER=9112564731
NEXT_PUBLIC_PHONE=9112564731

# Optional Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### ✅ **2. Code Changes Made**

#### **Fixed React Version Compatibility**
- Downgraded from React 19 (RC) to React 18.3.1 (stable)
- Updated TypeScript types accordingly

#### **Fixed Tailwind CSS**
- Downgraded from v4 (beta) to v3.4.15 (stable)
- Updated PostCSS configuration
- Removed experimental plugins

#### **Created Production Utilities**
- `app/utils/apiUrl.ts` - Environment-safe URL handling
- `app/utils/productionLogger.ts` - Production-safe logging

#### **Updated Next.js Config**
- Optimized for Vercel deployment
- Proper serverless function configuration

### ✅ **3. Database Setup**

#### **MongoDB Atlas Configuration**
1. Create MongoDB Atlas cluster
2. Whitelist Vercel IP addresses (or use 0.0.0.0/0 for all IPs)
3. Create database user with read/write permissions
4. Get connection string and add to MONGODB_URI

#### **Create Admin Account**
```bash
# After deployment, create admin account
npm run create-admin
```

### ✅ **4. Deployment Steps**

#### **Method 1: GitHub Integration (Recommended)**
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically

#### **Method 2: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### ✅ **5. Post-Deployment Verification**

#### **Test Core Functionality**
- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] Admin login works (admin@gmail.com / Admin@123)
- [ ] Service booking flow
- [ ] Payment processing
- [ ] Email notifications
- [ ] Technician dashboard

#### **Test API Endpoints**
```bash
# Test health check
curl https://your-app.vercel.app/api/health

# Test email configuration
curl https://your-app.vercel.app/api/test/email

# Test database connection
curl https://your-app.vercel.app/api/debug/notifications
```

### ✅ **6. Performance Optimization**

#### **Vercel Function Configuration**
```json
// vercel.json
{
  "functions": {
    "app/api/**/*": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

#### **Image Optimization**
- Images are configured for Vercel's optimization
- WebP and AVIF formats enabled

#### **Caching Strategy**
- Static assets cached automatically
- API responses use appropriate cache headers

### ✅ **7. Monitoring & Debugging**

#### **Vercel Analytics**
- Enable Vercel Analytics in dashboard
- Monitor performance and errors

#### **Error Tracking**
- Check Vercel Function logs
- Monitor database connection issues
- Track API response times

#### **Common Issues & Solutions**

**Issue: 500 Internal Server Error**
- Check environment variables are set
- Verify MongoDB connection string
- Check Vercel function logs

**Issue: API calls failing**
- Verify NEXT_PUBLIC_API_URL is correct
- Check NEXTAUTH_URL matches deployment URL
- Ensure no hardcoded localhost URLs

**Issue: Database connection timeout**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Check network connectivity

**Issue: Email not sending**
- Verify EMAIL_USER and EMAIL_PASS
- Check Gmail app password setup
- Test email configuration endpoint

### ✅ **8. Security Considerations**

#### **Environment Variables**
- Never commit .env files to repository
- Use strong JWT secrets (32+ characters)
- Rotate secrets regularly

#### **Database Security**
- Use strong MongoDB passwords
- Enable MongoDB Atlas security features
- Regular backup strategy

#### **API Security**
- Rate limiting configured
- CORS properly set up
- Authentication middleware active

### ✅ **9. Backup & Recovery**

#### **Database Backup**
- Set up MongoDB Atlas automated backups
- Export critical data regularly
- Test restore procedures

#### **Code Backup**
- Repository backed up on GitHub
- Tag releases for easy rollback
- Document deployment procedures

### ✅ **10. Scaling Considerations**

#### **Vercel Limits**
- Function execution time: 60 seconds
- Memory: 1024MB per function
- Bandwidth: Based on plan

#### **Database Scaling**
- MongoDB Atlas auto-scaling
- Connection pooling configured
- Query optimization

## 🎯 **Final Deployment Command**

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Set environment variables in Vercel dashboard

# 5. Create admin account
npm run create-admin
```

## 📞 **Support**

If deployment issues occur:
1. Check Vercel function logs
2. Verify all environment variables
3. Test API endpoints individually
4. Check MongoDB Atlas connectivity

**Your app should now be successfully deployed on Vercel! 🎉**
