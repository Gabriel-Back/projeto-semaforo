"use strict";

/*
 * Tela de Logs — consulta os registros recebidos do ESP32.
 * Esta tela é apenas de leitura: os logs vêm do back-end (API Laravel),
 * que por sua vez recebe as mensagens via MQTT.
 */
(function () {
  /* ---------- 1) Configuração ---------- */

  // Endereço da API. Troque aqui se o servidor mudar.
  var URL_API = "http://localhost:8080/api";

  // Intervalo da atualização automática, em milissegundos.
  var INTERVALO_AUTO_MS = 5000;

  // Cores aceitas -> cor usada na bolinha da tabela.
  var CORES = {
    vermelho: "#dc2626",
    amarelo: "#eab308",
    verde: "#22c55e",
  };

  /* ---------- 2) Estado da tela ---------- */

  var paginaAtual = 1;
  var carregando = false;
  var temporizadorAuto = null;

  /* ---------- 3) Elementos ---------- */

  var corpoTabela = document.getElementById("tabelaLogsCorpo");
  var containerTabela = document.getElementById("tabelaContainer");
  var containerPaginacao = document.getElementById("paginacaoContainer");
  var listaPaginacao = document.getElementById("paginacaoLogs");
  var infoPaginacao = document.getElementById("infoPaginacao");
  var estadoCarregando = document.getElementById("estadoCarregando");
  var estadoVazio = document.getElementById("estadoVazio");
  var estadoErro = document.getElementById("estadoErro");
  var mensagemErro = document.getElementById("mensagemErro");
  var modalDetalhes = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDetalhes"));

  /* ---------- 4) Utilidades ---------- */

  // Lê um campo de filtro já sem espaços nas pontas.
  function valorDe(id) {
    var campo = document.getElementById(id);
    return campo ? campo.value.trim() : "";
  }

  // Escreve texto tratando valores vazios como "—".
  function definirTexto(id, valor) {
    var elemento = document.getElementById(id);
    if (!elemento) return;
    elemento.textContent = valor === null || valor === undefined || valor === "" ? "—" : String(valor);
  }

  // Garante que só aceitamos as cores conhecidas.
  function normalizarCor(cor) {
    var valor = String(cor || "").trim().toLowerCase();
    return CORES[valor] ? valor : "";
  }

  // dd/mm/aaaa HH:mm:ss no fuso do navegador.
  function formatarData(valor) {
    if (!valor) return "—";
    var data = new Date(valor);
    if (Number.isNaN(data.getTime())) return String(valor);

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(data);
  }

  function descreverBooleano(valor, textoVerdadeiro, textoFalso) {
    if (valor === null || valor === undefined) return null;
    return valor ? textoVerdadeiro : textoFalso;
  }

  // Payload pode ser JSON; se não for, mostra o texto puro.
  function formatarPayload(payload) {
    if (payload === null || payload === undefined || payload === "") return "—";
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch (erro) {
      return String(payload);
    }
  }

  function criarIcone(classe) {
    var icone = document.createElement("i");
    icone.className = classe;
    icone.setAttribute("aria-hidden", "true");
    return icone;
  }

  /* ---------- 5) Montagem da consulta ---------- */

  function adicionarParametro(params, chave, valor) {
    if (valor !== "") {
      params.set(chave, valor);
    }
  }

  // Monta a query string com página + filtros preenchidos.
  function montarQueryString() {
    var params = new URLSearchParams();
    params.set("page", String(paginaAtual));

    adicionarParametro(params, "dispositivo", valorDe("filtroDispositivo"));
    adicionarParametro(params, "cor", valorDe("filtroCor"));
    adicionarParametro(params, "estado", valorDe("filtroEstado"));
    adicionarParametro(params, "ciclo", valorDe("filtroCiclo"));
    adicionarParametro(params, "de", valorDe("filtroDe"));
    adicionarParametro(params, "ate", valorDe("filtroAte"));

    return "?" + params.toString();
  }

  /* ---------- 6) Comunicação com a API ---------- */

  async function buscarLogs(silencioso) {
    if (carregando) return;
    carregando = true;

    if (!silencioso) {
      mostrarEstado("carregando");
    }

    try {
      var resposta = await fetch(URL_API + "/logs" + montarQueryString(), {
        headers: { Accept: "application/json" },
      });

      if (!resposta.ok) {
        throw new Error("HTTP " + resposta.status);
      }

      var corpo = await resposta.json();
      var registros = corpo.data || [];
      var meta = corpo.meta || {};

      paginaAtual = Number(meta.current_page) || 1;

      renderizarTabela(registros);
      renderizarPaginacao(meta);
      atualizarInfoPaginacao(meta, registros.length);
      mostrarEstado(registros.length ? "ok" : "vazio");
    } catch (erro) {
      console.error("Falha ao buscar logs:", erro);

      // Atualização automática não deve apagar a tabela já exibida.
      if (silencioso && corpoTabela.children.length > 0) {
        return;
      }

      mensagemErro.textContent = "Verifique se a API está ligada em " + URL_API + ".";
      mostrarEstado("erro");
    } finally {
      carregando = false;
    }
  }

  /* ---------- 7) Estados da interface ---------- */

  function alternar(elemento, visivel) {
    if (!elemento) return;
    elemento.classList.toggle("d-none", !visivel);
  }

  function mostrarEstado(estado) {
    var exibindoPagina = estado === "ok";

    alternar(estadoCarregando, estado === "carregando");
    alternar(estadoVazio, estado === "vazio");
    alternar(estadoErro, estado === "erro");
    alternar(containerTabela, exibindoPagina);
    alternar(containerPaginacao, exibindoPagina && listaPaginacao.children.length > 0);
  }

  /* ---------- 8) Tabela ---------- */

  function criarCelula(valor) {
    var celula = document.createElement("td");
    celula.textContent = valor === null || valor === undefined || valor === "" ? "—" : String(valor);
    return celula;
  }

  function criarCelulaCor(cor) {
    var celula = document.createElement("td");
    var corNormalizada = normalizarCor(cor);

    if (!corNormalizada) {
      celula.textContent = "—";
      return celula;
    }

    var bolinha = document.createElement("span");
    bolinha.className = "log-cor-dot";
    bolinha.style.backgroundColor = CORES[corNormalizada];

    var texto = document.createElement("span");
    texto.textContent = corNormalizada;

    celula.appendChild(bolinha);
    celula.appendChild(texto);
    return celula;
  }

  function criarCelulaBooleana(valor, textoVerdadeiro, textoFalso) {
    var celula = document.createElement("td");

    if (valor === null || valor === undefined) {
      celula.textContent = "—";
      return celula;
    }

    var badge = document.createElement("span");
    badge.className = "badge " + (valor ? "text-bg-success" : "text-bg-secondary");
    badge.textContent = valor ? textoVerdadeiro : textoFalso;
    celula.appendChild(badge);
    return celula;
  }

  function criarCelulaAcoes(log) {
    var celula = document.createElement("td");
    celula.className = "text-end";

    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn-outline-primary btn-sm";
    botao.setAttribute("aria-label", "Ver detalhes do log " + log.id);
    botao.appendChild(criarIcone("bi bi-eye"));
    botao.appendChild(document.createTextNode(" Detalhes"));
    botao.addEventListener("click", function () {
      abrirDetalhes(log);
    });

    celula.appendChild(botao);
    return celula;
  }

  function criarLinha(log) {
    var linha = document.createElement("tr");

    linha.appendChild(criarCelula(log.id));
    linha.appendChild(criarCelula(log.dispositivo));
    linha.appendChild(criarCelulaCor(log.cor));
    linha.appendChild(criarCelulaBooleana(log.estado, "Ligado", "Desligado"));
    linha.appendChild(criarCelulaBooleana(log.ciclo, "Sim", "Não"));
    linha.appendChild(criarCelula(formatarData(log.recebido_em)));
    linha.appendChild(criarCelulaAcoes(log));

    return linha;
  }

  function renderizarTabela(registros) {
    corpoTabela.textContent = "";
    registros.forEach(function (log) {
      corpoTabela.appendChild(criarLinha(log));
    });
  }

  /* ---------- 9) Paginação ---------- */

  function criarItemPaginacao(pagina, texto, desabilitado, ativo) {
    var item = document.createElement("li");
    item.className = "page-item" + (desabilitado ? " disabled" : "") + (ativo ? " active" : "");

    var link = document.createElement("a");
    link.className = "page-link";
    link.href = "#";
    link.textContent = texto;

    if (ativo) {
      link.setAttribute("aria-current", "page");
    }

    if (desabilitado) {
      link.setAttribute("aria-disabled", "true");
    } else {
      link.addEventListener("click", function (evento) {
        evento.preventDefault();
        irParaPagina(pagina);
      });
    }

    item.appendChild(link);
    return item;
  }

  function criarReticencias() {
    var item = document.createElement("li");
    item.className = "page-item disabled";

    var span = document.createElement("span");
    span.className = "page-link";
    span.textContent = "…";

    item.appendChild(span);
    return item;
  }

  // Gera a lista de números exibidos, com "…" quando há muitas páginas.
  function gerarNumerosDePagina(atual, ultima) {
    var numeros = [];
    var i;

    if (ultima <= 7) {
      for (i = 1; i <= ultima; i++) numeros.push(i);
      return numeros;
    }

    numeros.push(1);
    if (atual > 3) numeros.push(null);

    var inicio = Math.max(2, atual - 1);
    var fim = Math.min(ultima - 1, atual + 1);
    for (i = inicio; i <= fim; i++) numeros.push(i);

    if (atual < ultima - 2) numeros.push(null);
    numeros.push(ultima);
    return numeros;
  }

  function renderizarPaginacao(meta) {
    var atual = Number(meta.current_page) || 1;
    var ultima = Number(meta.last_page) || 1;

    listaPaginacao.textContent = "";

    if (ultima <= 1) {
      return;
    }

    listaPaginacao.appendChild(criarItemPaginacao(atual - 1, "«", atual <= 1, false));

    gerarNumerosDePagina(atual, ultima).forEach(function (numero) {
      if (numero === null) {
        listaPaginacao.appendChild(criarReticencias());
      } else {
        listaPaginacao.appendChild(criarItemPaginacao(numero, String(numero), false, numero === atual));
      }
    });

    listaPaginacao.appendChild(criarItemPaginacao(atual + 1, "»", atual >= ultima, false));
  }

  function atualizarInfoPaginacao(meta, quantidade) {
    var total = Number(meta.total) || 0;

    if (!total && !quantidade) {
      infoPaginacao.textContent = "Nenhum registro";
      return;
    }

    var porPagina = Number(meta.per_page) || quantidade;
    var atual = Number(meta.current_page) || paginaAtual;
    var de = meta.from != null ? Number(meta.from) : (atual - 1) * porPagina + 1;
    var ate = meta.to != null ? Number(meta.to) : de + quantidade - 1;

    infoPaginacao.textContent = "Exibindo " + de + "–" + ate + " de " + total + " registros";
  }

  function irParaPagina(pagina) {
    if (pagina < 1) return;
    paginaAtual = pagina;
    buscarLogs(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 10) Modal de detalhes ---------- */

  function abrirDetalhes(log) {
    definirTexto("detalheId", log.id);
    definirTexto("detalheDispositivo", log.dispositivo);
    definirTexto("detalheTopico", log.topico);
    definirTexto("detalheCor", normalizarCor(log.cor) || log.cor);
    definirTexto("detalheEstado", descreverBooleano(log.estado, "Ligado", "Desligado"));
    definirTexto("detalheCiclo", descreverBooleano(log.ciclo, "Sim", "Não"));
    definirTexto("detalhePorta", log.porta);
    definirTexto("detalheComando", log.comando);
    definirTexto("detalheRecebido", formatarData(log.recebido_em));

    document.getElementById("detalhePayload").textContent = formatarPayload(log.payload);

    modalDetalhes.show();
  }

  /* ---------- 11) Filtros e atualização ---------- */

  function aplicarFiltros(evento) {
    if (evento) evento.preventDefault();
    paginaAtual = 1;
    buscarLogs(false);
  }

  function limparFiltros() {
    var form = document.getElementById("formFiltros");
    if (form) form.reset();
    paginaAtual = 1;
    buscarLogs(false);
  }

  function pararAuto() {
    if (temporizadorAuto !== null) {
      window.clearInterval(temporizadorAuto);
      temporizadorAuto = null;
    }
  }

  function alternarAuto() {
    pararAuto();

    if (document.getElementById("switchAuto").checked) {
      temporizadorAuto = window.setInterval(function () {
        buscarLogs(true);
      }, INTERVALO_AUTO_MS);
    }
  }

  /* ---------- 12) Inicialização ---------- */

  document.getElementById("formFiltros").addEventListener("submit", aplicarFiltros);
  document.getElementById("btnLimpar").addEventListener("click", limparFiltros);
  document.getElementById("btnAtualizar").addEventListener("click", function () {
    buscarLogs(false);
  });
  document.getElementById("btnTentarNovamente").addEventListener("click", function () {
    buscarLogs(false);
  });
  document.getElementById("switchAuto").addEventListener("change", alternarAuto);
  window.addEventListener("beforeunload", pararAuto);

  buscarLogs(false);
})();
