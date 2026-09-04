const HOST_BROKER = "localhost";
const PORTA_BROKER = 8000;
const TOPICO_ESTADO = "semaforo/estado";
const ID_CLIENTE = "semaforo-web-" + Math.floor(Math.random() * 10000);

const COMANDO_INICIAR = "iniciar";
const COMANDO_PARAR = "parar";
const COMANDO_INTERMITENTE = "ligarintermitente";
const COMANDO_VERMELHO = "vermelho";
const COMANDO_AMARELO = "amarelo";
const COMANDO_VERDE = "verde";
const MODO_PARADO = "parado";
const MODO_CICLO = "ciclo";
const MODO_INTERMITENTE = "intermitente";
const MODO_VERMELHO = "vermelho";
const MODO_AMARELO = "amarelo";
const MODO_VERDE = "verde";

const TEMPO_PISCA_AMARELO = 1;
const INTERVALO_RECONEXAO_MS = 3000;
const TEMPOS_PADRAO = {vermelho: 3, amarelo: 1, verde: 3};

let tempoVermelho = TEMPOS_PADRAO.vermelho;
let tempoAmarelo = TEMPOS_PADRAO.amarelo;
let tempoVerde = TEMPOS_PADRAO.verde;

let semaforoEmExecucao = false;
let idExecucaoCorrente = 0;
let modoAtual = MODO_PARADO;

/* Controle das luzes */

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

function acenderSomenteLuz(idDaLuz) {
    desligarTodasAsLuzes();
    document.getElementById(idDaLuz).classList.add("ligado");
}

// setTimeout usa milissegundos; aqui o código fala em segundos.
function aguardarSegundos(segundos) {
    return new Promise(resolver => setTimeout(resolver, segundos * 1000));
}

/* Máquina de estados  */

function pararSemaforo() {
    idExecucaoCorrente++;  
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

/* Interpretação dos comandos */

function obterComandoDaMensagem(mensagemBruta) {
    let comando = mensagemBruta.trim();

    if (comando.startsWith("{")) {
        comando = extrairMensagemDoJson(comando);
    }

    comando = removerAspas(comando);
    return comando.trim().toLowerCase();
}

function extrairMensagemDoJson(comandoEmJson) {
    try {
        return JSON.parse(comandoEmJson).msg || "";
    } catch {
        return "";
    }
}

function removerAspas(texto) {
    return texto.replace(/^['"]+/, "").replace(/['"]+$/, "");
}

// Pega o número depois do "="
function extrairTempoDoComando(comando) {
    const partes = comando.split("=");
    const valor = parseInt(partes[1], 10);
    return Number.isNaN(valor) ? null : valor;
}

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
        case COMANDO_VERMELHO:
            pararSemaforo();
            acenderSomenteLuz("luzVermelho");
            modoAtual = MODO_VERMELHO;
            break;
        case COMANDO_AMARELO:
            pararSemaforo();
            acenderSomenteLuz("luzAmarelo");
            modoAtual = MODO_AMARELO;
            break;
        case COMANDO_VERDE:
            pararSemaforo();
            acenderSomenteLuz("luzVerde");
            modoAtual = MODO_VERDE;
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

/* MQTT: conexão e recebimento de mensagens */
if (typeof Paho !== "undefined") {
    const clienteMqtt = new Paho.Client(HOST_BROKER, PORTA_BROKER, ID_CLIENTE);
    clienteMqtt.onConnectionLost = aoPerderConexao;
    clienteMqtt.onMessageArrived = aoReceberMensagem;

    conectarAoBroker();

    function conectarAoBroker() {
        if (clienteMqtt.isConnected()) return;
        clienteMqtt.connect({
            onSuccess: aoConectar,
            onFailure: erro => console.log("Falha na conexão:", erro.errorMessage),
        });
    }

    function aoConectar() {
        clienteMqtt.subscribe(TOPICO_ESTADO);
        definirTextoNoElemento("statusConexao", "Conectado ao broker");
    }

    function aoPerderConexao(resposta) {
        if (resposta.errorCode !== 0) {
            console.log("Conexão perdida:", resposta.errorMessage);
        }
        definirTextoNoElemento("statusConexao", "Desconectado — reconectando...");
    }

    function aoReceberMensagem(mensagem) {
        const payload = mensagem.payloadString;
        console.log("Mensagem recebida:", payload);
        definirTextoNoElemento("infoBruto", "Recebido: " + payload);
        processarMensagemRecebida(payload);
    }

    setInterval(conectarAoBroker, INTERVALO_RECONEXAO_MS);
} else {
    definirTextoNoElemento("statusConexao", "Sem conexão MQTT");
}

function registrarAcao(modo) {
    if (modo === "parar") {
        modoAtual = MODO_PARADO;
    } else {
        modoAtual = modo;
    }
    atualizarPainelDeStatus();
}

/* Barra de status */
function atualizarPainelDeStatus(ultimoComando) {
    if (s) {
        tempoVermelho = s.tempoVermelho;
        tempoAmarelo = s.tempoAmarelo;
        tempoVerde = s.tempoVerde;
        if (!s.ativo) {
            modoAtual = MODO_PARADO;
        }
    }

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

const quantidadeDeRecarregamentos =
    (Number(sessionStorage.getItem("sfRecarregamentos")) || 0) + 1;
sessionStorage.setItem("sfRecarregamentos", String(quantidadeDeRecarregamentos));
definirTextoNoElemento("infoReload", "Recarregamentos: " + quantidadeDeRecarregamentos);