'use strict'
const { Client } = require('pg');
const fs = require('fs');

module.exports = async (event, context) => {
    const data = event.body;

    if (!data || !data.city) {
        return context.status(400).fail("Données météo manquantes ou invalides");
    }

    // 1. On lit le mot de passe depuis le secret injecté par Kubernetes
    const dbPassword = fs.readFileSync('/var/openfaas/secrets/db-password', 'utf-8').trim();

    // 2. On configure le client avec ce mot de passe sécurisé
    const client = new Client({
        host: 'postgres-db',
        port: 5432,
        user: 'postgres',
        password: dbPassword, 
        database: 'meteo_db'
    });

    try {
        await client.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS weather_history (
                id SERIAL PRIMARY KEY,
                city VARCHAR(50),
                temperature VARCHAR(10),
                description VARCHAR(100),
                humidity VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const insertQuery = 'INSERT INTO weather_history(city, temperature, description, humidity) VALUES($1, $2, $3, $4)';
        const values = [data.city, data.temperature, data.description, data.humidity];
        await client.query(insertQuery, values);

        await client.end();

        return context.status(200).succeed({
            status: "success",
            message: `Météo de ${data.city} sauvegardée dans PostgreSQL !`
        });

    } catch (error) {
        return context.status(500).fail("Erreur BDD : " + error.message);
    }
}