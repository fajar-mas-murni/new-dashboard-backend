const sql = require('mssql');

let poolPromise;

function parseDatabaseUrl(url) {
    const cleanUrl = url.replace(/^sqlserver:\/\//, '');
    const firstSemicolon = cleanUrl.indexOf(';');
    let hostPart = cleanUrl;
    let optionsPart = '';
    if (firstSemicolon !== -1) {
        hostPart = cleanUrl.substring(0, firstSemicolon);
        optionsPart = cleanUrl.substring(firstSemicolon + 1);
    }

    const hostParts = hostPart.split('\\');
    const server = hostParts[0];
    const instanceName = hostParts[1] || null;

    const config = {
        server: server,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    if (instanceName) {
        config.options.instanceName = instanceName;
    }

    const pairs = optionsPart.split(';');
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (!key || !value) return;
        const cleanKey = key.trim();
        const cleanValue = value.trim();

        if (cleanKey === 'database') {
            config.database = cleanValue;
        } else if (cleanKey === 'user') {
            config.user = cleanValue;
        } else if (cleanKey === 'password') {
            config.password = cleanValue;
        } else if (cleanKey === 'encrypt') {
            config.options.encrypt = cleanValue === 'true';
        } else if (cleanKey === 'trustServerCertificate') {
            config.options.trustServerCertificate = cleanValue === 'true';
        }
    });

    return config;
}

function connectDB() {
    if (!poolPromise) {
        const connectionString = process.env.DATABASE_URL;

        console.log(connectionString, 123);

        if (!connectionString) {
            console.error('Error: DATABASE_URL tidak ditemukan di file .env');
            process.exit(1);
        }

        const config = parseDatabaseUrl(connectionString);

        poolPromise = sql.connect(config)
            .then(pool => {
                console.log('Berhasil terhubung ke SQL Server.');
                return pool;
            })
            .catch(err => {
                console.error('Koneksi database gagal: ', err);
                poolPromise = null;
                throw err;
            });
    }

    return poolPromise;
}

module.exports = { connectDB, sql };