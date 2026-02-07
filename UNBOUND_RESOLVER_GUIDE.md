# Unbound as DNS Resolver - Configuration Guide

## ✅ Status: ENABLED

NDash Unbound now functions as a **full DNS resolver** that can:

1. ✅ Resolve internet domains (google.com, cloudflare.com, etc.)
2. ✅ Resolve local zones managed by NDash (dionipe.id, etc.)
3. ✅ Cache DNS queries for performance
4. ✅ Forward to public DNS (Cloudflare & Google DNS)

---

## 🎯 How It Works

```
Client Query
     ↓
[Unbound on Port 53]
     ↓
Check Local Zones? ──Yes──> Return local-data
     ↓ No
     ↓
Check Cache? ──Yes──> Return cached result
     ↓ No
     ↓
Forward to Upstream DNS
     ↓
[Cloudflare 1.1.1.1]
[Google 8.8.8.8]
     ↓
Cache Result & Return
```

---

## 📝 Configuration

### File: `/etc/unbound/unbound.conf.d/ndash-resolver.conf`

```conf
server:
    # Network Interface
    interface: 0.0.0.0        # Listen on all interfaces
    port: 53                   # Standard DNS port

    # Protocol Support
    do-ip4: yes               # Enable IPv4
    do-ip6: yes               # Enable IPv6
    do-udp: yes               # Enable UDP (primary DNS protocol)
    do-tcp: yes               # Enable TCP (for large responses)

    # Access Control
    access-control: 0.0.0.0/0 refuse          # Default: deny all
    access-control: 127.0.0.0/8 allow         # Allow localhost
    access-control: 10.0.0.0/8 allow          # Allow private network 10.x
    access-control: 172.16.0.0/12 allow       # Allow private network 172.16-31.x
    access-control: 192.168.0.0/16 allow      # Allow private network 192.168.x

    # Performance Tuning
    num-threads: 2            # Use 2 threads for processing
    msg-cache-size: 16m       # Message cache size
    rrset-cache-size: 32m     # Resource record cache size
    cache-min-ttl: 300        # Minimum cache time (5 minutes)
    cache-max-ttl: 86400      # Maximum cache time (24 hours)

    # Privacy & Security
    hide-identity: yes        # Don't reveal server identity
    hide-version: yes         # Don't reveal Unbound version

    # Performance Optimizations
    prefetch: yes             # Prefetch popular entries before expiry
    prefetch-key: yes         # Prefetch DNSSEC keys

    # Logging
    verbosity: 1              # Minimal logging (0=none, 5=debug)
    log-queries: no           # Don't log every query (privacy)

    # DNSSEC
    auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # Recursion Control
    do-not-query-localhost: no

# Forward all internet queries to upstream DNS
forward-zone:
    name: "."                 # Root zone (all domains)

    # Cloudflare DNS (Primary)
    forward-addr: 1.1.1.1@53
    forward-addr: 1.0.0.1@53

    # Google DNS (Backup)
    forward-addr: 8.8.8.8@53
    forward-addr: 8.8.4.4@53

    # Always forward (no full recursion)
    forward-first: no
```

---

## 🧪 Testing

### 1. Test Internet Domain Resolution

```bash
dig @127.0.0.1 google.com A +short
# Expected: IP addresses from Google
```

### 2. Test Local Zone Resolution

```bash
dig @127.0.0.1 dionipe.id A +short
# Expected: 127.0.0.1 (or your configured IP)
```

### 3. Test Reverse DNS

```bash
dig @127.0.0.1 -x 103.142.215.1 +short
# Expected: PTR record if configured
```

### 4. Test DNS Performance

```bash
# First query (uncached)
time dig @127.0.0.1 example.com +short

# Second query (cached)
time dig @127.0.0.1 example.com +short
# Should be much faster!
```

### 5. Check Cache Statistics

```bash
sudo unbound-control stats_noreset | grep total.num
```

Example output:

```
total.num.queries=245
total.num.cachehits=156
total.num.cachemiss=89
total.num.prefetch=12
```

---

## 🔧 Management Commands

### Restart Unbound

```bash
sudo systemctl restart unbound
```

### Check Status

```bash
sudo systemctl status unbound
```

### Reload Configuration (without restart)

```bash
sudo unbound-control reload
```

### Flush DNS Cache

```bash
sudo unbound-control flush_zone .
sudo unbound-control flush_bogus
```

### View Statistics

```bash
sudo unbound-control stats
```

### Test Configuration

```bash
sudo unbound-checkconf
```

---

## 📊 Access Control Rules

| Network             | CIDR           | Access    | Purpose            |
| ------------------- | -------------- | --------- | ------------------ |
| Localhost           | 127.0.0.0/8    | ✅ Allow  | Local applications |
| Private 10.x        | 10.0.0.0/8     | ✅ Allow  | Internal network   |
| Private 172.16-31.x | 172.16.0.0/12  | ✅ Allow  | Internal network   |
| Private 192.168.x   | 192.168.0.0/16 | ✅ Allow  | Internal network   |
| All others          | 0.0.0.0/0      | ❌ Refuse | Security           |

