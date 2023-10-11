const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;

const server = express();
const port = 3000;

// Инициализация базы данных SQLite
const db = new sqlite3.Database(path.join(__dirname, 'snippets.db'), (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

// Создание таблицы snippets (если ее нет)
const createTable = () => {
  const createSnippetsTable = `
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT,
      description TEXT,
      snippet TEXT
    );
  `;

  db.run(createSnippetsTable);
};

createTable();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.post('/saveSnippet', (req, res) => {
  const { language, description, snippet } = req.body;

  const insert = 'INSERT INTO snippets (language, description, snippet) VALUES (?, ?, ?)';
  db.run(insert, [language, description, snippet], function(err) {
    if (err) {
      return res.status(500).send({ status: 'error', message: 'Error saving snippet' });
    }
    res.send({ status: 'success', message: 'Snippet saved!', id: this.lastID });
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('quit', () => {
  db.close();
});
