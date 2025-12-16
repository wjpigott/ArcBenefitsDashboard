#!/usr/bin/env node
/**
 * Generate config.js from environment variables
 * This runs during Azure Static Web Apps build process
 */

const fs = require('fs');

const clientId = process.env.AZURE_CLIENT_ID || '';
const tenantId = process.env.AZURE_TENANT_ID || '';

const configContent = `// Auto-generated configuration file
// DO NOT COMMIT THIS FILE - it's generated during deployment

window.AZURE_CONFIG = {
    CLIENT_ID: '${clientId}',
    TENANT_ID: '${tenantId}',
    AUTO_INIT: true
};
`;

fs.writeFileSync('config.js', configContent, 'utf8');

console.log('✓ Generated config.js with:');
console.log(`  CLIENT_ID: ${clientId ? clientId.substring(0, 8) + '...' : '(empty)'}`);
console.log(`  TENANT_ID: ${tenantId ? tenantId.substring(0, 8) + '...' : '(empty)'}`);
