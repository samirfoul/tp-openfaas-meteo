# 🌦️ TP OpenFaaS - Générateur de Rapport Météo Serverless

## 🎯 Objectif de l'application
Cette application serverless permet de récupérer la météo en temps réel de n'importe quelle ville, de l'enregistrer de manière persistante, et de générer un rapport PDF dynamique des dernières recherches. 

Elle valide entièrement les critères d'architecture en micro-fonctions communicantes, d'utilisation de base de données, et de sécurisation par secrets.

## 🏗️ Architecture et Fonctions

L'application est composée de 3 fonctions OpenFaaS écrites en Node.js (Node 22 LTS) :

1. **`fetch-weather`** (La source) :
   - Reçoit une ville en paramètre HTTP (POST).
   - Interroge l'API publique externe `wttr.in`.
   - **Interfonctionnalité (Workflow)** : Appelle automatiquement la fonction `store-weather` pour sauvegarder le résultat.
   - **Auto-scaling** : Configurée pour monter jusqu'à 5 réplicas en cas de forte charge.

2. **`store-weather`** (La persistance) :
   - Reçoit les données formatées de la fonction 1.
   - Se connecte à une base de données PostgreSQL hébergée sur le cluster Kubernetes.
   - Insère les données dans la table `weather_history`.
   - **Sécurité** : Utilise le secret OpenFaaS `db-password` pour s'authentifier.

3. **`get-history`** (L'export) :
   - Se connecte à PostgreSQL de manière sécurisée.
   - Récupère les 10 dernières recherches météo.
   - Utilise `PDFKit` pour générer un fichier PDF mis en page.
   - Renvoie le flux binaire directement téléchargeable par l'utilisateur.

## ⚙️ Dépendances
- **Base de données :** PostgreSQL 15 (Pod autonome dans l'espace `openfaas-fn`).
- **API Externe :** `wttr.in` (météo publique sans authentification).
- **Packages Node.js :** `axios` (appels HTTP), `pg` (client Postgres), `pdfkit` (génération PDF).

## 🚀 Étapes de déploiement

1. **Préparation de la base de données :**
   ```bash
   kubectl apply -f postgres-simple.yaml