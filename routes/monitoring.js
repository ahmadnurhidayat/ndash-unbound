const express = require('express');
const router = express.Router();
const unboundService = require('../services/unboundService');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const os = require('os');

const execAsync = promisify(exec);

// GET /monitoring - Main monitoring page
router.get('/', async (req, res) => {
    try {
        const data = await getMonitoringData();
        res.render('monitoring/index', {
            title: 'Monitoring - NDash',
            ...data
        });
    } catch (error) {
        console.error('Error loading monitoring page:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to load monitoring data',
            error: error
        });
    }
});

// GET /monitoring/api/stats - API endpoint for real-time stats
router.get('/api/stats', async (req, res) => {
    try {
        const data = await getMonitoringData();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching monitoring stats:', error);
        res.json({ success: false, error: error.message });
    }
});

// GET /monitoring/api/logs - API endpoint for recent logs
router.get('/api/logs', async (req, res) => {
    try {
        const logs = await getUnboundLogs(100);
        res.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.json({ success: false, error: error.message });
    }
});

// GET /monitoring/api/queries - API endpoint for query stats
router.get('/api/queries', async (req, res) => {
    try {
        const queries = await getQueryStats();
        res.json({ success: true, queries });
    } catch (error) {
        console.error('Error fetching query stats:', error);
        res.json({ success: false, error: error.message });
    }
});

// Helper function to get all monitoring data
async function getMonitoringData() {
    const [unboundStatus, zones, systemInfo, queryStats, logs] = await Promise.all([
        getUnboundStatus(),
        getZonesStatus(),
        getSystemInfo(),
        getQueryStats(),
        getUnboundLogs(50)
    ]);

    return {
        unbound: unboundStatus,
        zones,
        system: systemInfo,
        queries: queryStats,
        logs
    };
}

