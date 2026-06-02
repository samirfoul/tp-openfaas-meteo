#!/bin/bash

echo "=========================================="
echo "🌦️  Lancement du test Serverless Météo"
echo "=========================================="

# Liste de 10 villes pour la démonstration
VILLES=("Grenoble" "Paris" "London" "Tokyo" "Madrid" "New York" "Berlin" "Rome" "Sydney" "Dubai")

echo "1️⃣  Envoi des requêtes à fetch-weather..."
for VILLE in "${VILLES[@]}"; do
    echo "- Récupération de la météo pour $VILLE..."
    curl -s -X POST http://127.0.0.1:8080/function/fetch-weather \
         -H "Content-Type: application/json" \
         -d "{\"city\": \"$VILLE\"}" > /dev/null
    sleep 1 # Petite pause pour laisser le temps à l'API de répondre
done

echo ""
echo "2️⃣  Génération et téléchargement du rapport PDF..."
curl -s -o rapport_meteo_final.pdf http://127.0.0.1:8080/function/get-history

echo "✅ Succès ! Le fichier 'rapport_meteo_final.pdf' a été généré."
echo "👉 Tape 'open rapport_meteo_final.pdf' pour le visualiser."