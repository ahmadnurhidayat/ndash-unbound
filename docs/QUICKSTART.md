# NDash - Quick Start Guide

## 🚀 Quick Installation

### 1. Clone/Copy Project

Ensure all files are in `/opt/ndash`

### 2. Install Dependencies

```bash
cd /opt/ndash
npm install
```

### 3. Run the Application

```bash
npm start
```

Or use the script:

```bash
./start.sh
```

### 4. Access Dashboard

Open browser and access:

```
http://localhost:3000
```

## 📋 Usage Guide

### Main Dashboard

- **URL**: `http://localhost:3000/`
- Displays DNS zones and records statistics
- Quick actions for fast access
- Recent activities and latest zones

### Managing DNS Zones

#### View All Zones

1. Click **"DNS Zones"** in the sidebar
2. Or click **"View Zones"** in quick actions

#### Create New Zone

1. Click **"Create New Zone"** or **"Create Zone"** in quick actions
2. Fill in the form:
   - **Zone Name**: Domain name (example: example.com)
   - **Zone Type**: Select master/slave/forward
   - **Zone File Path**: (optional) will be automatic if empty
3. Click **"Create Zone"**

#### View Zone Details

1. On the DNS Zones page, click the eye icon (👁️) on the zone
2. Will display zone details and all its records

#### Delete Zone

1. On the DNS Zones page, click the trash icon (🗑️)
2. Confirm deletion

### Managing DNS Records

#### Add New Record

1. Open zone detail
2. Click **"Add Record"**
3. Fill in the form:
   - **Record Name**: @ for root, or subdomain (www, mail, etc.)
   - **Record Type**: A, AAAA, CNAME, MX, TXT, NS, PTR, SRV
   - **Value**: IP address or hostname
   - **TTL**: Time to live in seconds (default: 3600)
   - **Priority**: For MX and SRV records
4. Click **"Add Record"**

#### Delete Record

1. On the zone detail page
2. Click the trash icon on the record you want to delete
3. Confirm deletion

## 🎨 UI Features

### Sidebar Navigation

- **Dashboard**: Main page
- **DNS Zones**: Manage zones
- **Create Zone**: Create new zone
- **Reload Bind**: Reload Bind service (coming soon)
- **Settings**: Settings (coming soon)
- **Monitoring**: Monitor DNS (coming soon)
- **Activity Log**: Activity log (coming soon)

### Quick Actions

6 quick access buttons on the dashboard:

1. Create Zone
2. View Zones
3. All Records
4. Reload Bind
5. Statistics
6. Settings

### Status Indicators

- 🟢 **Active**: Active zone
- 🟡 **Inactive**: Inactive zone
- Color badges for record types (A, CNAME, MX, etc.)

## 🔧 Supported DNS Record Types

| Type  | Description    | Example Value                  |
| ----- | -------------- | ------------------------------ |
| A     | IPv4 Address   | 192.168.1.1                    |
| AAAA  | IPv6 Address   | 2001:db8::1                    |
| CNAME | Canonical Name | www.example.com                |
| MX    | Mail Exchange  | mail.example.com               |
| TXT   | Text Record    | "v=spf1 mx -all"               |
| NS    | Name Server    | ns1.example.com                |
| PTR   | Pointer        | example.com                    |
| SRV   | Service        | 0 5 5060 sipserver.example.com |

## 📊 Available Pages

1. **Dashboard** (`/`)
   - Overview statistics
   - Quick actions
   - Recent zones
   - Recent activities

2. **DNS Zones List** (`/zones`)
   - Table of all zones
   - Status, type, record count
   - Actions (view, edit, delete)

3. **Zone Detail** (`/zones/:id`)
   - Zone information
   - List of all records
   - Add/delete records

4. **Create Zone** (`/zones/new/create`)
   - New zone creation form

5. **Add Record** (`/records/zone/:zoneId/new`)
   - New record addition form

## ⚙️ Configuration

### Change Port

Edit `server.js` or set environment variable:

```bash
PORT=8080 npm start
```

### Data Storage

Data is currently stored in memory (`data/storage.js`)
For production, integrate with Bind zone files

## 🔒 Security

⚠️ **For Development Only**
This application does not yet include:

- User authentication
- Authorization
- SSL/HTTPS
- Complete input validation

For production, see `DEPLOYMENT.md`

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Use another port
PORT=3001 npm start
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Permission Denied (Bind files)

```bash
# For Bind integration, need access to /etc/bind
sudo chown -R $USER:$USER /etc/bind/zones
```

## 📝 Tips

1. **Backup Data**: No auto-backup yet, manually backup `data/storage.js`
2. **Testing**: Test in development environment first
3. **Monitoring**: Use `pm2 monit` for monitoring
4. **Logs**: Check logs with `pm2 logs ndash`

## 🆘 Help

### Useful Commands

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Check status (if using systemd)
sudo systemctl status ndash

# View logs (if using pm2)
pm2 logs ndash

# Restart (pm2)
pm2 restart ndash
```

### Important Files

- `server.js` - Main server
- `data/storage.js` - Data storage
- `config.js` - Configuration
- `routes/` - API routes
- `views/` - EJS templates
- `public/css/style.css` - Styling

## 📚 Complete Documentation

- `README.md` - Main documentation
- `DEPLOYMENT.md` - Production deployment guide
- `STRUCTURE.md` - Detailed project structure

## 🎯 Next Steps

1. ✅ Install and run the application
2. ✅ Explore dashboard and UI
3. ✅ Create test zones and records
4. 📝 Integrate with Bind (optional)
5. 🚀 Deploy to production (follow DEPLOYMENT.md)

---

**Enjoy using NDash! 🎉**

For questions or issues, open an issue or contact the administrator.
