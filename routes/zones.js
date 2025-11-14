const express = require('express');
const router = express.Router();
const moment = require('moment');
const unboundService = require('../services/unboundService');

// List all zones
router.get('/', async (req, res) => {
    try {
        const zones = await unboundService.listZones();
        
        res.render('zones/list', {
            title: 'DNS Zones',
            zones: zones,
            moment,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error listing zones:', error);
        res.render('zones/list', {
            title: 'DNS Zones',
            zones: [],
            moment,
            error: 'Failed to load zones: ' + error.message
        });
    }
});

// View zone details
router.get('/:zoneName', async (req, res) => {
    try {
        const zoneName = req.params.zoneName;
        const { zone, records } = await unboundService.getZone(zoneName);

        res.render('zones/detail', {
            title: `Zone: ${zone.name}`,
            zone,
            records: records,
            moment,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error loading zone:', error);
        res.status(404).render('error', {
            title: 'Zone Not Found',
            message: error.message
        });
    }
});

// Add new zone (GET form)
router.get('/new/create', (req, res) => {
    res.render('zones/new', {
        title: 'Create New Zone'
    });
});

// Add new zone (POST)
router.post('/', async (req, res) => {
    try {
        // Trim all input values to remove leading/trailing whitespace
        const name = (req.body.name || '').trim();
        const type = (req.body.type || '').trim();
        const nameserver = (req.body.nameserver || '').trim();
        const email = (req.body.email || '').trim();
        const domain = (req.body.domain || '').trim();
        
        if (!name) {
            return res.redirect('/zones/new/create?error=' + encodeURIComponent('Zone name is required'));
        }
        
        // Validate zone name doesn't contain spaces
        if (name.includes(' ')) {
            return res.redirect('/zones/new/create?error=' + encodeURIComponent('Zone name cannot contain spaces'));
        }
        
        const zoneData = {
            name: name,
            type: type || 'master',
            nameserver: nameserver || `ns1.${name}.`,
            email: email || `admin.${name}.`
        };
        
        // Add domain for reverse zones
        if (domain && name.includes('in-addr.arpa')) {
            zoneData.domain = domain;
        }
        
        const result = await unboundService.createZone(zoneData);
        
        console.log('Zone created:', result);
        res.redirect(`/zones/${name}?success=` + encodeURIComponent(`Zone ${name} created successfully`));
    } catch (error) {
        console.error('Error creating zone:', error);
        res.redirect('/zones/new/create?error=' + encodeURIComponent(error.message));
    }
});

// Delete zone
router.post('/:zoneName/delete', async (req, res) => {
    try {
        const zoneName = req.params.zoneName;
        await unboundService.deleteZone(zoneName);
        res.redirect('/zones?success=' + encodeURIComponent(`Zone ${zoneName} deleted successfully`));
    } catch (error) {
        console.error('Error deleting zone:', error);
        res.redirect('/zones?error=' + encodeURIComponent(error.message));
    }
});

// Reload Unbound
router.post('/reload', async (req, res) => {
    try {
        await unboundService.reloadUnbound();
        res.json({ success: true, message: 'Unbound reloaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
