// Configuração dinâmica do Expo.
// Ela lê o app.json (recebido em `config`) e adiciona o "caminho base"
// APENAS quando estamos publicando no GitHub Pages (variável EXPO_BASE_URL).
// No desenvolvimento local a variável não existe, então o app continua na raiz
// (http://localhost:8081), sem subpasta.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
