# ✅ Unbound Resolver - Quick Reference

## Status

**Unbound is now functioning as a DNS Resolver!**

---

## 🎯 Capabilities

1. **Resolve internet domains** (google.com, facebook.com, etc.)
2. **Resolve local zones** managed by NDash (dionipe.id, etc.)
3. **DNS Caching** for faster performance
4. **Forward to public DNS** (Cloudflare 1.1.1.1 & Google 8.8.8.8)

---

## ✅ Testing

### Test Internet Domain

```bash
dig @127.0.0.1 google.com +short
# or
nslookup google.com 127.0.0.1
```

### Test Local Zone

```bash
dig @127.0.0.1 dionipe.id +short
# Output: 127.0.0.1
```

### Test from Another Client

From another computer on the network:

```bash
dig @YOUR_SERVER_IP dionipe.id +short
```

---

## 🔧 Useful Commands

### Check Status

```bash
sudo systemctl status unbound
sudo unbound-control status
```

### Reload Configuration

```bash
sudo unbound-control reload
```

### Clear Cache

```bash
sudo unbound-control flush_zone .
```

### View Statistics

```bash
sudo unbound-control stats
```

---

## 🌐 Using as DNS Server

### On Linux Client

```bash
# Temporary
sudo systemd-resolve --set-dns=UNBOUND_SERVER_IP --interface=eth0

# Permanent - Edit /etc/systemd/resolved.conf
[Resolve]
DNS=UNBOUND_SERVER_IP
```

### On Windows Client

```
Control Panel > Network and Internet > Network Connections
Right-click adapter > Properties > IPv4 > Properties
Use the following DNS server addresses:
Preferred DNS server: UNBOUND_SERVER_IP
```

### On Router

Set DNS server in DHCP settings to this Unbound server IP.
All devices on the network will automatically use this DNS.

---

## 📊 Monitoring via NDash

Access dashboard: `http://localhost:3000/monitoring`

Will display:

- ✅ Unbound status (running/stopped)
- 📊 Query statistics
- 💾 Cache hit rate
- 🌍 Loaded zones

---

## ⚙️ Configuration

File: `/etc/unbound/unbound.conf.d/ndash-resolver.conf`

### Add Allowed Networks

Edit config file and add:

```conf
server:
    access-control: 203.0.113.0/24 allow
```

Reload:

```bash
sudo unbound-control reload
```

### Change Upstream DNS

Edit forward-zone in config:

```conf
forward-zone:
    name: "."
    forward-addr: 1.1.1.1@53    # Cloudflare
    forward-addr: 8.8.8.8@53    # Google
    # Or use your ISP DNS
```

---

## 🐛 Troubleshooting

### Cannot resolve internet domains

```bash
# Check upstream DNS
dig @1.1.1.1 google.com

# Check logs
sudo journalctl -u unbound -n 50

# Restart service
sudo systemctl restart unbound
```

### Local zone not working

```bash
# Check zone loaded
sudo unbound-control list_local_zones | grep dionipe

# Reload zones
sudo unbound-control reload

# Check zone file
cat /etc/unbound/local.d/dionipe.id.conf
```

### Query timeout

```bash
# Check Unbound running
sudo systemctl status unbound

# Check port 53 listening
sudo ss -tlnp | grep :53

# Check firewall
sudo iptables -L -n | grep 53
```

---

## 📖 Complete Documentation

See file: **`UNBOUND_RESOLVER_GUIDE.md`**

---

**Status:** ✅ **WORKING**
**Tested:** November 14, 2025
**Config:** `/etc/unbound/unbound.conf.d/ndash-resolver.conf`
