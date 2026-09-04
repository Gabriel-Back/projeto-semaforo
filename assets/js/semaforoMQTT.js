/*  Configuração do broker */
const HOST_BROKER = "localhost";
const PORTA_BROKER = 8000;
const TOPICO_ESTADO = "semaforo/estado";
const ID_CLIENTE = "semaforo-web-" + Math.floor(Math.random() * 10000);

/* Comandos e modos  */
const COMANDO_INICIAR = "iniciar";
const COMANDO_PARAR = "parar";
const COMANDO_INTERMITENTE = "ligarintermitente";
const MODO_PARADO = "parado";
const MODO_CICLO = "ciclo";
const MODO_INTERMITENTE = "intermitente";

const TEMPO_PISCA_AMARELO = 1;
const INTERVALO_RECONEXAO_MS = 3000;
const TEMPOS_PADRAO = { vermelho: 3, amarelo: 1, verde: 3 };

/* ---------- 3) Estado atual do semáforo (tempos em segundos) ---------- */
let tempoVermelho = TEMPOS_PADRAO.vermelho;
let tempoAmarelo = TEMPOS_PADRAO.amarelo;
let tempoVerde = TEMPOS_PADRAO.verde;

let semaforoEmExecucao = false;
let idExecucaoCorrente = 0;
let modoAtual = MODO_PARADO;

/* ---------- 4) Controle das luzes ---------- */

// Atualiza o texto de um elemento sem quebrar se ele não existir.
function definirTextoNoElemento(idDoElemento, texto) {
  const elemento = document.getElementById(idDoElemento);
  if (elemento) elemento.textContent = texto;
}

function desligarTodasAsLuzes() {
  desligarLuz("luzVermelho");
  desligarLuz("luzAmarelo");
  desligarLuz("luzVerde");
}

function desligarLuz(idDaLuz) {
  document.getElementById(idDaLuz).classList.remove("ligado");
}

// Liga apenas a luz indicada, apagando as demais.
function acenderSomenteLuz(idDaLuz) {
  desligarTodasAsLuzes();
  document.getElementById(idDaLuz).classList.add("ligado");
}

// setTimeout usa milissegundos; aqui o código fala em segundos.
function aguardarSegundos(segundos) {
  return new Promise(resolver => setTimeout(resolver, segundos * 1000));
}

/* ---------- 5) Máquina de estados ---------- */

// Desliga tudo e cancela qualquer execução pendente.
function pararSemaforo() {
  idExecucaoCorrente++;  // invalida os loops pendentes
  semaforoEmExecucao = false;
  modoAtual = MODO_PARADO;
  desligarTodasAsLuzes();
}

// Acende a luz, aguarda o tempo e informa se o loop continua válido.
async function executarFase(idDaLuz, tempoEmSegundos, idDoLoop) {
  acenderSomenteLuz(idDaLuz);
  await aguardarSegundos(tempoEmSegundos);
  return idExecucaoCorrente === idDoLoop;
}

// Ciclo normal: vermelho -> verde -> amarelo (repete).
async function iniciarCiclo() {
  pararSemaforo();
  semaforoEmExecucao = true;
  modoAtual = MODO_CICLO;
  const idDesteLoop = ++idExecucaoCorrente;

  while (semaforoEmExecucao && idExecucaoCorrente === idDesteLoop) {
    if (!(await executarFase("luzVermelho", tempoVermelho, idDesteLoop))) break;
    if (!(await executarFase("luzVerde", tempoVerde, idDesteLoop))) break;
    if (!(await executarFase("luzAmarelo", tempoAmarelo, idDesteLoop))) break;
  }
}

// Modo intermitente: amarelo piscando (1s aceso / 1s apagado).
async function iniciarModoIntermitente() {
  pararSemaforo();
  semaforoEmExecucao = true;
  modoAtual = MODO_INTERMITENTE;
  const idDesteLoop = ++idExecucaoCorrente;

  while (semaforoEmExecucao && idExecucaoCorrente === idDesteLoop) {
    if (!(await executarFase("luzAmarelo", TEMPO_PISCA_AMARELO, idDesteLoop))) break;
    desligarTodasAsLuzes();
    await aguardarSegundos(TEMPO_PISCA_AMARELO);
    if (idExecucaoCorrente !== idDesteLoop) break;
  }
}

/* ---------- 6) Interpretação dos comandos (texto do MQTTX) ---------- */

// Normaliza a mensagem em um comando minúsculo e sem aspas.
// Aceita: "iniciar", '"iniciar"', '{"msg":"iniciar"}', "INICIAR".
function obterComandoDaMensagem(mensagemBruta) {
  let comando = mensagemBruta.trim();

  if (comando.startsWith("{")) {  // era JSON no sistema antigo?
    comando = extrairMensagemDoJson(comando);
  }

  comando = removerAspas(comando);
  return comando.trim().toLowerCase();
}

