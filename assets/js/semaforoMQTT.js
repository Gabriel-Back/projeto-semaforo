/* ================================================================
   SEMAFORO MQTT — lógica completa do simulador de semáforo.
   Arquivo externo, referenciado pela página:
     application/simulador/index.html
   ================================================================ */

/* ================================================================
   1. CONFIGURAÇÕES
   É aqui que se troca o broker, a porta e o tópico, se preciso.
   ================================================================ */
const BROKER_HOST = "localhost";                    // mesmo host do Mosquitto no Docker
const BROKER_PORT = 8000;                           // porta WEBSOCKET do broker
const TOPICO = "semaforo/estado";              // tópico usado no MQTTX
const CLIENT_ID = "semaforo-web-" + Math.floor(Math.random() * 10000); // id único

/* ================================================================
   2. ESTADO DO SEMÁFORO   (TUDO em SEGUNDOS)
   O semáforo nasce em "parado". Para sair dele é só enviar
   o comando  "iniciar"  pelo MQTTX.
   ================================================================ */
let tempoVermelho = 3;   // segundos de luz vermelha
let tempoAmarelo = 1;   // segundos de luz amarela
let tempoVerde = 3;   // segundos de luz verde

let rodando = false;   // há um loop executando agora?
let idLoop = 0;       // "número" do loop atual (serve para cancelar o anterior)
let modoAtual = "parado";// "parado" | "ciclo" | "intermitente"

/* ================================================================
   3. CONTROLE DAS LUZES  (funções diretas no HTML)
   ================================================================ */

// Escreve texto num elemento, SEM quebrar se o elemento não existir.
// (Se o HTML mudar e faltar um span, a página continua funcionando.)
function definirTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function desligarTodas() {
  document.getElementById("luzVermelho").classList.remove("ligado");
  document.getElementById("luzAmarelo").classList.remove("ligado");
  document.getElementById("luzVerde").classList.remove("ligado");
}

function ligarApenas(idLuz) {
  desligarTodas();
  document.getElementById(idLuz).classList.add("ligado");
}

// setTimeout trabalha em milissegundos; aqui o código todo fala em segundos.
function esperar(segundos) {
  return new Promise(ok => setTimeout(ok, segundos * 1000));
}

/* ================================================================
   4. MÁQUINA DE ESTADOS
   Cada bloco "ESTADO X" é a regra daquele estado. Para mudar uma
   regra na apresentação, o lugar é exatamente dentro desses blocos.
   ================================================================ */

// Desliga tudo e cancela qualquer execução anterior.
function pararSemaforo() {
  idLoop++;               // aumenta o número: burla todos os loops pendentes
  rodando = false;
  modoAtual = "parado";
  desligarTodas();
}

// -------- CICLO NORMAL: VERMELHO -> VERDE -> AMARELO -> repete --------
async function iniciarCiclo() {
  pararSemaforo();        // encerra o que estava rodando (ciclo ou pisca)
  rodando = true;
  modoAtual = "ciclo";
  const meuLoop = ++idLoop;   // este loop recebe um número exclusivo

  while (rodando && idLoop === meuLoop) {   // roda até mandarem "parar"

    // ---------- ESTADO 1: VERMELHO ----------
    ligarApenas("luzVermelho");
    await esperar(tempoVermelho);
    if (idLoop !== meuLoop) return;        // foi parado no meio? sai já

    // ---------- ESTADO 2: VERDE ----------
    ligarApenas("luzVerde");
    await esperar(tempoVerde);
    if (idLoop !== meuLoop) return;

    // ---------- ESTADO 3: AMARELO ----------
    ligarApenas("luzAmarelo");
    await esperar(tempoAmarelo);
    // fim do ciclo -> o while volta para o VERMELHO
  }
}

// -------- MODO INTERMITENTE: amarelo piscando (1s aceso / 1s apagado) --------
async function modoIntermitente() {
  pararSemaforo();        // encerra o que estava rodando
  rodando = true;
  modoAtual = "intermitente";
  const meuLoop = ++idLoop;

  while (rodando && idLoop === meuLoop) {
    ligarApenas("luzAmarelo");           // acende
    await esperar(1);
    if (idLoop !== meuLoop) return;

    desligarTodas();                     // apaga
    await esperar(1);
  }
}

/* ================================================================
   5. PARSER DOS COMANDOS  (texto simples vindo do MQTTX)
   ================================================================ */