### Allow Additional Networks

Edit `/etc/unbound/unbound.conf.d/ndash-resolver.conf`:

```conf
server:
    # Allow specific public IP
    access-control: 203.0.113.0/24 allow

    # Allow IPv6 network
    access-control: 2001:db8::/32 allow
```

Then reload:

```bash
sudo unbound-control reload
```

---

## 🌐 Use Cases

### 1. Local DNS Server for LAN

Clients on the local network can use this server as a DNS resolver.

**Setup Client (Linux):**

```bash
# Temporary
sudo resolvectl dns eth0 192.168.1.100

# Permanent - edit /etc/systemd/resolved.conf
[Resolve]
DNS=192.168.1.100
```

**Setup Client (Windows):**

```
Network Settings > Change Adapter Settings > Properties
IPv4 > Properties > Use the following DNS server addresses
Preferred DNS: 192.168.1.100
```

### 2. Split DNS (Local + Internet)

- Local zones (dionipe.id) → resolved locally
- Internet domains (google.com) → forwarded to public DNS
- Transparent to clients

### 3. DNS Caching

Unbound caches responses, reducing:

- Latency for repeated queries
- Load on upstream DNS servers
- Bandwidth usage

---

## 🔍 Troubleshooting

### Problem: "connection timed out"

```bash
# Check if Unbound is running
sudo systemctl status unbound

# Check if port 53 is listening
sudo ss -tlnp | grep :53

# Check firewall
sudo iptables -L -n | grep 53
```

### Problem: "SERVFAIL"

```bash
# Check Unbound logs
sudo journalctl -u unbound -n 50

# Test upstream DNS
dig @1.1.1.1 example.com

# Verify configuration
sudo unbound-checkconf
```

### Problem: Local zones not working

```bash
# List loaded zones
sudo unbound-control list_local_zones

# Check zone file
cat /etc/unbound/local.d/dionipe.id.conf

# Reload zones
sudo unbound-control reload
```

### Problem: Slow queries

```bash
# Check cache hit rate
sudo unbound-control stats | grep cache

# Increase cache size in config:
msg-cache-size: 32m
rrset-cache-size: 64m
```

---

## 📈 Monitoring

### Check Query Statistics

```bash
sudo unbound-control stats_noreset
```

Key metrics:

- `total.num.queries` - Total queries received
- `total.num.cachehits` - Queries answered from cache
- `total.num.cachemiss` - Queries that needed upstream lookup
- `total.num.prefetch` - Queries prefetched before expiry
- `total.requestlist.avg` - Average request list size

### Cache Hit Rate

```bash
# Calculate hit rate
HITS=$(sudo unbound-control stats | grep cachehits | cut -d= -f2)
MISS=$(sudo unbound-control stats | grep cachemiss | cut -d= -f2)
TOTAL=$((HITS + MISS))
RATE=$((HITS * 100 / TOTAL))
echo "Cache hit rate: ${RATE}%"
```

---

## 🔒 Security Best Practices

### 1. Limit Access

Only allow trusted networks in `access-control`.

### 2. Enable DNSSEC

Already enabled with:

```conf
auto-trust-anchor-file: "/var/lib/unbound/root.key"
```

### 3. Hide Server Info

```conf
hide-identity: yes
hide-version: yes
```

### 4. Rate Limiting (Optional)

Add to server config:

```conf
ratelimit: 100           # Max 100 queries per second per client
ip-ratelimit: 1000       # Max 1000 queries per second per IP
```

### 5. Monitor Logs

```bash
# Watch for suspicious activity
sudo journalctl -u unbound -f | grep -E "(refused|SERVFAIL|suspicious)"
```

---

## 🚀 Performance Tuning

### For High Traffic

```conf
server:
    num-threads: 4                    # More threads
    msg-cache-size: 64m               # Larger cache
    rrset-cache-size: 128m
    outgoing-range: 8192              # More outgoing ports
    num-queries-per-thread: 4096
    jostle-timeout: 200
```

### For Low Latency

```conf
server:
    cache-min-ttl: 60                 # Shorter minimum TTL
    prefetch: yes                     # Enable prefetch
    serve-expired: yes                # Serve expired records
    serve-expired-ttl: 3600
```

---

## 📋 Summary

✅ **Unbound now functions as:**

- **Recursive DNS Resolver** for internet domains
- **Authoritative Server** for local zones (NDash managed)
- **DNS Cache** for improved performance
- **DNS Forwarder** to Cloudflare & Google DNS

✅ **Verification:**

```bash
# Internet domain
dig @127.0.0.1 google.com +short
# Output: IP addresses

# Local zone
dig @127.0.0.1 dionipe.id +short
# Output: 127.0.0.1

# Cache working
sudo unbound-control stats | grep cache
# Output: cache statistics
```

---

**Configuration File:** `/etc/unbound/unbound.conf.d/ndash-resolver.conf`
**Status:** ✅ Active and Tested
**Date:** November 14, 2025
