# NDash - Unbound DNS Management Dashboard

NDash is a web application for managing Unbound DNS with a modern and user-friendly interface. This application is built with Express.js backend and EJS templating, with a design inspired by IDVE.

## Features

- 📊 **Informative Dashboard** - Display DNS zone and record statistics
- 🌐 **DNS Zone Management** - Create, view, edit, and delete DNS local zones
- 📝 **DNS Record Management** - Manage various DNS record types (A, AAAA, CNAME, MX, TXT, etc.)
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and Shadcn-UI inspired
- ⚡ **Quick Actions** - Quick access to common functions
- 📱 **Responsive Design** - Works well on desktop and mobile
- 🔄 **Cache Management** - Flush zone cache and monitoring

## Technologies Used

- **Backend**: Express.js
- **Template Engine**: EJS
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Date Handling**: Moment.js

## Installation

### 1. Install Dependencies

```bash
cd /opt/ndash
npm install
```

### 2. Configuration (Optional)

Edit the `server.js` file to change the port or other configurations:

```javascript
const PORT = process.env.PORT || 3000;
```

### 3. Run the Application

**Production Mode:**

```bash
npm start
```

**Development Mode (with auto-reload):**

```bash
npm run dev
```

The application will run at `http://localhost:3000`

## Directory Structure

```
/opt/ndash/
├── data/
│   └── storage.js          # Data storage (zones, records, activities)
├── public/
│   ├── css/
│   │   └── style.css       # Custom CSS styles
│   └── js/
│       └── main.js         # Client-side JavaScript
├── routes/
│   ├── dashboard.js        # Dashboard routes
│   ├── zones.js            # DNS zones routes
│   └── records.js          # DNS records routes
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── sidebar.ejs
│   │   ├── header-standalone.ejs
│   │   └── footer-standalone.ejs
│   ├── zones/
│   │   ├── list.ejs        # List all zones
│   │   ├── detail.ejs      # Zone details with records
│   │   └── new.ejs         # Create new zone
│   ├── records/
│   │   └── new.ejs         # Create new record
│   └── dashboard.ejs       # Main dashboard
├── server.js               # Main application file
├── package.json
└── README.md
```

## Usage

### Dashboard

- Access the main page to view DNS zones overview and statistics
- Quick actions for fast access to main functions
- View recent activities and newly created zones

### DNS Zone Management

1. Click **"DNS Zones"** in the sidebar or **"View Zones"** in quick actions
2. To create a new zone, click **"Create New Zone"**
3. Fill in the form with domain name and zone type
4. Click on a zone to view details and its records

### DNS Record Management

1. Open the zone detail you want to manage
2. Click **"Add Record"** to add a new record
3. Select record type (A, AAAA, CNAME, MX, TXT, etc.)
4. Fill in the value and record configuration
5. The record will automatically appear in the list

### Supported DNS Record Types

- **A** - IPv4 Address
- **AAAA** - IPv6 Address
- **CNAME** - Canonical Name
- **MX** - Mail Exchange
- **TXT** - Text Record
- **NS** - Name Server
- **PTR** - Pointer
- **SRV** - Service

## Integration with Bind

> **Note**: The current version uses simulated data storage. For full integration with Bind DNS server, you need to:

1. Add a module to read/write Bind zone files
2. Implement functions to reload Bind service
3. Add zone syntax validation
4. Setup permissions to access Bind directory

### Integration Example (Future Enhancement):

```javascript
// Read zone file
const fs = require("fs-extra");
const zoneContent = await fs.readFile("/etc/bind/zones/db.example.com", "utf8");

// Reload Bind
const { exec } = require("child_process");
exec("rndc reload", (error, stdout, stderr) => {
  if (error) {
    console.error("Error reloading Bind:", error);
  }
});
```

## Security

⚠️ **Important for Production:**

1. Implement authentication and authorization
2. Use HTTPS
3. Validate all user input
4. Set proper file permissions for zone files
5. Implement rate limiting
6. Enable CSRF protection
7. Audit log for all changes

## Customization

### Changing Theme Colors

Edit the `/public/css/style.css` file to customize colors:

```css
.btn-primary {
  background: linear-gradient(135deg, #your-color 0%, #your-color-dark 100%);
}
```

### Adding Sidebar Menu

Edit the `/views/partials/sidebar.ejs` file:

```html
<a href="/new-menu" class="nav-item">
  <i class="fas fa-icon-name"></i>
  <span>Menu Name</span>
</a>
```

## Troubleshooting

### Port already in use

Change the port in `server.js` or set environment variable:

```bash
PORT=3001 npm start
```

### Module not found

Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

## Roadmap

- [ ] User authentication and role-based access
- [ ] Direct integration with Bind9 zone files
- [ ] Export/Import zone files
- [ ] DNS query testing tools
- [ ] Backup and restore zones
- [ ] Query statistics monitoring
- [ ] Multi-server management
- [ ] API documentation with Swagger

## Contributing

Contributions are very welcome! Please create a pull request or report issues.

## License

ISC License

## Support

For questions or issues, please create an issue in this repository.

---

**Built with ❤️ using Express.js and EJS**