// Prepara a mensagem recebida para o switch de comandos:
//  - tira espaços/acentos de fora (trim)
//  - aceita JSON antigo:  {"msg": "iniciar"}  ->  "iniciar"
//  - aceita texto com aspas:  "iniciar"  ->  iniciar
//  - ignora CAIXA ALTA:  INICIAR  ->  iniciar
function normalizarMensagem(texto) {
  let msg = texto.trim();

  if (msg.startsWith("{")) {              // era JSON no sistema antigo?
    try {
      msg = JSON.parse(msg).msg || "";
    } catch (erro) {
      msg = "";                           // JSON inválido: não é comando
    }
  }

  msg = msg.replace(/^['"]+/, "").replace(/['"]+$/, "");  // remove aspas sobrando
  return msg.trim().toLowerCase();
}

// Extrai o número depois do "=" de um comando de tempo.
// Ex.: "tempoVermelho = 2"  ->  2    (espaços ao redor do "=" não atrapalham)
function lerSegundos(comando) {
  const partes = comando.split("=");       // ["tempoVermelho ", " 2"]
  const valor = parseInt(partes[1], 10);  // parseInt ignora os espaços sobrando
  return isNaN(valor) ? null : valor;      // devolve null se não for número
}

function processarComando(payload) {
  const comando = normalizarMensagem(payload);

  // ---------- COMANDOS SIMPLES (sem "=") ----------
  switch (comando) {
    case "iniciar": iniciarCiclo(); break;
    case "parar": pararSemaforo(); break;
    case "ligarintermitente": modoIntermitente(); break;
  }

  // ---------- COMANDOS DE TEMPO (possuem "=") ----------
  if (comando.includes("=")) {
    const nome = comando.split("=")[0].trim();   // "tempovermelho" (sem espaços)
    const tempo = lerSegundos(comando);

    switch (nome) {
      case "tempovermelho": if (tempo !== null) tempoVermelho = tempo; break;
      case "tempoamarelo": if (tempo !== null) tempoAmarelo = tempo; break;
      case "tempoverde": if (tempo !== null) tempoVerde = tempo; break;
    }
  }

  refrescarPainel(comando);   // atualiza a barra de status
}

/* ================================================================
   6. MQTT — conexão com o broker e chegada das mensagens
   ================================================================ */
const client = new Paho.Client(BROKER_HOST, BROKER_PORT, CLIENT_ID);
client.onConnectionLost = aoPerderConexao;   // chamado se a conexão cair
client.onMessageArrived = aoReceberMensagem; // chamado ao chegar mensagem

conectar();

function conectar() {
  if (client.isConnected()) return;          // já estamos conectados
  client.connect({
    onSuccess: aoConectar,
    onFailure: e => console.log("Falha na conexão:", e.errorMessage),
  });
}

function aoConectar() {
  client.subscribe(TOPICO);                 // passa a ouvir o tópico do MQTTX
  definirTexto("statusConexao", "Conectado ao broker");
}

function aoPerderConexao(resposta) {
  if (resposta.errorCode !== 0) {
    console.log("Conexão perdida:", resposta.errorMessage);
  }
  definirTexto("statusConexao", "Desconectado — reconectando...");
}

function aoReceberMensagem(mensagem) {
  const payload = mensagem.payloadString;
  console.log("Mensagem recebida:", payload);
  definirTexto("infoBruto", "Recebido: " + payload);
  processarComando(payload);                      // toca o parser da seção 5
}

// Tenta reconectar sozinho a cada 3s (útil se o Docker subir depois da página).
setInterval(conectar, 3000);

/* ================================================================
   7. BARRA DE STATUS (só leitura, apenas reflete o estado atual)
   ================================================================ */
function refrescarPainel(ultimoComando) {
  definirTexto("infoModo", "Modo: " + modoAtual);
  definirTexto("infoTempos",
    "V=" + tempoVermelho + "s &#183; A=" + tempoAmarelo + "s &#183; G=" + tempoVerde + "s");
  if (ultimoComando) {
    definirTexto("infoComando", "Último comando: " + ultimoComando);
  }
}

refrescarPainel(); // mostra os tempos padrão assim que a página abre

/* ================================================================
   8. DIAGNÓSTICO: contador de recarregamentos
   Se este número subir sem ninguém apertar F5, a página está sendo
   recarregada por uma ferramenta/EXTENSÃO externa — não pelo código.
   (sessionStorage sobrevive ao reload da própria aba.)
   ================================================================ */
const qtdRecarregamentos = (Number(sessionStorage.getItem("sfRecarregamentos")) || 0) + 1;
sessionStorage.setItem("sfRecarregamentos", String(qtdRecarregamentos));
definirTexto("infoReload", "Recarregamentos: " + qtdRecarregamentos);
