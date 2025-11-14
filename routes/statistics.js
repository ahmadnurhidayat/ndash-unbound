const express = require('express');
const router = express.Router();
const unboundService = require('../services/unboundService');
const resolverConfig = require('../utils/resolverConfig');
const moment = require('moment');
const { activities } = require('../data/storage');

// GET /statistics - Main statistics page
router.get('/', async (req, res) => {
    try {
        const data = await getStatisticsData();
        res.render('statistics/index', {
            title: 'Statistics - NDash',
            ...data,
            moment
        });
    } catch (error) {
        console.error('Error loading statistics page:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to load statistics',
            error: error
        });
    }
});

// GET /statistics/api/data - API endpoint for real-time stats
router.get('/api/data', async (req, res) => {
    try {
        const data = await getStatisticsData();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.json({ success: false, error: error.message });
    }
});

// GET /statistics/resolver - Resolver statistics page
router.get('/resolver', async (req, res) => {
    try {
        const data = await getResolverStatistics();
        res.render('statistics/resolver', {
            title: 'Resolver Statistics - NDash',
            ...data,
            moment
        });
    } catch (error) {
        console.error('Error loading resolver statistics:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to load resolver statistics',
            error: error
        });
    }
});

// GET /statistics/resolver/api - API endpoint for resolver stats
router.get('/resolver/api', async (req, res) => {
    try {
        const data = await getResolverStatistics();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching resolver statistics:', error);
        res.json({ success: false, error: error.message });
    }
});

// Helper function to get resolver statistics
async function getResolverStatistics() {
    const status = await resolverConfig.getResolverStatus();
    const stats = await resolverConfig.getResolverStats();
    
    // Parse detailed stats from unbound-control
    const detailedStats = {};
    if (stats.raw) {
        const lines = stats.raw.split('\n');
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                detailedStats[key.trim()] = parseFloat(value) || value.trim();
            }
        });
    }
    
    // Calculate aggregated metrics
    const metrics = {
        // Query statistics
        queries: {
            total: detailedStats['total.num.queries'] || 0,
            cachehits: detailedStats['total.num.cachehits'] || 0,
            cachemiss: detailedStats['total.num.cachemiss'] || 0,
            prefetch: detailedStats['total.num.prefetch'] || 0,
            recursion: detailedStats['total.num.recursivereplies'] || 0,
            hitRate: stats.cacheHitRate || 0
        },
        
        // Cache statistics
        cache: {
            msgSize: detailedStats['msg.cache.count'] || 0,
            rrsetSize: detailedStats['rrset.cache.count'] || 0,
            infra: detailedStats['infra.cache.count'] || 0,
            key: detailedStats['key.cache.count'] || 0
        },
        
        // Memory usage
        memory: {
            msgCache: detailedStats['mem.cache.message'] 
                ? (detailedStats['mem.cache.message'] / 1024 / 1024).toFixed(2) 
                : '0.00',
            rrsetCache: detailedStats['mem.cache.rrset'] 
                ? (detailedStats['mem.cache.rrset'] / 1024 / 1024).toFixed(2) 
                : '0.00',
            modIterator: detailedStats['mem.mod.iterator'] 
                ? (detailedStats['mem.mod.iterator'] / 1024 / 1024).toFixed(2) 
                : '0.00',
            modValidator: detailedStats['mem.mod.validator'] 
                ? (detailedStats['mem.mod.validator'] / 1024 / 1024).toFixed(2) 
                : '0.00'
        },
        
        // DNSSEC statistics
        dnssec: {
            secure: detailedStats['num.answer.secure'] || 0,
            bogus: detailedStats['num.answer.bogus'] || 0,
            insecure: detailedStats['num.answer.insecure'] || 0
        },
        
        // Request list
        requestlist: {
            avg: detailedStats['total.requestlist.avg'] || 0,
            max: detailedStats['total.requestlist.max'] || 0,
            overwritten: detailedStats['total.requestlist.overwritten'] || 0,
            exceeded: detailedStats['total.requestlist.exceeded'] || 0
        },
        
        // Time statistics
        time: {
            now: detailedStats['time.now'] || 0,
            up: detailedStats['time.up'] || 0,
            elapsed: detailedStats['time.elapsed'] || 0
        }
    };
    
    // Calculate query type distribution
    const queryTypes = {};
    Object.keys(detailedStats).forEach(key => {
        if (key.startsWith('num.query.type.')) {
            const type = key.replace('num.query.type.', '');
            const count = detailedStats[key];
            if (count > 0) {
                queryTypes[type] = count;
            }
        }
    });
    
    // Calculate query class distribution
    const queryClasses = {};
    Object.keys(detailedStats).forEach(key => {
        if (key.startsWith('num.query.class.')) {
            const cls = key.replace('num.query.class.', '');
            const count = detailedStats[key];
            if (count > 0) {
                queryClasses[cls] = count;
            }
        }
    });
    
    // Calculate answer rcode distribution
    const answerRcodes = {};
    Object.keys(detailedStats).forEach(key => {
        if (key.startsWith('num.answer.rcode.')) {
            const rcode = key.replace('num.answer.rcode.', '');
            const count = detailedStats[key];
            if (count > 0) {
                answerRcodes[rcode] = count;
            }
        }
    });
    
    // Performance metrics
    const performance = {
        queriesPerSecond: metrics.queries.total > 0 && metrics.time.elapsed > 0 
            ? (metrics.queries.total / metrics.time.elapsed).toFixed(2) 
            : 0,
        avgRecursionTime: detailedStats['total.recursion.time.avg'] || 0,
        medianRecursionTime: detailedStats['total.recursion.time.median'] || 0
    };
    
    // Get top queried domains from recent logs
    const topDomains = await getTopQueriedDomains();
    
    return {
        status,
        metrics,
        queryTypes,
        queryClasses,
        answerRcodes,
        performance,
        topDomains,
        rawStats: detailedStats
    };
}

