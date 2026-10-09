/* ---------- 1) Configuração da API ---------- */
const URL_API = "http://localhost:8080/api";   // porta do php artisan serve
const INTERVALO_CONSULTA_MS = 500;

// Cor enviada pelo ESP32 -> id da luz no HTML
const LUZ_POR_COR = {
  vermelho: "luzVermelho",
  amarelo: "luzAmarelo",
  verde: "luzVerde",
};

/* ---------- 2) Estado atual (espelho do ESP32) ---------- */
let ultimoIdProcessado = 0;
let cicloAtivo = false;
let estadoDasLuzes = { vermelho: false, amarelo: false, verde: false };

/* ---------- 3) Controle das luzes ---------- */

// Atualiza o texto de um elemento sem quebrar se ele não existir.
function definirTextoNoElemento(idDoElemento, texto) {
  const elemento = document.getElementById(idDoElemento);
  if (elemento) elemento.textContent = texto;
}

// Liga ou desliga UMA luz.
function definirLuz(idDaLuz, ligada) {
  const luz = document.getElementById(idDaLuz);
  if (luz) luz.classList.toggle("ligado", ligada);
}

function desligarTodasAsLuzes() {
  Object.keys(LUZ_POR_COR).forEach(cor => {
    estadoDasLuzes[cor] = false;
    definirLuz(LUZ_POR_COR[cor], false);
  });
}

// "Vermelho", " VERDE " -> "vermelho", "verde"
function normalizarCor(cor) {
  return String(cor || "").trim().toLowerCase();
}

/* ---------- 4) Aplicar uma mudança vinda do ESP32 ---------- */
function aplicarMudanca(log) {
  const cor = normalizarCor(log.cor);
  const idDaLuz = LUZ_POR_COR[cor];

  // Ignora logs sem cor conhecida (ex.: comandos de texto antigos).
  if (!idDaLuz || typeof log.estado !== "boolean") return;

  // Semáforo: ao ligar uma cor, as outras apagam (funciona mesmo que
  // o ESP32 não envie o "false" da cor anterior).
  if (log.estado) desligarTodasAsLuzes();

  estadoDasLuzes[cor] = log.estado;
  definirLuz(idDaLuz, log.estado);

  if (typeof log.ciclo === "boolean") cicloAtivo = log.ciclo;

  atualizarPainelDeStatus(log);
}

/* ---------- 5) Comunicação com a API ---------- */
async function buscarJson(caminho) {
  const resposta = await fetch(URL_API + caminho, {
    headers: { Accept: "application/json" },
  });
  if (!resposta.ok) throw new Error("HTTP " + resposta.status);
  const corpo = await resposta.json();
  return corpo.data ?? corpo;  // Laravel Resource envolve em "data"
}

// Ao abrir a página: reconstrói o estado atual a partir do histórico.
async function sincronizarEstadoInicial() {
  const logs = await buscarJson("/logs");        // mais recentes primeiro
  if (!logs.length) return;

  ultimoIdProcessado = logs[0].id;
  [...logs].reverse().forEach(aplicarMudanca);   // do mais antigo ao mais novo
}

// Busca só o que chegou depois do último id processado.
async function consultarNovosLogs() {
  const novos = await buscarJson("/logs/novos?depois_do_id=" + ultimoIdProcessado);
  for (const log of novos) {
    aplicarMudanca(log);
    ultimoIdProcessado = Math.max(ultimoIdProcessado, log.id);
    definirTextoNoElemento("infoBruto", "Recebido: " + JSON.stringify(log));
  }
}

async function iniciar() {
  try {
    await sincronizarEstadoInicial();
    definirTextoNoElemento("statusConexao", "Conectado à API");
  } catch (erro) {
    console.log("Falha ao sincronizar:", erro);
    definirTextoNoElemento("statusConexao", "API indisponível — tentando de novo...");
  }
  repetirConsulta();
}

// setTimeout em vez de setInterval: evita consultas sobrepostas.
async function repetirConsulta() {
  try {
    await consultarNovosLogs();
    definirTextoNoElemento("statusConexao", "Conectado à API");
  } catch (erro) {
    console.log("Falha na consulta:", erro);
    definirTextoNoElemento("statusConexao", "API indisponível — tentando de novo...");
  }
  setTimeout(repetirConsulta, INTERVALO_CONSULTA_MS);
}

/* ---------- 6) Barra de status (só leitura) ---------- */
function atualizarPainelDeStatus(ultimoLog) {
  definirTextoNoElemento("infoModo", "Ciclo: " + (cicloAtivo ? "ligado" : "desligado"));
  definirTextoNoElemento(
    "infoTempos",
    "V=" + (estadoDasLuzes.vermelho ? "on" : "off") +
    " · A=" + (estadoDasLuzes.amarelo ? "on" : "off") +
    " · G=" + (estadoDasLuzes.verde ? "on" : "off")
  );

  if (ultimoLog) {
    definirTextoNoElemento(
      "infoComando",
      "Último evento: " + ultimoLog.cor + " = " + (ultimoLog.estado ? "ligado" : "desligado") +
      " (" + new Date(ultimoLog.recebido_em).toLocaleTimeString("pt-BR") + ")"
    );
  }
}

atualizarPainelDeStatus();  // mostra o painel ao abrir a página
iniciar();

/* ---------- 7) Contador de recarregamentos (diagnóstico) ---------- */
const quantidadeDeRecarregamentos =
  (Number(sessionStorage.getItem("sfRecarregamentos")) || 0) + 1;
sessionStorage.setItem("sfRecarregamentos", String(quantidadeDeRecarregamentos));
definirTextoNoElemento("infoReload", "Recarregamentos: " + quantidadeDeRecarregamentos);