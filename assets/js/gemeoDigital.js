"use strict";

/* ================================================================
   GÊMEO DIGITAL — orquestra a réplica virtual do semáforo físico.
   Reutiliza:
     - semaforoMQTT.js  (parser MQTT, máquina de estados, luzes sf-luz)
     - storageLocal.js  (persistência da configuração de tempos)
   ================================================================ */

(function () {
  var armazenamento = new storageLocal();

  function atualizarTwinBadge() {
    var badge = document.getElementById("twinStatus");
    var modo = typeof modoAtual !== "undefined" ? modoAtual : "parado";

    if (!badge) {
      return;
    }

    badge.className = "badge";
    badge.classList.add("text-bg-" + (modo === "ciclo" ? "success" : modo === "intermitente" ? "warning" : "secondary"));

    switch (modo) {
      case "ciclo":
        badge.textContent = "Em ciclo";
        break;
      case "intermitente":
        badge.textContent = "Intermitente";
        break;
      default:
        badge.textContent = "Parado";
    }
  }

  function preencherInputs() {
    if (typeof tempoVermelho === "undefined") {
      return;
    }
    var elV = document.getElementById("tempoVermelho");
    var elA = document.getElementById("tempoAmarelo");
    var elG = document.getElementById("tempoVerde");
    if (elV) elV.value = tempoVermelho;
    if (elA) elA.value = tempoAmarelo;
    if (elG) elG.value = tempoVerde;
  }

  function aplicarTemposDoFormulario() {
    var elV = document.getElementById("tempoVermelho");
    var elA = document.getElementById("tempoAmarelo");
    var elG = document.getElementById("tempoVerde");

    var v = parseInt(elV.value, 10);
    var a = parseInt(elA.value, 10);
    var g = parseInt(elG.value, 10);

    if (!isNaN(v)) tempoVermelho = v;
    if (!isNaN(a)) tempoAmarelo = a;
    if (!isNaN(g)) tempoVerde = g;

    if (typeof refrescarPainel === "function") {
      refrescarPainel();
    }
    atualizarTwinBadge();
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  onReady(function () {
    // 1) Tenta restaurar a configuração salva no localStorage.
    var configSalva = null;
    try {
      configSalva = JSON.parse(localStorage.getItem("timerSemaforo") || "null");
    } catch (error) {
      configSalva = null;
    }

    // 2) Preenche os inputs: prioriza a configuração salva; senão usa os padrões do semaforoMQTT.
    if (configSalva &&
        configSalva.tempoVermelho && configSalva.tempoAmarelo && configSalva.tempoVerde) {
      var elV = document.getElementById("tempoVermelho");
      var elA = document.getElementById("tempoAmarelo");
      var elG = document.getElementById("tempoVerde");
      if (elV) elV.value = configSalva.tempoVermelho;
      if (elA) elA.value = configSalva.tempoAmarelo;
      if (elG) elG.value = configSalva.tempoVerde;
      aplicarTemposDoFormulario();
    } else {
      preencherInputs();
    }

    atualizarTwinBadge();

    var form = document.getElementById("twinForm");
    var btnIniciar = document.getElementById("btnIniciar");
    var btnIntermitente = document.getElementById("btnIntermitente");
    var btnParar = document.getElementById("btnParar");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }

        // Salva a configuração no localStorage (reutiliza storageLocal).
        try {
          armazenamento.guardarDados();
        } catch (error) {
          // Campos podem estar ausentes em edições antigas; ignora.
        }

        // Aplica os tempos ao gêmeo digital.
        aplicarTemposDoFormulario();
        window.registrarLog && window.registrarLog("Atualizou configuração do gêmeo digital");
      });
    }

    function aoClicar(btn, acao) {
      if (!btn) {
        return;
      }
      btn.addEventListener("click", function () {
        preencherInputs();
        aplicarTemposDoFormulario();
        acao();
        atualizarTwinBadge();
      });
    }

    aoClicar(btnIniciar, function () {
      if (typeof iniciarCiclo === "function") iniciarCiclo();
    });
    aoClicar(btnIntermitente, function () {
      if (typeof modoIntermitente === "function") modoIntermitente();
    });
    aoClicar(btnParar, function () {
      if (typeof pararSemaforo === "function") pararSemaforo();
    });

    // Mantém o badge de status do gêmeo em dia conforme o semaforoMQTT reflete.
    setInterval(atualizarTwinBadge, 700);
  });
})();
