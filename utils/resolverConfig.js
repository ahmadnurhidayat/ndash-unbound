const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const RESOLVER_CONFIG_FILE = '/etc/unbound/unbound.conf.d/ndash-resolver.conf';

/**
 * Generate Unbound resolver configuration from settings
 */
function generateResolverConfig(settings) {
    const resolver = settings.resolver;
    
    if (!resolver.enabled) {
        return null;
    }
    
    let config = `# NDash Unbound Resolver Configuration
# Generated automatically by NDash
# DO NOT EDIT MANUALLY - Changes will be overwritten

server:
    # Network Interface
    interface: 0.0.0.0
    port: 53
    
    # Protocol Support
    do-ip4: yes
    do-ip6: yes
    do-udp: yes
    do-tcp: yes
    
`;

    // Access Control
    config += `    # Access Control\n`;
    config += `    access-control: 0.0.0.0/0 refuse\n`;
    
    for (const network of resolver.access.allowedNetworks) {
        if (network.enabled) {
            config += `    access-control: ${network.network} allow    # ${network.description}\n`;
        }
    }
    
    config += `\n`;
    
    // Performance
    config += `    # Performance Tuning\n`;
    config += `    num-threads: ${resolver.performance.numThreads}\n`;
    config += `    msg-cache-size: ${resolver.cacheSize.msg}m\n`;
    config += `    rrset-cache-size: ${resolver.cacheSize.rrset}m\n`;
    config += `    cache-min-ttl: ${resolver.cacheTTL.min}\n`;
    config += `    cache-max-ttl: ${resolver.cacheTTL.max}\n`;
    config += `\n`;
    
    // Security
    config += `    # Privacy & Security\n`;
    config += `    hide-identity: ${resolver.security.hideIdentity ? 'yes' : 'no'}\n`;
    config += `    hide-version: ${resolver.security.hideVersion ? 'yes' : 'no'}\n`;
    
    // Note: DNSSEC trust anchor is configured in root-auto-trust-anchor-file.conf
    // We don't need to duplicate it here
    
    config += `\n`;
    
    // Performance optimizations
    if (resolver.performance.prefetch) {
        config += `    # Prefetch\n`;
        config += `    prefetch: yes\n`;
        if (resolver.performance.prefetchKey) {
            config += `    prefetch-key: yes\n`;
        }
        config += `\n`;
    }
    
    // Logging
    config += `    # Logging\n`;
    config += `    verbosity: ${resolver.logging.verbosity}\n`;
    config += `    log-queries: ${resolver.logging.logQueries ? 'yes' : 'no'}\n`;
    config += `    log-replies: ${resolver.logging.logReplies ? 'yes' : 'no'}\n`;
    config += `\n`;
    
    // Statistics
    config += `    # Statistics\n`;
    config += `    statistics-interval: 0\n`;
    config += `    extended-statistics: yes\n`;
    config += `    statistics-cumulative: yes\n`;
    config += `\n`;
    
    // Misc
    config += `    # Recursion Control\n`;
    config += `    do-not-query-localhost: no\n`;
    config += `\n`;
    
    // Forwarding
    if (resolver.forwardingEnabled && resolver.upstreamDNS.length > 0) {
        config += `# Forward all queries to upstream DNS\n`;
        config += `forward-zone:\n`;
        config += `    name: "."\n`;
        
        for (const upstream of resolver.upstreamDNS) {
            if (upstream.enabled) {
                config += `    forward-addr: ${upstream.address}@${upstream.port}    # ${upstream.name}\n`;
            }
        }
        
        config += `    forward-first: no\n`;
    }
    
    // Note: Local zones are loaded from /etc/unbound/local.d/*.conf
    // and take precedence over forward-zone due to Unbound's query resolution order
    
    return config;
}

/**
 * Apply resolver configuration
 */
