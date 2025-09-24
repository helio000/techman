// Importando as dependências
const express = require('express');
const session = require('express-session');
const { LocalStorage } = require('node-localstorage');

// Criando a instância do Express e configurando o servidor
const app = express();
const port = 3000;

// Usando express-session para gerenciar as sessões
app.use(session({
  secret: 'techman_secret',  // Uma chave secreta para a sessão
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Usar "true" se for em um ambiente HTTPS
}));

// Usando o node-localstorage para persistir dados no servidor
const localStorage = new LocalStorage('./localStorage'); // Diretório onde os dados serão salvos

// Definindo a chave do localStorage
const STORAGE_KEY = 'techman_data_v1';

// Verificando se os dados já existem no localStorage, caso contrário, criando-os
if (!localStorage.getItem(STORAGE_KEY)) {
  const data = {
    perfis: [
      { id: 1, nome: 'Administrador' },
      { id: 2, nome: 'Técnico' },
      { id: 3, nome: 'Gerente' }
    ],
    usuarios: [
      { id: 1, nome: 'Admin Teste', email: 'admin@techman.local', perfilId: 1 }
    ],
    equipamentos: [],
    comentarios: [],
    nextId: { equipamento: 1, comentario: 1 }
  };

  // Simulando os equipamentos em CSV
  const csvEquipamentos = `
id;equipamento;imagem;descricao;ativo;data
1;Torno Mecçnico 500mm Modelo BV20L 220V - TTM520 - Tander;Torno_Mecanico_500mm.png;"Descrição do equipamento";1;2019-10-01 15:00:20.873
2;Processador Intel Core i9-7920X Skylake;Intel_Core_i9.png;"Descrição do processador";1;2019-10-01 15:00:20.873
`;

  // Função para converter o CSV em objeto
  function parseCSV(csv, delimiter = ';') {
    const lines = [];
    let currentLine = [];
    let inQuotes = false;
    let field = '';
    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const nextChar = csv[i + 1];
      if (char === '"' && csv[i - 1] !== '\\') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && char === delimiter) {
        currentLine.push(field);
        field = '';
        continue;
      }
      if (!inQuotes && (char === '\n' || (char === '\r' && nextChar === '\n'))) {
        currentLine.push(field);
        lines.push(currentLine);
        currentLine = [];
        field = '';
        if (char === '\r') i++;
        continue;
      }
      field += char;
    }
    if (field) currentLine.push(field);
    if (currentLine.length) lines.push(currentLine);

    const headers = lines.shift();
    return lines.map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  }

  // Adicionando equipamentos no localStorage
  data.equipamentos = parseCSV(csvEquipamentos)
    .map(e => ({
      id: Number(e.id),
      nome: e.equipamento,
      imagemUrl: e.imagem,
      descricao: e.descricao,
      ativo: e.ativo === '1',
      dataInclusao: e.data
    }));

  data.nextId.equipamento = data.equipamentos.length + 1;

  // Salvando os dados no localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}

// Middleware para verificar a sessão do usuário
app.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
});

// Rota para login (apenas como exemplo)
app.get('/login', (req, res) => {
  // Simulando um login (o nome do usuário é configurado na sessão)
  req.session.user = { id: 1, nome: 'Admin Teste' };
  res.redirect('/');
});

// Rota para a página principal
app.get('/', (req, res) => {
  // Recuperando os dados do localStorage
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const user = req.session.user;

  // Renderizando a resposta
  res.send(`
    <h1>Bem-vindo, ${user.nome}</h1>
    <p>Equipamentos disponíveis:</p>
    <ul>
      ${data.equipamentos.map(equip => `<li>${equip.nome}</li>`).join('')}
    </ul>
    <a href="/logout">Sair</a>
  `);
});

// Rota para logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
