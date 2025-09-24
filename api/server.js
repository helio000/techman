// server.js
const express = require('express');
const app = express();
const port = 3000;

// Servindo arquivos estáticos da pasta "web"
app.use(express.static('web'));

// Definindo uma rota simples
app.get('/', (req, res) => {
  res.send('Servidor está rodando!');
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
