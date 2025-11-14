# ✅ Unbound Resolver - Quick Reference

## Status
**Unbound sekarang berfungsi sebagai DNS Resolver!**

---

## 🎯 Kemampuan

1. **Resolve domain internet** (google.com, facebook.com, dll)
2. **Resolve local zones** yang dikelola NDash (dionipe.id, dll)
3. **DNS Caching** untuk performa lebih cepat
4. **Forward ke DNS public** (Cloudflare 1.1.1.1 & Google 8.8.8.8)

---

## ✅ Pengujian

### Test Internet Domain
```bash
dig @127.0.0.1 google.com +short
# atau
nslookup google.com 127.0.0.1
```

### Test Local Zone
```bash
dig @127.0.0.1 dionipe.id +short
# Output: 127.0.0.1
```

### Test dari Client Lain
Dari komputer lain di jaringan:
```bash
dig @IP_SERVER_ANDA dionipe.id +short
```

---

## 🔧 Command Berguna

### Cek Status
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

### Lihat Statistik
```bash
sudo unbound-control stats
```

---

## 🌐 Menggunakan sebagai DNS Server

### Di Client Linux
```bash
# Temporary
sudo systemd-resolve --set-dns=IP_SERVER_UNBOUND --interface=eth0

# Permanent - Edit /etc/systemd/resolved.conf
[Resolve]
DNS=IP_SERVER_UNBOUND
```

### Di Client Windows
```
Control Panel > Network and Internet > Network Connections
Right-click adapter > Properties > IPv4 > Properties
Use the following DNS server addresses:
Preferred DNS server: IP_SERVER_UNBOUND
```

### Di Router
Set DNS server di DHCP settings ke IP server Unbound ini.
Semua device di jaringan akan otomatis menggunakan DNS ini.

---

## 📊 Monitoring via NDash

Akses dashboard: `http://localhost:3000/monitoring`

Akan menampilkan:
- ✅ Unbound status (running/stopped)
- 📊 Query statistics
- 💾 Cache hit rate
- 🌍 Loaded zones

---

## ⚙️ Konfigurasi

File: `/etc/unbound/unbound.conf.d/ndash-resolver.conf`

### Menambah Network yang Diizinkan

Edit file config dan tambahkan:
```conf
server:
    access-control: 203.0.113.0/24 allow
```

Reload:
```bash
sudo unbound-control reload
```

### Mengubah Upstream DNS

Edit forward-zone di config:
```conf
forward-zone:
    name: "."
    forward-addr: 1.1.1.1@53    # Cloudflare
    forward-addr: 8.8.8.8@53    # Google
    # Atau gunakan DNS ISP Anda
```

---

## 🐛 Troubleshooting

### Tidak bisa resolve domain internet
```bash
# Cek upstream DNS
dig @1.1.1.1 google.com

# Cek logs
sudo journalctl -u unbound -n 50

# Restart service
sudo systemctl restart unbound
```

### Local zone tidak work
```bash
# Cek zone loaded
sudo unbound-control list_local_zones | grep dionipe

# Reload zones
sudo unbound-control reload

# Cek file zone
cat /etc/unbound/local.d/dionipe.id.conf
```

### Query timeout
```bash
# Cek Unbound running
sudo systemctl status unbound

# Cek port 53 listening
sudo ss -tlnp | grep :53

# Cek firewall
sudo iptables -L -n | grep 53
```

---

## 📖 Dokumentasi Lengkap

Lihat file: **`UNBOUND_RESOLVER_GUIDE.md`**

---

**Status:** ✅ **WORKING**
**Tested:** November 14, 2025
**Config:** `/etc/unbound/unbound.conf.d/ndash-resolver.conf`
