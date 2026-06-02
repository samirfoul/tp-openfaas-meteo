'use strict'
const axios = require('axios');

module.exports = async (event, context) => {
  const city = event.body && event.body.city ? event.body.city : 'Grenoble';
  const url = `https://wttr.in/${city}?format=j1`;

  try {
    // 1. Récupération des données depuis l'API externe
    const response = await axios.get(url);
    const currentCondition = response.data.current_condition[0];

    const weatherData = {
      city: city,
      temperature: currentCondition.temp_C,
      description: currentCondition.weatherDesc[0].value,
      humidity: currentCondition.humidity
    };

    // 2. WORKFLOW : On envoie directement la donnée à la fonction 2 (store-weather)
    // L'URL 'gateway.openfaas:8080' est l'adresse interne d'OpenFaaS dans Kubernetes
    await axios.post('http://gateway.openfaas:8080/function/store-weather', weatherData);

    // 3. On répond à l'utilisateur que tout s'est bien passé
    return context
      .status(200)
      .headers({ "Content-Type": "application/json" })
      .succeed({
        message: `Météo de ${city} récupérée et sauvegardée avec succès !`,
        data: weatherData
      });

  } catch (error) {
    return context
      .status(500)
      .fail("Erreur dans le workflow : " + error.message);
  }
}