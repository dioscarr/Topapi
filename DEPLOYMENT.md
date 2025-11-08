# Cloudways Deployment Guide

This guide provides detailed instructions for deploying the Topapi Node.js application to Cloudways hosting.

## Prerequisites

- Active Cloudways account
- Node.js application server configured on Cloudways
- SSH access to your Cloudways server
- Supabase project with credentials

## Step-by-Step Deployment

### 1. Prepare Your Cloudways Server

#### Create a Node.js Application

1. Log in to your Cloudways dashboard
2. Navigate to **Applications**
3. Click **Add Application**
4. Select **Node.js** as the application type
5. Configure your application name and other settings
6. Launch the application

### 2. Access Your Server via SSH

From your Cloudways dashboard:

1. Go to **Servers**
2. Select your server
3. Navigate to **Master Credentials**
4. Use the provided SSH credentials to connect:

```bash
ssh master@your-server-ip
```

### 3. Navigate to Application Directory

```bash
cd ~/applications/your-application-name/public_html
```

### 4. Deploy Your Application

#### Option A: Deploy from Git (Recommended)

```bash
# Clone your repository
git clone https://github.com/dioscarr/Topapi.git .

# Or if you have an existing deployment, update it
git pull origin main
```

#### Option B: Upload Files Manually

1. Use SFTP client (FileZilla, Cyberduck, etc.)
2. Connect using the credentials from Cloudways dashboard
3. Upload all project files to `~/applications/your-application-name/public_html`

### 5. Install Dependencies

```bash
# Install production dependencies
npm install --production

# If you need all dependencies (including dev)
npm install
```

### 6. Configure Environment Variables

Create a `.env` file with your production configuration:

```bash
nano .env
```

Add the following (replace with your actual values):

```env
NODE_ENV=production
PORT=3000
API_BASE_URL=https://phpstack-868870-5982515.cloudwaysapps.com
CORS_ORIGIN=https://phpstack-868870-5982515.cloudwaysapps.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
APP_URL=https://phpstack-868870-5982515.cloudwaysapps.com
```

Save and exit (Ctrl+X, then Y, then Enter).

### 7. Set Up Process Manager (PM2)

PM2 will keep your application running and restart it automatically if it crashes.

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start your application with PM2
pm2 start api/server.js --name topapi

# Save the PM2 process list
pm2 save

# Set up PM2 to start on system boot
pm2 startup

# Copy and run the command that PM2 outputs
```

### 8. Configure Nginx as Reverse Proxy

Cloudways usually handles this automatically, but if you need to configure it manually:

```bash
# Navigate to Nginx configuration
cd /etc/nginx

# Edit the site configuration
sudo nano sites-available/your-site.conf
```

Add or update the location block:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Restart Nginx:

```bash
sudo service nginx restart
```

### 9. Set Up SSL Certificate

Cloudways provides free SSL certificates through Let's Encrypt:

1. Go to your application in the Cloudways dashboard
2. Navigate to **SSL Certificate**
3. Click **Install Let's Encrypt Certificate**
4. Follow the prompts to install the certificate

### 10. Verify Deployment

Test your deployment:

```bash
# Test the health endpoint
curl https://phpstack-868870-5982515.cloudwaysapps.com/api/health

# Check PM2 status
pm2 status

# View application logs
pm2 logs topapi
```

Visit your application:
- Homepage: https://phpstack-868870-5982515.cloudwaysapps.com
- API Docs: https://phpstack-868870-5982515.cloudwaysapps.com/api-docs
- Health Check: https://phpstack-868870-5982515.cloudwaysapps.com/api/health

## Monitoring and Maintenance

### View Application Logs

```bash
# View all logs
pm2 logs topapi

# View only error logs
pm2 logs topapi --err

# Clear logs
pm2 flush
```

### Monitor Application Performance

```bash
# Real-time monitoring dashboard
pm2 monit

# Application status
pm2 status

# Detailed information
pm2 show topapi
```

### Restart Application

```bash
# Restart the application
pm2 restart topapi

# Reload with zero-downtime
pm2 reload topapi

# Stop the application
pm2 stop topapi

# Start the application
pm2 start topapi
```

### Update Application

When you push updates to your repository:

```bash
# Navigate to application directory
cd ~/applications/your-application-name/public_html

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart the application
pm2 restart topapi
```

## Troubleshooting

### Application Not Starting

1. Check PM2 logs:
   ```bash
   pm2 logs topapi --lines 100
   ```

2. Verify environment variables:
   ```bash
   cat .env
   ```

3. Check Node.js version:
   ```bash
   node --version
   # Should be >= 16.0.0
   ```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Restart your application
pm2 restart topapi
```

### Database Connection Issues

1. Verify Supabase credentials in `.env`
2. Test database connection:
   ```bash
   curl https://your-domain.com/api/health/db
   ```
3. Check Supabase dashboard for any service issues

### Permission Issues

```bash
# Fix ownership
sudo chown -R master:master ~/applications/your-application-name

# Fix permissions
chmod -R 755 ~/applications/your-application-name
```

## Performance Optimization

### Enable Gzip Compression

Add to your Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### Configure PM2 Clustering

For better performance with multiple CPU cores:

```bash
# Stop current instance
pm2 delete topapi

# Start with cluster mode (uses all CPU cores)
pm2 start api/server.js --name topapi -i max

# Save configuration
pm2 save
```

### Set Up Log Rotation

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Backup and Recovery

### Backup Application

```bash
# Create backup directory
mkdir -p ~/backups

# Backup application files
tar -czf ~/backups/topapi-backup-$(date +%Y%m%d).tar.gz \
  ~/applications/your-application-name/public_html

# Backup environment variables
cp .env ~/backups/.env.backup
```

### Restore from Backup

```bash
# Stop the application
pm2 stop topapi

# Extract backup
cd ~/applications/your-application-name/public_html
tar -xzf ~/backups/topapi-backup-YYYYMMDD.tar.gz

# Restore environment
cp ~/backups/.env.backup .env

# Restart application
pm2 restart topapi
```

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Environment variables properly set in `.env` (not committed to git)
- [ ] Firewall configured (Cloudways handles this by default)
- [ ] Rate limiting enabled in application
- [ ] PM2 monitoring enabled
- [ ] Regular backups scheduled
- [ ] Dependencies regularly updated
- [ ] Logs monitored for suspicious activity

## Additional Resources

- [Cloudways Documentation](https://support.cloudways.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

For deployment issues:
- Check Cloudways support documentation
- Contact Cloudways support team
- Review application logs with `pm2 logs`
- Check GitHub repository issues