async function applyResolverConfig(settings) {
    try {
        const config = generateResolverConfig(settings);
        
        if (!config) {
            // Resolver disabled, remove config file if exists
            if (await fs.pathExists(RESOLVER_CONFIG_FILE)) {
                await fs.remove(RESOLVER_CONFIG_FILE);
                console.log('✓ Resolver configuration removed');
            }
            return { success: true, message: 'Resolver disabled' };
        }
        
        // Ensure directory exists
        await fs.ensureDir(path.dirname(RESOLVER_CONFIG_FILE));
        
        // Write config file
        await fs.writeFile(RESOLVER_CONFIG_FILE, config, 'utf8');
        console.log('✓ Resolver configuration written');
        
        // Verify configuration
        try {
            await execAsync('sudo unbound-checkconf');
            console.log('✓ Configuration validated');
        } catch (error) {
            // Restore backup if validation fails
            throw new Error(`Configuration validation failed: ${error.message}`);
        }
        
        // Reload Unbound
        try {
            await execAsync('sudo unbound-control reload');
            console.log('✓ Unbound reloaded');
        } catch (error) {
            console.warn('Warning: Could not reload Unbound:', error.message);
        }
        
        return { 
            success: true, 
            message: 'Resolver configuration applied successfully' 
        };
        
    } catch (error) {
        console.error('✗ Failed to apply resolver configuration:', error.message);
        throw error;
    }
}

/**
 * Get resolver status
 */
async function getResolverStatus() {
    try {
        const configExists = await fs.pathExists(RESOLVER_CONFIG_FILE);
        
        if (!configExists) {
            return {
                enabled: false,
                running: false,
                message: 'Resolver not configured'
            };
        }
        
        // Check if Unbound is running
        try {
            const { stdout } = await execAsync('sudo unbound-control status');
            
            // Parse version and status
            const lines = stdout.split('\n');
            const versionLine = lines.find(l => l.includes('version:'));
            const uptimeLine = lines.find(l => l.includes('uptime:'));
            
            const version = versionLine ? versionLine.split(':')[1].trim() : 'Unknown';
            const uptime = uptimeLine ? uptimeLine.split(':')[1].trim() : '0';
            
            return {
                enabled: true,
                running: true,
                version: version,
                uptime: uptime + ' seconds',
                message: 'Resolver is running'
            };
        } catch (error) {
            return {
                enabled: true,
                running: false,
                message: 'Unbound service is not running'
            };
        }
    } catch (error) {
        return {
            enabled: false,
            running: false,
            message: `Error: ${error.message}`
        };
    }
}

/**
 * Test DNS resolution
 */
async function testResolver(domain = 'google.com') {
    try {
        const { stdout } = await execAsync(`dig @127.0.0.1 ${domain} A +short +time=2 +tries=1`);
        const result = stdout.trim();
        
        if (result) {
            return {
                success: true,
                domain: domain,
                result: result.split('\n')[0],
                message: 'DNS resolution successful'
            };
        } else {
            return {
                success: false,
                domain: domain,
                message: 'No response from resolver'
            };
        }
    } catch (error) {
        return {
            success: false,
            domain: domain,
            message: `Resolution failed: ${error.message}`
        };
    }
}

/**
 * Get resolver statistics
 */
async function getResolverStats() {
    try {
        const { stdout } = await execAsync('sudo unbound-control stats_noreset');
        
        const stats = {};
        const lines = stdout.split('\n');
        
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.+)$/);
            if (match) {
                stats[match[1]] = match[2];
            }
        }
        
        return {
            queries: parseInt(stats['total.num.queries'] || 0),
            cachehits: parseInt(stats['total.num.cachehits'] || 0),
            cachemiss: parseInt(stats['total.num.cachemiss'] || 0),
            prefetch: parseInt(stats['total.num.prefetch'] || 0),
            recursion: parseInt(stats['total.recursion.time.avg'] || 0),
            cacheHitRate: stats['total.num.queries'] > 0 
                ? Math.round((parseInt(stats['total.num.cachehits']) / parseInt(stats['total.num.queries'])) * 100)
                : 0,
            raw: stdout  // Include raw stats for detailed parsing
        };
    } catch (error) {
        return {
            queries: 0,
            cachehits: 0,
            cachemiss: 0,
            prefetch: 0,
            recursion: 0,
            cacheHitRate: 0,
            raw: ''
        };
    }
}

module.exports = {
    generateResolverConfig,
    applyResolverConfig,
    getResolverStatus,
    testResolver,
    getResolverStats
};
