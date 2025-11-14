# NDash Unbound - Quick Reference

## 🚀 Quick Start

```bash
# Start NDash
npm start

# Development mode
npm run dev

# Access dashboard
http://localhost:3000
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `config.js` | Main configuration |
| `server.js` | Express server |
| `services/unboundService.js` | Unbound service layer |
| `utils/unbound.js` | Unbound utilities |
| `utils/unboundConfig.js` | Config management |
| `unbound-helper.sh` | CLI management tool |

## 🔧 Unbound Commands

### Via Helper Script
```bash
./unbound-helper.sh status      # Check status
./unbound-helper.sh reload      # Reload config
./unbound-helper.sh check       # Validate config
./unbound-helper.sh list        # List zones
./unbound-helper.sh view <zone> # View zone
./unbound-helper.sh flush <zone> # Flush cache
./unbound-helper.sh stats       # Show stats
```

### Direct Commands
```bash
sudo unbound-control status
sudo unbound-control reload
sudo unbound-control flush_zone example.com
sudo unbound-control stats_noreset
sudo unbound-checkconf
```

## 📝 Zone Management

### Create Zone (Web UI)
1. Navigate to **Zones** → **Add New Zone**
2. Enter zone name (e.g., `example.local`)
3. Select zone type: `static`
4. Click **Create Zone**

### Create Zone (Manual)
```bash
# Create zone config
sudo nano /etc/unbound/local.d/example.local.conf
```

```yaml
server:
    local-zone: "example.local" static
    local-data: "example.local. 3600 IN A 192.168.1.10"
    local-data: "ns1.example.local. 3600 IN A 192.168.1.10"
```

```bash
# Reload Unbound
sudo unbound-control reload
```

## 🎯 Record Types

| Type | Example |
|------|---------|
| A | `local-data: "host.example.com. 3600 IN A 192.168.1.10"` |
| AAAA | `local-data: "host.example.com. 3600 IN AAAA 2001:db8::1"` |
| CNAME | `local-data: "www.example.com. 3600 IN CNAME example.com."` |
| MX | `local-data: "example.com. 3600 IN MX 10 mail.example.com."` |
| TXT | `local-data: "example.com. 3600 IN TXT \"v=spf1 ~all\""` |
| NS | `local-data: "example.com. 3600 IN NS ns1.example.com."` |
| PTR | `local-data: "1.1.168.192.in-addr.arpa. IN PTR host.example.com."` |

## 🛠️ Troubleshooting

### Check Configuration
```bash
sudo unbound-checkconf
```

### View Logs
```bash
sudo journalctl -u unbound -f
sudo journalctl -u ndash -f
```

### Restart Services
```bash
sudo systemctl restart unbound
sudo systemctl restart ndash
```

### Test DNS Resolution
```bash
dig @localhost example.local
nslookup example.local localhost
```

## 📊 Monitoring

### Unbound Status
```bash
sudo unbound-control status
```

### Statistics
```bash
sudo unbound-control stats_noreset
```

### Cache Info
```bash
sudo unbound-control dump_cache
```

## 🔐 Permissions

### Sudoers (`/etc/sudoers.d/ndash`)
```
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control reload
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control status
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-control flush_zone *
www-data ALL=(ALL) NOPASSWD: /usr/sbin/unbound-checkconf
```

### Directory Permissions
```bash
sudo chown -R unbound:unbound /etc/unbound/local.d
sudo chmod 755 /etc/unbound/local.d
sudo chmod 644 /etc/unbound/local.d/*.conf
```

## 🔄 Configuration Paths

| Item | Path |
|------|------|
| Main Config | `/etc/unbound/unbound.conf` |
| Local Zones | `/etc/unbound/local.d/` |
| Backups | `/etc/unbound/local.d/backups/` |
| NDash App | `/opt/ndash/` |
| Logs | `journalctl -u unbound` |

## 🌐 API Endpoints (Internal)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/zones` | GET | List zones |
| `/zones/new` | GET/POST | Create zone |
| `/zones/:name` | GET | Zone details |
| `/records/:zone` | GET | List records |
| `/records/:zone/new` | POST | Add record |
| `/settings` | GET/POST | Settings |
| `/monitoring` | GET | Monitoring |

## 💡 Tips

1. **Always validate** config before reload: `unbound-checkconf`
2. **Backup zones** before major changes
3. **Use helper script** for common tasks
4. **Monitor logs** when debugging
5. **Flush cache** after DNS changes
6. **Enable auto-reload** in settings for convenience

## 📚 Resources

- Full Setup Guide: `docs/UNBOUND_SETUP.md`
- Migration Details: `docs/MIGRATION_SUMMARY.md`
- Unbound Docs: https://unbound.docs.nlnetlabs.nl/

## 🆘 Common Issues

### Issue: Changes not taking effect
```bash
# Flush cache and reload
sudo unbound-control flush_zone .
sudo unbound-control reload
```

### Issue: Permission denied
```bash
# Check sudoers
sudo visudo -f /etc/sudoers.d/ndash
# Fix permissions
sudo chown -R unbound:unbound /etc/unbound/local.d
```

### Issue: Unbound not starting
```bash
# Check config
sudo unbound-checkconf
# View errors
sudo journalctl -u unbound -n 50
```

---

**Quick Help:** `./unbound-helper.sh help`