// Get Unbound server status
async function getUnboundStatus() {
    try {
        const status = await unboundService.getUnboundStatus();
        
        // Get uptime
        let uptime = 'Unknown';
        try {
            const { stdout } = await execAsync('ps -p $(pgrep unbound) -o etime= 2>/dev/null || echo "0"');
            uptime = stdout.trim() || 'Unknown';
        } catch (e) {
            console.error('Error getting uptime:', e.message);
        }

        // Get statistics from unbound-control
        let stats = {};
        try {
            const { stdout } = await execAsync('sudo unbound-control stats_noreset');
            stats = parseUnboundStats(stdout);
        } catch (e) {
            console.error('Error getting stats:', e.message);
        }

        return {
            running: status.success,
            version: status.version || 'Unknown',
            uptime,
            stats,
            lastCheck: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting Unbound status:', error);
        return {
            running: false,
            version: 'Unknown',
            uptime: 'Unknown',
            stats: {},
            lastCheck: new Date().toISOString()
        };
    }
}

// Get zones status
async function getZonesStatus() {
    try {
        const zones = await unboundService.listZones();
        const zonesWithStatus = await Promise.all(
            zones.map(async (zone) => {
                try {
                    // Get full zone data with records
                    const zoneData = await unboundService.getZone(zone.name);
                    const recordCount = zoneData.records ? zoneData.records.length : 0;
                    
                    // For Unbound, zones are loaded if they exist in config
                    // We can verify by checking if unbound-control list_local_zones includes this zone
                    let status = 'loaded';
                    let serial = 'N/A'; // Unbound doesn't use serial numbers like BIND
                    
                    try {
                        const { stdout } = await execAsync('sudo unbound-control list_local_zones 2>&1');
                        if (stdout.includes(zone.name)) {
                            status = 'loaded';
                            // Generate pseudo-serial from last modified time
                            const timestamp = new Date(zone.lastModified).getTime();
                            serial = Math.floor(timestamp / 1000).toString();
                        } else {
                            status = 'not-loaded';
                        }
                    } catch (e) {
                        // If we can't check, but file exists, assume loaded
                        console.log(`Could not verify zone ${zone.name} in Unbound, assuming loaded`);
                        status = 'loaded';
                    }
                    
                    return {
                        name: zone.name,
                        type: zone.type,
                        status: status,
                        serial: serial,
                        records: recordCount
                    };
                } catch (error) {
                    console.error(`Error processing zone ${zone.name}:`, error.message);
                    return {
                        name: zone.name,
                        type: zone.type,
                        status: 'error',
                        serial: 'N/A',
                        records: 0
                    };
                }
            })
        );

        return {
            total: zonesWithStatus.length,
            loaded: zonesWithStatus.filter(z => z.status === 'loaded').length,
            error: zonesWithStatus.filter(z => z.status === 'error').length,
            zones: zonesWithStatus
        };
    } catch (error) {
        console.error('Error getting zones status:', error);
        return {
            total: 0,
            loaded: 0,
            error: 0,
            zones: []
        };
    }
}

// Get system information
async function getSystemInfo() {
    try {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // Get load average
        const loadAvg = os.loadavg();

        // Get disk usage
        let diskUsage = {};
        try {
            const { stdout } = await execAsync('df -h /etc/unbound | tail -1');
            const parts = stdout.trim().split(/\s+/);
            diskUsage = {
                total: parts[1],
                used: parts[2],
                available: parts[3],
                percent: parts[4]
            };
        } catch (e) {
            console.error('Error getting disk usage:', e.message);
        }

        // Get network stats
        let networkStats = {};
        try {
            const { stdout } = await execAsync('cat /proc/net/dev | grep -E "eth0|ens|enp" | head -1');
            if (stdout) {
                const parts = stdout.trim().split(/\s+/);
                networkStats = {
                    interface: parts[0].replace(':', ''),
                    received: formatBytes(parseInt(parts[1])),
                    transmitted: formatBytes(parseInt(parts[9]))
                };
            }
        } catch (e) {
            console.error('Error getting network stats:', e.message);
        }

        return {
            hostname: os.hostname(),
            platform: `${os.type()} ${os.release()}`,
            uptime: formatUptime(os.uptime()),
            cpu: {
                model: cpus[0].model,
                cores: cpus.length,
                load: loadAvg.map(l => l.toFixed(2))
            },
            memory: {
                total: formatBytes(totalMem),
                used: formatBytes(usedMem),
                free: formatBytes(freeMem),
                percent: ((usedMem / totalMem) * 100).toFixed(1)
            },
            disk: diskUsage,
            network: networkStats
        };
    } catch (error) {
        console.error('Error getting system info:', error);
        return {};
    }
}

// Get query statistics
async function getQueryStats() {
    try {
        // Execute unbound-control stats
        const { stdout } = await execAsync('sudo unbound-control stats_noreset');
        return parseQueryStats(stdout);
    } catch (error) {
        console.error('Error getting query stats:', error);
        return {
            total: 0,
            success: 0,
            failure: 0,
            recursion: 0,
            queryTypes: {}
        };
    }
}

// Get Unbound logs
async function getUnboundLogs(lines = 50) {
    try {
        const { stdout } = await execAsync(`sudo tail -${lines} /var/log/syslog | grep unbound || echo "No logs found"`);
        
        const logLines = stdout.trim().split('\n').filter(line => line.length > 0);
        
        return logLines.map(line => {
            const match = line.match(/^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+unbound\[\d+\]:\s+(.+)$/);
            if (match) {
                return {
                    timestamp: match[1],
                    host: match[2],
                    message: match[3],
                    level: getLogLevel(match[3])
                };
            }
            return {
                timestamp: new Date().toLocaleString(),
                host: 'unknown',
                message: line,
                level: 'info'
            };
        });
    } catch (error) {
        console.error('Error getting logs:', error);
        return [];
    }
}

// Helper functions
function parseUnboundStats(content) {
    const stats = {
        queries: 0,
        hits: 0,
        misses: 0,
        errors: 0
    };

    try {
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.includes('total.num.queries=')) {
                const match = line.match(/=(\d+)/);
                if (match) stats.queries = parseInt(match[1]);
            }
            if (line.includes('total.num.cachehits=')) {
                const match = line.match(/=(\d+)/);
                if (match) stats.hits = parseInt(match[1]);
            }
            if (line.includes('total.num.cachemiss=')) {
                const match = line.match(/=(\d+)/);
                if (match) stats.misses = parseInt(match[1]);
            }
            if (line.includes('total.num.recursivereplies=')) {
                const match = line.match(/=(\d+)/);
                if (match) stats.errors = parseInt(match[1]);
            }
        }
    } catch (e) {
        console.error('Error parsing stats:', e.message);
    }

    return stats;
}

function parseQueryStats(content) {
    const stats = {
        total: 0,
        success: 0,
        failure: 0,
        recursion: 0,
        queryTypes: {}
    };

    try {
        const lines = content.split('\n');
        for (const line of lines) {
            // Parse query types
            const typeMatch = line.match(/(\d+)\s+(A|AAAA|MX|NS|PTR|SOA|TXT|CNAME)\s+/);
            if (typeMatch) {
                const count = parseInt(typeMatch[1]);
                const type = typeMatch[2];
                stats.queryTypes[type] = (stats.queryTypes[type] || 0) + count;
                stats.total += count;
            }

            // Parse success/failure
            if (line.includes('NOERROR')) stats.success++;
            if (line.includes('SERVFAIL') || line.includes('NXDOMAIN')) stats.failure++;
        }
    } catch (e) {
        console.error('Error parsing query stats:', e.message);
    }

    return stats;
}

function extractSerial(output) {
    const match = output.match(/serial:\s+(\d+)/);
    return match ? match[1] : 'N/A';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getLogLevel(message) {
    if (message.includes('error') || message.includes('failed')) return 'error';
    if (message.includes('warning')) return 'warning';
    return 'info';
}

module.exports = router;
