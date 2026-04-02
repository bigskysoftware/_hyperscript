/**
 * Hyperscript VS Code Extension
 * Thin client that launches the hyperscript LSP server.
 */
const path = require('path');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');

let client;

function activate(context) {
  const serverModule = path.join(__dirname, '..', 'lsp', 'server.js');

  const serverOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  const clientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'html' },
      { scheme: 'file', language: 'hyperscript' },
    ],
  };

  client = new LanguageClient(
    'hyperscriptLSP',
    'Hyperscript Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
}

function deactivate() {
  if (client) return client.stop();
}

module.exports = { activate, deactivate };
