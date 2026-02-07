# DNS Resolver Settings - User Guide

## 📍 Location

Access via: **Dashboard → Settings → DNS Resolver Settings**

URL: `http://localhost:3000/settings#resolver`

---

## 🎯 Features

### 1. Enable/Disable Resolver

Toggle Unbound as DNS resolver for internet domains.

**Options:**

- ✅ **Enabled** - Unbound will resolve all DNS queries (local + internet)
- ❌ **Disabled** - Unbound only manages local zones from NDash

---

### 2. Forwarding Configuration

#### Enable Forwarding

Forward queries to upstream DNS servers (recommended).

#### Upstream DNS Servers

Select and activate DNS servers to be used:

| Server               | IP Address | Description            |
| -------------------- | ---------- | ---------------------- |
| Cloudflare Primary   | 1.1.1.1    | Fast & privacy-focused |
| Cloudflare Secondary | 1.0.0.1    | Backup                 |
| Google Primary       | 8.8.8.8    | Reliable & fast        |
| Google Secondary     | 8.8.4.4    | Backup                 |

**Note:** Multiple servers will be used automatically if one fails.

---

### 3. Cache Settings

#### Cache Size

Control how much memory is used for DNS cache.

**Message Cache:**

- Default: 16 MB
- Range: 4-256 MB
- Stores DNS responses

**RRset Cache:**

- Default: 32 MB
- Range: 4-512 MB
- Stores individual DNS records

**Recommendations:**

- **Small server** (1GB RAM): 8 MB / 16 MB
- **Medium server** (2-4GB RAM): 16 MB / 32 MB (default)
- **Large server** (8GB+ RAM): 64 MB / 128 MB

#### Cache TTL (Time To Live)

**Minimum TTL:**

- Default: 300 seconds (5 minutes)
- Range: 0-3600 seconds
- Minimum time cache is stored

**Maximum TTL:**

- Default: 86400 seconds (24 hours)
- Range: 3600-604800 seconds
- Maximum time cache is stored

---

### 4. Performance Settings

#### Number of Threads

- Default: 2
- Range: 1-8
- More threads = better performance on high traffic
- Recommendation: 1 thread per CPU core

#### Prefetch Popular Entries

- ✅ **Enabled** (recommended)
- Automatically refresh popular entries before expiry
- Reduces latency for frequently accessed domains

#### Prefetch DNSSEC Keys

- ✅ **Enabled** (recommended)
- Pre-load DNSSEC signing keys
- Improves security validation speed

---

### 5. Security & Privacy

#### Hide Server Identity

- ✅ **Enabled** (recommended)
- Server will not respond with hostname
- Increases privacy

#### Hide Server Version

- ✅ **Enabled** (recommended)
- Unbound version number will not be exposed
- Reduces attack surface

#### Enable DNSSEC

- ✅ **Enabled** (recommended)
- Validates DNS responses with digital signatures
- Protects against DNS spoofing/poisoning
- Requires `/var/lib/unbound/root.key`

---

### 6. Access Control

Control networks that are allowed to use this resolver.

**Default Allowed:**

- ✅ `127.0.0.0/8` - Localhost
- ✅ `10.0.0.0/8` - Private network 10.x.x.x
- ✅ `172.16.0.0/12` - Private network 172.16-31.x.x
- ✅ `192.168.0.0/16` - Private network 192.168.x.x

**To Allow Additional Networks:**

1. Edit `/etc/unbound/unbound.conf.d/ndash-resolver.conf`
2. Add: `access-control: YOUR_NETWORK/CIDR allow`
3. Click "Apply Resolver Settings"

---

### 7. Logging

#### Verbosity Level

- 0: No logging
- 1: Operational messages (default)
- 2: Detailed operational info
- 3: Query level information
- 4: Algorithm level information
- 5: Full debug (very verbose)

#### Log Queries

- ❌ **Disabled** (recommended for privacy)
- Logs every DNS query received
- Useful for debugging or monitoring

#### Log Replies

- ❌ **Disabled** (recommended for privacy)
- Logs every DNS reply sent
- Useful for debugging

---

## 🧪 Testing

