#!/usr/bin/env node

/**
 * Migration Script: Bind to Unbound Settings
 * 
 * This script migrates data/settings.json from old BIND structure to new Unbound structure.
 * Run this once after upgrading from BIND version to Unbound version.
 * 
 * Usage: node migrate-settings.js
 */

const fs = require('fs-extra');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'data/settings.json');
const BACKUP_FILE = path.join(__dirname, 'data/settings.json.bind-backup');

async function migrateSettings() {
    console.log('🔄 Starting settings migration from BIND to Unbound...\n');

    try {
        // Check if settings file exists
        if (!await fs.pathExists(SETTINGS_FILE)) {
            console.log('⚠️  No settings.json found. Using defaults.');
            return;
        }

        // Read current settings
        const content = await fs.readFile(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(content);

        // Check if already migrated
        if (settings.unbound && !settings.bind) {
            console.log('✅ Settings already migrated to Unbound format.');
            console.log('   Current version:', settings.unbound.version);
            return;
        }

        // Check if migration needed
        if (!settings.bind) {
            console.log('✅ No BIND settings found. Nothing to migrate.');
            return;
        }

        console.log('📋 Found BIND settings:');
        console.log('   - Config Path:', settings.bind.configPath);
        console.log('   - Zones Path:', settings.bind.zonesPath);
        console.log('');

        // Backup original settings
        await fs.copy(SETTINGS_FILE, BACKUP_FILE);
        console.log('💾 Backup created:', BACKUP_FILE);
        console.log('');

        // Create new Unbound settings
        const newSettings = {
            zones: settings.zones || {
                autoReload: true,
                validateBeforeReload: true,
                backupEnabled: true,
                autoGeneratePTR: true
            },
            unbound: {
                version: 'Unbound',
                configPath: '/etc/unbound',
                confPath: '/etc/unbound/unbound.conf',
                localZonesPath: '/etc/unbound/local.d',
                controlSocket: '/var/run/unbound.ctl',
                logFile: '/var/log/unbound.log'
            }
        };

        // Write migrated settings
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf8');

        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('📝 New Unbound settings:');
        console.log('   - Config Path:', newSettings.unbound.configPath);
        console.log('   - Local Zones:', newSettings.unbound.localZonesPath);
        console.log('   - Control Socket:', newSettings.unbound.controlSocket);
        console.log('');
        console.log('🔧 Next steps:');
        console.log('   1. Install Unbound: sudo apt install unbound unbound-utils');
        console.log('   2. Setup directories: sudo mkdir -p /etc/unbound/local.d');
        console.log('   3. Configure include directive in /etc/unbound/unbound.conf');
        console.log('   4. Restart NDash: npm restart or systemctl restart ndash');
        console.log('');
        console.log('💡 Your old BIND settings are backed up in:');
        console.log('   ', BACKUP_FILE);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('');
        console.error('Please check the error and try again, or restore from backup:');
        console.error('   cp', BACKUP_FILE, SETTINGS_FILE);
        process.exit(1);
    }
}

// Run migration
migrateSettings().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
