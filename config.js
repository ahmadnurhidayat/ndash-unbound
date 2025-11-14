module.exports = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },

    // Unbound Configuration
    unbound: {
        confPath: process.env.UNBOUND_CONF_PATH || '/etc/unbound/unbound.conf',
        localZonesPath: process.env.UNBOUND_ZONES_PATH || '/etc/unbound/local.d',
        controlCommand: 'unbound-control',
        checkCommand: 'unbound-checkconf',
        reloadCommand: 'unbound-control reload',
        includesDir: '/etc/unbound/local.d'
    },

    // Session Configuration
    session: {
        secret: process.env.SESSION_SECRET || 'ndash-secret-key-change-in-production',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    },

    // Default DNS Settings
    dns: {
        defaultTTL: 3600,
        defaultRefresh: 86400,
        defaultRetry: 7200,
        defaultExpire: 3600000,
        defaultMinimum: 86400,
        supportedRecordTypes: [
            'A', 'AAAA', 'CNAME', 'MX', 'TXT', 
            'NS', 'PTR', 'SRV', 'SOA', 'CAA'
        ]
    },

    // UI Settings
    ui: {
        itemsPerPage: 20,
        dateFormat: 'DD MMM YYYY, HH:mm',
        timezone: 'Asia/Jakarta'
    }
};