### Test DNS Resolution Button

1. Click "Test DNS Resolution"
2. Enter domain name (e.g., `google.com`)
3. System will test resolution via Unbound
4. Result displays IP address if successful

### Manual Test via Terminal

```bash
# Test internet domain
dig @127.0.0.1 google.com A +short

# Test local zone
dig @127.0.0.1 dionipe.id A +short

# Test with timing
time dig @127.0.0.1 example.com +short
```

---

## 📊 Resolver Status Panel

Displays real-time resolver status:

**Status Indicators:**

- 🟢 **Active** - Resolver running and configured
- 🟡 **Configured** - Settings applied but service not running
- ⚫ **Disabled** - Resolver not enabled

**Statistics:**

- **Total Queries** - Number of DNS queries received
- **Cache Hits** - Queries answered from cache (fast)
- **Cache Miss** - Queries needed upstream lookup (slower)
- **Hit Rate** - Cache efficiency percentage

**Good Hit Rate:**

- > 70% - Excellent
- 50-70% - Good
- 30-50% - Average
- <30% - Consider increasing cache size

---

## 🔧 Apply Settings

### Apply Resolver Settings Button

1. Configure all settings as needed
2. Click "Apply Resolver Settings"
3. System will:
   - Generate new config file
   - Validate configuration
   - Reload Unbound service
   - Apply changes instantly

**Config File Location:**
`/etc/unbound/unbound.conf.d/ndash-resolver.conf`

---

## ⚠️ Troubleshooting

### Resolver Not Working

**Check 1: Service Status**

```bash
sudo systemctl status unbound
```

**Check 2: Configuration Valid**

```bash
sudo unbound-checkconf
```

**Check 3: Port 53 Listening**

```bash
sudo ss -tlnp | grep :53
```

**Check 4: Test Resolution**

```bash
dig @127.0.0.1 google.com
```

### Cache Not Working

**Clear Cache:**

```bash
sudo unbound-control flush_zone .
```

**Verify Cache Stats:**

```bash
sudo unbound-control stats | grep cache
```

### Access Denied from Clients

**Check Access Control:**

1. Go to Settings → DNS Resolver Settings
2. Check "Allowed Networks"
3. Ensure client network is in allowed list
4. Apply settings

### Slow Resolution

**Increase Cache:**

- Message Cache: 32 MB
- RRset Cache: 64 MB
- Enable Prefetch

**Add More Threads:**

- Set to number of CPU cores

**Check Network:**

```bash
ping 1.1.1.1
dig @1.1.1.1 google.com
```

---

## 📝 Best Practices

### For Home/Small Office

```
Enable Resolver: ✅
Forwarding: ✅ (Cloudflare + Google)
Cache: 16 MB / 32 MB
Threads: 2
Prefetch: ✅
DNSSEC: ✅
Logging: Verbosity 1, No query logs
```

### For Medium Business

```
Enable Resolver: ✅
Forwarding: ✅ (Multiple upstream)
Cache: 32 MB / 64 MB
Threads: 4
Prefetch: ✅
DNSSEC: ✅
Logging: Verbosity 1, Optional query logs
```

### For High Traffic

```
Enable Resolver: ✅
Forwarding: ✅ (All upstream enabled)
Cache: 64 MB / 128 MB
Threads: 6-8
Prefetch: ✅
DNSSEC: ✅
Logging: Verbosity 0 (performance)
```

---

## 🔐 Security Recommendations

1. ✅ Always enable DNSSEC
2. ✅ Hide identity and version
3. ✅ Use access control (don't allow 0.0.0.0/0)
4. ✅ Keep Unbound updated
5. ✅ Monitor logs for suspicious activity
6. ✅ Use trusted upstream DNS (Cloudflare, Google)
7. ❌ Don't log queries in production (privacy)

---

## 📖 Related Documentation

- **UNBOUND_RESOLVER_GUIDE.md** - Complete technical guide
- **RESOLVER_QUICK_START.md** - Quick start guide
- **Official Unbound Docs** - https://nlnetlabs.nl/documentation/unbound/

---

**Last Updated:** November 14, 2025
**Version:** 1.0.0
