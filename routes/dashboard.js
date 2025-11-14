const express = require('express');
const router = express.Router();
const moment = require('moment');
const bindService = require('../services/bindService');
const { activities } = require('../data/storage');

router.get('/', async (req, res) => {
    try {
        // Get zones from Bind
        const zones = await bindService.listZones();
        
        // Calculate statistics with actual record counts
        const totalRecords = zones.reduce((sum, zone) => sum + zone.records, 0);
        
        // Get actual record types from zones
        const recordsByType = {};
        for (const zone of zones) {
            try {
                const zoneData = await bindService.getZone(zone.name);
                const records = zoneData.records || [];
                records.forEach(record => {
                    const type = record.type || 'OTHER';
                    recordsByType[type] = (recordsByType[type] || 0) + 1;
                });
            } catch (error) {
                console.error(`Error getting records for ${zone.name}:`, error.message);
            }
        }
        
        const stats = {
            totalZones: zones.length,
            activeZones: zones.filter(z => z.status === 'active').length,
            totalRecords: totalRecords,
            recentActivities: activities.slice(0, 5)
        };

        // Get Bind status
        const bindStatus = await bindService.getBindStatus();

        res.render('dashboard', {
            title: 'NDash - Bind DNS Dashboard',
            stats,
            zones: zones.slice(0, 5),
            recordsByType,
            activities: stats.recentActivities,
            bindStatus,
            moment
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', {
            title: 'NDash - Bind DNS Dashboard',
            stats: { totalZones: 0, activeZones: 0, totalRecords: 0, recentActivities: [] },
            zones: [],
            recordsByType: {},
            activities: [],
            bindStatus: { success: false, status: 'error' },
            moment,
            error: error.message
        });
    }
});

module.exports = router;