// Extrai o campo "msg" de um comando em formato JSON.
function extrairMensagemDoJson(comandoEmJson) {
  try {
    return JSON.parse(comandoEmJson).msg || "";
  } catch {
    return "";  // JSON inválido não é um comando
  }
}

// Remove aspas simples/duplas nas extremidades do texto.
function removerAspas(texto) {
  return texto.replace(/^['"]+/, "").replace(/['"]+$/, "");
}

// Pega o número depois do "=" (ex.: "tempovermelho= 2" -> 2).
function extrairTempoDoComando(comando) {
  const partes = comando.split("=");
  const valor = parseInt(partes[1], 10);
  return Number.isNaN(valor) ? null : valor;
}

// Executa os comandos simples (sem "=").
function executarComandoSimples(comando) {
  switch (comando) {
    case COMANDO_INICIAR:
      iniciarCiclo();
      break;
    case COMANDO_PARAR:
      pararSemaforo();
      break;
    case COMANDO_INTERMITENTE:
      iniciarModoIntermitente();
      break;
  }
}

// Aplica comandos de tempo do tipo "tempovermelho=5".
function executarComandoDeTempo(comando) {
  const nomeDoCampo = comando.split("=")[0].trim();
  const novoTempo = extrairTempoDoComando(comando);
  if (novoTempo === null) return;

  switch (nomeDoCampo) {
    case "tempovermelho":
      tempoVermelho = novoTempo;
      break;
    case "tempoamarelo":
      tempoAmarelo = novoTempo;
      break;
    case "tempoverde":
      tempoVerde = novoTempo;
      break;
  }
}

// Roteia a mensagem recebida para o comando correspondente.
function processarMensagemRecebida(payload) {
  const comando = obterComandoDaMensagem(payload);

  executarComandoSimples(comando);

  if (comando.includes("=")) {
    executarComandoDeTempo(comando);
  }

  atualizarPainelDeStatus(comando);
}

/* ---------- 7) MQTT: conexão e recebimento de mensagens ---------- */
const clienteMqtt = new Paho.Client(HOST_BROKER, PORTA_BROKER, ID_CLIENTE);
clienteMqtt.onConnectionLost = aoPerderConexao;
clienteMqtt.onMessageArrived = aoReceberMensagem;

conectarAoBroker();

// Estabelece a conexão com o broker, se ainda não estiver conectado.
function conectarAoBroker() {
  if (clienteMqtt.isConnected()) return;
  clienteMqtt.connect({
    onSuccess: aoConectar,
    onFailure: erro => console.log("Falha na conexão:", erro.errorMessage),
  });
}

// Chamado quando a conexão é estabelecida com sucesso.
function aoConectar() {
  clienteMqtt.subscribe(TOPICO_ESTADO);
  definirTextoNoElemento("statusConexao", "Conectado ao broker");
}

// Chamado quando a conexão com o broker é perdida.
function aoPerderConexao(resposta) {
  if (resposta.errorCode !== 0) {
    console.log("Conexão perdida:", resposta.errorMessage);
  }
  definirTextoNoElemento("statusConexao", "Desconectado — reconectando...");
}

// Chamado a cada mensagem recebida no tópico MQTT.
function aoReceberMensagem(mensagem) {
  const payload = mensagem.payloadString;
  console.log("Mensagem recebida:", payload);
  definirTextoNoElemento("infoBruto", "Recebido: " + payload);
  processarMensagemRecebida(payload);
}

// Reconecta sozinho a cada poucos segundos (caso o Docker suba depois).
setInterval(conectarAoBroker, INTERVALO_RECONEXAO_MS);

/* ---------- 8) Barra de status (só leitura) ---------- */
function atualizarPainelDeStatus(ultimoComando) {
  definirTextoNoElemento("infoModo", "Modo: " + modoAtual);
  definirTextoNoElemento(
    "infoTempos",
    "V=" + tempoVermelho + "s · A=" + tempoAmarelo + "s · G=" + tempoVerde + "s"
  );

  if (ultimoComando) {
    definirTextoNoElemento("infoComando", "Último comando: " + ultimoComando);
  }
}

atualizarPainelDeStatus();  // mostra os tempos padrão ao abrir a página

/* ---------- 9) Contador de recarregamentos (diagnóstico) ---------- */
// Se o número subir sem ninguém apertar F5, a página está sendo recarregada
// por uma ferramenta/extensão externa. (sessionStorage dura no reload normal.)
const quantidadeDeRecarregamentos =
  (Number(sessionStorage.getItem("sfRecarregamentos")) || 0) + 1;
sessionStorage.setItem("sfRecarregamentos", String(quantidadeDeRecarregamentos));
definirTextoNoElemento("infoReload", "Recarregamentos: " + quantidadeDeRecarregamentos);
