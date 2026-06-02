'use strict'
const { Client } = require('pg');
const fs = require('fs');
const PDFDocument = require('pdfkit');

module.exports = async (event, context) => {
    const dbPassword = fs.readFileSync('/var/openfaas/secrets/db-password', 'utf-8').trim();

    const client = new Client({
        host: 'postgres-db',
        port: 5432,
        user: 'postgres',
        password: dbPassword,
        database: 'meteo_db'
    });

    try {
        await client.connect();
        // On récupère les 10 dernières recherches météo
        const res = await client.query('SELECT * FROM weather_history ORDER BY created_at DESC LIMIT 10');
        await client.end();

        // Création du document PDF
        const doc = new PDFDocument();
        let buffers = [];
        
        // On capture les données du PDF généré
        doc.on('data', buffers.push.bind(buffers));
        
        return new Promise((resolve) => {
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                
                // On renvoie le PDF avec les bons en-têtes de téléchargement
                resolve(context
                    .status(200)
                    .headers({
                        "Content-Type": "application/pdf",
                        "Content-Disposition": 'attachment; filename="rapport_meteo.pdf"'
                    })
                    .succeed(pdfData));
            });

            // --- MISE EN PAGE DU PDF ---
            doc.fontSize(24).fillColor('#2c3e50').text('Rapport Météo Serverless', { align: 'center' });
            doc.moveDown(2);

            if (res.rows.length === 0) {
                doc.fontSize(14).text("Aucun historique disponible.");
            } else {
                res.rows.forEach(row => {
                    const date = new Date(row.created_at).toLocaleString('fr-FR');
                    doc.fontSize(14).fillColor('#2980b9').text(`Ville: ${row.city} (${row.temperature}°C)`);
                    doc.fontSize(12).fillColor('#000000').text(`Description: ${row.description}`);
                    doc.fontSize(10).fillColor('#7f8c8d').text(`Date: ${date} - Humidité: ${row.humidity}%`);
                    doc.moveDown();
                });
            }

            // Fin de la rédaction du PDF
            doc.end();
        });

    } catch (error) {
        return context.status(500).fail("Erreur de génération PDF : " + error.message);
    }
}