const fs = require('fs-extra');

/**
 * Unbound Configuration Manager
 * Manages /etc/unbound/unbound.conf and local zone includes
 */

const UNBOUND_CONF = '/etc/unbound/unbound.conf';
const LOCAL_ZONES_DIR = '/etc/unbound/local.d';

/**
 * Ensure include directive exists in unbound.conf
 */
async function ensureIncludeDirective() {
    try {
        let configContent = await fs.readFile(UNBOUND_CONF, 'utf8');
        
        const includeDirective = `include: "${LOCAL_ZONES_DIR}/*.conf"`;
        
        // Check if include directive already exists
        if (configContent.includes(includeDirective)) {
            console.log(`✓ Include directive already exists in unbound.conf`);
            return;
        }
        
        // Add include directive at the end of the file
        const updatedConfig = configContent.trimEnd() + `\n\n# NDash local zones\n${includeDirective}\n`;
        
        // Backup before modifying
        const backupFile = `${UNBOUND_CONF}.backup.${Date.now()}`;
        await fs.copyFile(UNBOUND_CONF, backupFile);
        console.log(`✓ Backup created: ${backupFile}`);
        
        // Write updated config
        await fs.writeFile(UNBOUND_CONF, updatedConfig, 'utf8');
        console.log(`✓ Added include directive to unbound.conf`);
        
    } catch (error) {
        throw new Error(`Failed to add include directive: ${error.message}`);
    }
}

/**
 * Remove include directive from unbound.conf
 */
async function removeIncludeDirective() {
    try {
        let configContent = await fs.readFile(UNBOUND_CONF, 'utf8');
        
        // Remove include directive and NDash comment
        const lines = configContent.split('\n');
        const filteredLines = lines.filter(line => {
            return !line.includes('# NDash local zones') && 
                   !line.includes(`include: "${LOCAL_ZONES_DIR}/*.conf"`);
        });
        
        const updatedConfig = filteredLines.join('\n').trimEnd() + '\n';
        
        // Backup before modifying
        const backupFile = `${UNBOUND_CONF}.backup.${Date.now()}`;
        await fs.copyFile(UNBOUND_CONF, backupFile);
        console.log(`✓ Backup created: ${backupFile}`);
        
        // Write updated config
        await fs.writeFile(UNBOUND_CONF, updatedConfig, 'utf8');
        console.log(`✓ Removed include directive from unbound.conf`);
        
    } catch (error) {
        throw new Error(`Failed to remove include directive: ${error.message}`);
    }
}

/**
 * List all configured local zones from zone config files
 */
async function listConfiguredZones() {
    try {
        await fs.ensureDir(LOCAL_ZONES_DIR);
        
        const files = await fs.readdir(LOCAL_ZONES_DIR);
        const zones = [];
        
        for (const file of files) {
            if (!file.endsWith('.conf')) continue;
            
            const filePath = `${LOCAL_ZONES_DIR}/${file}`;
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract zone name from local-zone directive
            const match = content.match(/local-zone:\s+"([^"]+)"\s+(\w+)/);
            if (match) {
                zones.push({
                    name: match[1],
                    type: match[2],
                    file: filePath
                });
            }
        }
        
        return zones;
    } catch (error) {
        throw new Error(`Failed to list zones: ${error.message}`);
    }
}

/**
 * Check if a zone exists in configuration
 */
async function zoneExists(zoneName) {
    try {
        const zones = await listConfiguredZones();
        return zones.some(z => z.name === zoneName);
    } catch (error) {
        return false;
    }
}

/**
 * Get zone configuration file path
 */
function getZoneFilePath(zoneName) {
    const zoneFileName = zoneName.replace(/\.$/, '');
    return `${LOCAL_ZONES_DIR}/${zoneFileName}.conf`;
}

/**
 * Validate unbound configuration
 */
async function validateConfig() {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
        await execPromise('unbound-checkconf');
        return { valid: true };
    } catch (error) {
        return { 
            valid: false, 
            error: error.stderr || error.message 
        };
    }
}

/**
 * Backup a zone configuration file
 */
async function backupZoneConfig(zoneName) {
    try {
        const zoneFile = getZoneFilePath(zoneName);
        
        if (!(await fs.pathExists(zoneFile))) {
            throw new Error(`Zone file not found: ${zoneFile}`);
        }
        
        const backupDir = `${LOCAL_ZONES_DIR}/backups`;
        await fs.ensureDir(backupDir);
        
        const timestamp = Date.now();
        const backupFile = `${backupDir}/${zoneName.replace(/\.$/, '')}.${timestamp}.conf`;
        
        await fs.copy(zoneFile, backupFile);
        console.log(`✓ Backup created: ${backupFile}`);
        
        return backupFile;
    } catch (error) {
        throw new Error(`Failed to backup zone config: ${error.message}`);
    }
}

/**
 * Restore a zone configuration from backup
 */
async function restoreZoneConfig(backupFile, zoneName) {
    try {
        if (!(await fs.pathExists(backupFile))) {
            throw new Error(`Backup file not found: ${backupFile}`);
        }
        
        const zoneFile = getZoneFilePath(zoneName);
        await fs.copy(backupFile, zoneFile, { overwrite: true });
        console.log(`✓ Restored zone config from: ${backupFile}`);
        
        return true;
    } catch (error) {
        throw new Error(`Failed to restore zone config: ${error.message}`);
    }
}

/**
 * Clean up old backup files (keep only last N backups)
 */
async function cleanupBackups(keepCount = 10) {
    try {
        const backupDir = `${LOCAL_ZONES_DIR}/backups`;
        
        if (!(await fs.pathExists(backupDir))) {
            return { deleted: 0 };
        }
        
        const files = await fs.readdir(backupDir);
        const backupFiles = files
            .filter(f => f.endsWith('.conf'))
            .map(f => ({
                name: f,
                path: `${backupDir}/${f}`,
                time: fs.statSync(`${backupDir}/${f}`).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Sort by newest first
        
        // Keep only the most recent backups
        const toDelete = backupFiles.slice(keepCount);
        
        for (const file of toDelete) {
            await fs.remove(file.path);
        }
        
        console.log(`✓ Cleaned up ${toDelete.length} old backup files`);
        return { deleted: toDelete.length };
        
    } catch (error) {
        throw new Error(`Failed to cleanup backups: ${error.message}`);
    }
}

module.exports = {
    ensureIncludeDirective,
    removeIncludeDirective,
    listConfiguredZones,
    zoneExists,
    getZoneFilePath,
    validateConfig,
    backupZoneConfig,
    restoreZoneConfig,
    cleanupBackups,
    UNBOUND_CONF,
    LOCAL_ZONES_DIR
};
