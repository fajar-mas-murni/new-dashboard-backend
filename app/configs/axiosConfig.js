const axios = require("axios");
const ACUMATICA_USERNAME = process.env.ACUMATICA_USERNAME;
const ACUMATICA_PASSWORD = process.env.ACUMATICA_PASSWORD;
const ACUMATICA_BASE_URL = process.env.ACUMATICA_BASE_URL;

const axios_instance = axios.create({
    baseURL: ACUMATICA_BASE_URL,
    auth: {
        username: ACUMATICA_USERNAME,
        password: ACUMATICA_PASSWORD
    },
    headers: {
        "Content-Type": "application/json"
    },
    params: {
        "$format": "json"
    }
});

module.exports = axios_instance;