// Helper function to get top queried domains from logs
async function getTopQueriedDomains(limit = 20) {
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        // Get recent unbound queries from journalctl
        // Format: "Nov 14 08:07:41 ndash-unbound unbound[11170]: [11170:1] info: 127.0.0.1 facebook.com. A IN"
        // Extract domain (field 4 after the colon separator)
        const { stdout } = await execAsync(
            `sudo journalctl -u unbound --since "30 minutes ago" --no-pager | ` +
            `grep "info: 127.0.0.1" | ` +
            `awk -F': ' '{print $NF}' | ` +
            `awk '{print $2}' | ` +
            `sed 's/\\.$//' | ` +
            `grep -v "in-addr.arpa" | ` +
            `grep -v "ip6.arpa" | ` +
            `grep -v "^_" | ` +
            `grep -v "^$" | ` +
            `sort | uniq -c | sort -rn | head -${limit}`
        );
        
        const domains = [];
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
            if (match) {
                const domain = match[2].trim();
                // Additional filtering
                if (domain && domain.length > 0 && !domain.startsWith('_')) {
                    domains.push({
                        domain: domain,
                        count: parseInt(match[1]),
                        percentage: 0 // Will calculate after
                    });
                }
            }
        }
        
        // Calculate percentages
        const total = domains.reduce((sum, d) => sum + d.count, 0);
        domains.forEach(d => {
            d.percentage = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
        });
        
        return {
            domains: domains.slice(0, limit),
            total: total,
            timeRange: '30 minutes'
        };
    } catch (error) {
        console.error('Error getting top domains:', error);
        return {
            domains: [],
            total: 0,
            timeRange: '30 minutes',
            error: error.message
        };
    }
}

// Helper function to get all statistics data
async function getStatisticsData() {
    const zones = await unboundService.listZones();
    
    // Calculate zone statistics
    const zoneStats = {
        total: zones.length,
        active: zones.filter(z => z.status === 'active').length,
        master: zones.filter(z => z.type === 'master').length,
        slave: zones.filter(z => z.type === 'slave').length,
        forward: zones.filter(z => !z.name.includes('in-addr.arpa')).length,
        reverse: zones.filter(z => z.name.includes('in-addr.arpa')).length
    };

    // Calculate record statistics
    let totalRecords = 0;
    const recordsByType = {};
    const recordsByZone = [];
    const topZones = [];

    for (const zone of zones) {
        try {
            const zoneData = await unboundService.getZone(zone.name);
            const records = zoneData.records || [];
            const zoneRecordCount = records.length;
            totalRecords += zoneRecordCount;

            // Count by type
            records.forEach(record => {
                const type = record.type || 'OTHER';
                recordsByType[type] = (recordsByType[type] || 0) + 1;
            });

            // Zone-specific stats
            const typeBreakdown = {};
            records.forEach(record => {
                const type = record.type || 'OTHER';
                typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
            });

            recordsByZone.push({
                name: zone.name,
                total: zoneRecordCount,
                types: typeBreakdown,
                type: zone.type
            });

            topZones.push({
                name: zone.name,
                records: zoneRecordCount,
                type: zone.type
            });
        } catch (error) {
            console.error(`Error processing zone ${zone.name}:`, error.message);
        }
    }

    // Sort top zones by record count
    topZones.sort((a, b) => b.records - a.records);

    // Calculate record type percentages
    const recordTypeStats = Object.entries(recordsByType).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / totalRecords) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);

    // Activity statistics
    const activityStats = {
        total: activities.length,
        today: activities.filter(a => moment(a.timestamp).isSame(moment(), 'day')).length,
        thisWeek: activities.filter(a => moment(a.timestamp).isSame(moment(), 'week')).length,
        thisMonth: activities.filter(a => moment(a.timestamp).isSame(moment(), 'month')).length,
        recentActivities: activities.slice(0, 10)
    };

    // Activity by type
    const activityByType = {};
    activities.forEach(activity => {
        const type = activity.action.split(' ')[0]; // Get first word (Created, Modified, Deleted)
        activityByType[type] = (activityByType[type] || 0) + 1;
    });

    // Time-based statistics (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const count = activities.filter(a => 
            moment(a.timestamp).isSame(date, 'day')
        ).length;
        last7Days.push({
            date: date.format('MMM DD'),
            count
        });
    }

    // Growth statistics
    const lastMonthZones = zones.filter(z => 
        z.createdAt && moment(z.createdAt).isAfter(moment().subtract(30, 'days'))
    ).length;

    const lastMonthRecords = activities.filter(a => 
        a.action.includes('Record') && 
        moment(a.timestamp).isAfter(moment().subtract(30, 'days'))
    ).length;

    return {
        zoneStats,
        recordStats: {
            total: totalRecords,
            byType: recordTypeStats,
            byZone: recordsByZone
        },
        topZones: topZones.slice(0, 10),
        activityStats,
        activityByType,
        activityTimeline: last7Days,
        growth: {
            zonesLastMonth: lastMonthZones,
            recordsLastMonth: lastMonthRecords
        }
    };
}

module.exports = router;
