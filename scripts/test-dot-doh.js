#!/usr/bin/env node

/**
 * NDash DoT/DoH Test Script
 * Tests DNS over TLS (DoT) and DNS over HTTPS (DoH) functionality
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🧪 NDash DoT/DoH Test');
console.log('====================\n');

async function testDoT() {
    console.log('Testing DNS over TLS (DoT)...');
    try {
        const { stdout, stderr } = await execPromise('timeout 10 kdig @127.0.0.1 +tls google.com A +short');
        if (stdout.trim()) {
            console.log('✅ DoT: Working - Got response:', stdout.trim().split('\n')[0]);
            return true;
        } else {
            console.log('❌ DoT: No response received');
            return false;
        }
    } catch (error) {
        console.log('❌ DoT: Error -', error.message);
        return false;
    }
}

async function testDoH() {
    console.log('Testing DNS over HTTPS (DoH)...');
    try {
        const { stdout } = await execPromise('curl -s -H "accept: application/dns-message" "https://127.0.0.1/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB" --insecure | wc -c');
        const bytes = parseInt(stdout.trim());
        if (bytes > 100) { // DNS response should be substantial
            console.log('✅ DoH: Working - Got response (' + bytes + ' bytes)');
            return true;
        } else {
            console.log('❌ DoH: Response too small');
            return false;
        }
    } catch (error) {
        console.log('❌ DoH: Error -', error.message);
        return false;
    }
}

async function testRegularDNS() {
    console.log('Testing Regular DNS (UDP)...');
    try {
        console.log('Running: timeout 5 dig @127.0.0.1 google.com A +short');
        const { stdout, stderr } = await execPromise('timeout 5 dig @127.0.0.1 google.com A +short');
        console.log('stdout:', stdout.trim());
        console.log('stderr:', stderr.trim());
        if (stdout.trim()) {
            console.log('✅ Regular DNS: Working - Got response:', stdout.trim().split('\n')[0]);
            return true;
        } else {
            console.log('❌ Regular DNS: No response received');
            return false;
        }
    } catch (error) {
        console.log('❌ Regular DNS: Error -', error.message);
        return false;
    }
}

async function checkPorts() {
    console.log('Checking listening ports...');
    try {
        const { stdout } = await execPromise('ss -tlnp | grep -E "(:53 |:853 |:443 )"');
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        const ports = { 53: false, 853: false, 443: false };

        lines.forEach(line => {
            if (line.includes(':53 ')) ports[53] = true;
            if (line.includes(':853 ')) ports[853] = true;
            if (line.includes(':443 ')) ports[443] = true;
        });

        console.log(`📡 Port 53 (DNS): ${ports[53] ? '✅ Listening' : '❌ Not listening'}`);
        console.log(`🔒 Port 853 (DoT): ${ports[853] ? '✅ Listening' : '❌ Not listening'}`);
        console.log(`🔒 Port 443 (DoH): ${ports[443] ? '✅ Listening' : '❌ Not listening'}`);

        return ports;
    } catch (error) {
        console.log('❌ Error checking ports:', error.message);
        return null;
    }
}

async function runTests() {
    const ports = await checkPorts();
    console.log('');

    if (!ports) return;

    const regularDNS = await testRegularDNS();
    console.log('');

    const dot = ports[853] ? await testDoT() : false;
    console.log('');

    const doh = ports[443] ? await testDoH() : false;
    console.log('');

    console.log('====================');
    console.log('Test Summary:');
    console.log(`Regular DNS: ${regularDNS ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`DNS over TLS: ${dot ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`DNS over HTTPS: ${doh ? '✅ PASS' : '❌ FAIL'}`);
    console.log('====================');
}

runTests().catch(console.error);