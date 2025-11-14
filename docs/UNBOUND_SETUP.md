# NDash Unbound - Setup Guide

## Prerequisites

1. **Ubuntu/Debian Server** dengan Unbound DNS server terinstall
2. **Node.js** (v14 atau lebih baru)
3. **NPM** package manager
4. **Root atau sudo access** untuk mengelola Unbound

## Installation Steps

### 1. Install Unbound DNS Server

```bash
# Install Unbound
sudo apt update
sudo apt install unbound unbound-utils -y

# Check Unbound status
sudo systemctl status unbound

# Enable Unbound on boot
sudo systemctl enable unbound
```

### 2. Configure Unbound Directories

```bash
# Create local zones directory
sudo mkdir -p /etc/unbound/local.d

# Set proper permissions
sudo chown -R unbound:unbound /etc/unbound/local.d
```

### 3. Update Unbound Main Configuration

Edit `/etc/unbound/unbound.conf` dan tambahkan include directive:

```bash
sudo nano /etc/unbound/unbound.conf
```

Tambahkan di akhir file:

```yaml
# NDash local zones
include: "/etc/unbound/local.d/*.conf"
```

### 4. Setup NDash Application

```bash
# Clone atau copy NDash ke /opt/ndash
cd /opt/ndash

# Install dependencies
npm install

# Test run aplikasi
npm start
```

### 5. Configure Sudo Permissions for NDash

NDash memerlukan akses untuk menjalankan perintah Unbound. Buat file sudoers:

```bash
sudo visudo -f /etc/sudoers.d/ndash
```

Tambahkan baris berikut (sesuaikan dengan user yang menjalankan NDash):

```
# NDash Unbound Management Permissions
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control reload
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control status
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control flush_zone *
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control stats_noreset
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-checkconf
www-data ALL=(ALL) NOPASSWD: /bin/systemctl status unbound
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart unbound
```

**Note:** Ganti `www-data` dengan user yang menjalankan aplikasi (misal: `root`, `ndash`, dll)

### 6. Setup Systemd Service (Optional)

```bash
# Copy service file
sudo cp /opt/ndash/ndash.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable ndash

# Start service
sudo systemctl start ndash

# Check status
sudo systemctl status ndash
```

### 7. Configure Firewall (if needed)

```bash
# Allow NDash web interface (port 3000)
sudo ufw allow 3000/tcp

# Allow DNS queries (port 53)
sudo ufw allow 53/tcp
sudo ufw allow 53/udp
```

## Configuration

### Environment Variables

Buat file `.env` di `/opt/ndash`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Unbound Configuration
UNBOUND_CONF_PATH=/etc/unbound/unbound.conf
UNBOUND_ZONES_PATH=/etc/unbound/local.d
```

### Unbound Control Setup

Pastikan `unbound-control` sudah dikonfigurasi dengan benar:

```bash
# Generate certificates untuk unbound-control
sudo unbound-control-setup

# Test unbound-control
sudo unbound-control status
```

## Usage

### Starting the Application

**Development mode:**
```bash
cd /opt/ndash
npm run dev
```

**Production mode:**
```bash
cd /opt/ndash
npm start
```

**Using systemd:**
```bash
sudo systemctl start ndash
```

### Accessing the Dashboard

Buka browser dan akses:
```
http://your-server-ip:3000
```

### Helper Script

NDash dilengkapi dengan helper script untuk command line management:

```bash
# Make executable
chmod +x /opt/ndash/unbound-helper.sh

# Available commands
./unbound-helper.sh status      # Check Unbound status
./unbound-helper.sh reload      # Reload Unbound
./unbound-helper.sh check       # Validate configuration
./unbound-helper.sh list        # List all zones
./unbound-helper.sh view <zone> # View zone config
./unbound-helper.sh flush <zone> # Flush zone cache
./unbound-helper.sh stats       # Show statistics
```

## Creating Your First Zone

1. **Via Web Interface:**
   - Login ke dashboard
   - Navigate ke "Zones" menu
   - Click "Add New Zone"
   - Fill in zone details:
     - Zone Name: `example.local`
     - Type: `static`
   - Click "Create Zone"

2. **Manually:**
   ```bash
   # Create zone file
   sudo nano /etc/unbound/local.d/example.local.conf
   ```
   
   Add content:
   ```yaml
   server:
       # Zone: example.local
       local-zone: "example.local" static
   
       local-data: "example.local. 3600 IN A 192.168.1.10"
       local-data: "ns1.example.local. 3600 IN A 192.168.1.10"
       local-data: "www.example.local. 3600 IN A 192.168.1.20"
   ```
   
   Reload Unbound:
   ```bash
   sudo unbound-control reload
   ```

## Troubleshooting

### 1. Unbound Not Starting

```bash
# Check configuration
sudo unbound-checkconf

# Check logs
sudo journalctl -u unbound -f

# Restart service
sudo systemctl restart unbound
```

### 2. NDash Cannot Connect to Unbound

```bash
# Verify unbound-control is working
sudo unbound-control status

# Check permissions
ls -la /etc/unbound/local.d

# Verify sudoers configuration
sudo visudo -f /etc/sudoers.d/ndash
```

### 3. Changes Not Taking Effect

```bash
# Reload Unbound configuration
sudo unbound-control reload

# Flush all cache
sudo unbound-control flush_zone .

# Restart Unbound if needed
sudo systemctl restart unbound
```

### 4. Permission Denied Errors

```bash
# Set proper ownership
sudo chown -R unbound:unbound /etc/unbound/local.d

# Set proper permissions
sudo chmod 755 /etc/unbound/local.d
sudo chmod 644 /etc/unbound/local.d/*.conf
```

## Unbound vs BIND Differences

| Feature | BIND9 | Unbound |
|---------|-------|---------|
| Configuration | Multiple zone files | Single config with includes |
| Record Format | Zone file syntax | `local-data` directives |
| Reload Command | `rndc reload` | `unbound-control reload` |
| Zone Types | master/slave/forward | static/transparent/redirect |
| Primary Use | Authoritative DNS | Recursive/Caching Resolver |

## Security Notes

1. **Restrict Web Access:** Use firewall atau reverse proxy untuk membatasi akses ke dashboard
2. **Sudo Permissions:** Hanya berikan permission minimum yang diperlukan
3. **File Permissions:** Pastikan zone files tidak writable oleh unauthorized users
4. **Regular Backups:** Backup zone configurations secara berkala

## Additional Resources

- [Unbound Documentation](https://unbound.docs.nlnetlabs.nl/)
- [Unbound Configuration Examples](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html)
- [NDash GitHub Repository](#)

## Support

Jika mengalami masalah, cek:
1. System logs: `sudo journalctl -u ndash -f`
2. Unbound logs: `sudo journalctl -u unbound -f`
3. Configuration: `sudo unbound-checkconf`
4. Status: `sudo systemctl status unbound ndash`
