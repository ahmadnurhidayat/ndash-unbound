const express = require('express');
const router = express.Router();
const bindService = require('../services/bindService');
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

// Helper function to get all statistics data
async function getStatisticsData() {
    const zones = await bindService.listZones();
    
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
            const zoneData = await bindService.getZone(zone.name);
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
