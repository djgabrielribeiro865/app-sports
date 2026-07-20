// Insere as tags de PWA (manifesto, ícone iOS, etc.) no dist/index.html gerado
// pelo `expo export`.
//
// Por quê: o app.json usa web.output = "single" (necessário pro Supabase
// funcionar na web — ver notas do projeto). Nesse modo o Expo Router NÃO usa
// o arquivo src/app/+html.tsx pra customizar o HTML raiz (isso só funciona
// com web.output = "static"), então precisamos injetar essas tags depois do
// build, direto no HTML já gerado. Sem essas tags, o navegador não reconhece
// o app como instalável e só oferece "criar atalho".
//
// Rodar depois de `npx expo export -p web` (veja .github/workflows/deploy.yml).

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('Tags de PWA já presentes, nada a fazer.');
  process.exit(0);
}

const tags = [
  '<link rel="manifest" href="manifest.json" />',
  '<meta name="theme-color" content="#208AEF" />',
  '<link rel="apple-touch-icon" href="icons/icon-192.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-title" content="Runner" />',
].join('\n  ');

const novoHtml = html.replace('</head>', `  ${tags}\n</head>`);

if (novoHtml === html) {
  throw new Error('Não encontrei </head> em dist/index.html — build pode ter mudado de formato.');
}

fs.writeFileSync(indexPath, novoHtml);
console.log('Tags de PWA inseridas em dist/index.html.');
