const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, 'oh_futuro_magazine_dashboard.html');
console.log('Validando arquivo:', htmlPath);

if (!fs.existsSync(htmlPath)) {
  console.error('ERRO: Arquivo não encontrado!');
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1. Verificar elementos DOM estruturais essenciais
const requiredElements = [
  'id="login-screen"',
  'id="main-screen"',
  'id="profile-screen"',
  'id="tips-screen"',
  'id="cms-screen"',
  'id="active-filter-badge"',
  'id="clear-filter-btn"',
  'id="prof-age"',
  'id="prof-insta"',
  'id="profile-days"'
];

console.log('\n--- Verificando Elementos Estruturais do DOM ---');
let domErrors = 0;
requiredElements.forEach(el => {
  if (htmlContent.includes(el)) {
    console.log(`[OK] Elemento encontrado: ${el}`);
  } else {
    console.error(`[ERRO] Elemento ausente: ${el}`);
    domErrors++;
  }
});

// 2. Extrair e verificar sintaxe do JavaScript
console.log('\n--- Extraindo e Validando JavaScript ---');
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let jsCode = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  jsCode += match[1] + '\n';
}

if (!jsCode.trim()) {
  console.error('[ERRO] Nenhum código JavaScript encontrado!');
  process.exit(1);
}

try {
  // Simular um ambiente mínimo do browser para rodar a inicialização do script sem quebrar por referências a objetos globais do browser
  const sandbox = {
    document: {
      getElementById: () => ({ textContent: '', value: '', style: {}, innerHTML: '', addEventListener: () => {} }),
      querySelectorAll: () => ({
        forEach: (cb) => { cb({ addEventListener: () => {} }); }
      }),
      createElement: () => ({ className: '', innerHTML: '', appendChild: () => {}, style: {} }),
      body: { appendChild: () => {}, removeChild: () => {} }
    },
    window: {
      scrollTo: () => {},
      parent: null,
      open: () => {},
      isSecureContext: true
    },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve()
      }
    },
    console: console,
    Math: Math,
    Array: Array,
    encodeURIComponent: encodeURIComponent,
    setTimeout: setTimeout,
    setInterval: setInterval
  };
  
  sandbox.window.parent = sandbox.window;
  
  vm.createContext(sandbox);
  vm.runInContext(jsCode, sandbox);
  console.log('[OK] Sintaxe JavaScript válida e compilada com sucesso no Sandbox!');
} catch (err) {
  console.error('[ERRO] Falha na compilação do JavaScript:', err);
  process.exit(1);
}

if (domErrors > 0) {
  console.error(`\n[FALHA] Validação concluída com ${domErrors} erros de DOM.`);
  process.exit(1);
} else {
  console.log('\n[SUCESSO] Todas as validações passaram! 🎉');
}
