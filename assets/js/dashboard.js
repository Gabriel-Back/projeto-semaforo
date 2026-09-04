"use strict";

(function () {
  var storageKey = "semaforosCadastros";

  function recuperarSemaforos() {
    try {
      var dados = localStorage.getItem(storageKey);
      if (!dados) {
        return [];
      }
      var lista = JSON.parse(dados);
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      return [];
    }
  }

  function formatarTempo(valor) {
    if (!valor && valor !== 0) {
      return "—";
    }
    var numero = Number(valor);
    if (isNaN(numero)) {
      return String(valor);
    }
    return numero >= 1000 ? numero / 1000 + " s" : numero + " ms";
  }

  function parsearLocalizacao(latitudeLongitude) {
    if (!latitudeLongitude) {
      return null;
    }
    var partes = String(latitudeLongitude).replace(/[()]/g, "").trim().split(/[,\s;]+/);
    var lat = parseFloat(partes[0]);
    var lng = parseFloat(partes[1]);
    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }
    return { latitude: lat, longitude: lng };
  }

  function escaparHtml(texto) {
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function configurarMapa(semaforos) {
    var container = document.getElementById("mapaSemaforos");
    if (!container || typeof L === "undefined") {
      return;
    }

    var mapa = L.map(container).setView([-27.09795, -48.91093], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapa);

    var camadaMarcadores = L.layerGroup().addTo(mapa);
    var marcadores = [];
    var colocados = 0;

    semaforos.forEach(function (semaforo) {
      var pos = parsearLocalizacao(semaforo.latitudeLongitude);
      if (!pos) {
        return;
      }
      colocados += 1;

      var cor = semaforo.ativo ? "#22c55e" : "#ef4444";
      var icon = L.divIcon({
        className: "sf-marker",
        html: '<span class="sf-marker-pin" style="--marker-color:' + cor + '"><i class="bi bi-stoplights"></i></span>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -38],
      });

      var marcador = L.marker([pos.latitude, pos.longitude], { icon: icon }).addTo(camadaMarcadores);
      marcadores.push(marcador);

      var ciclo = formatarTempo(semaforo.tempoVermelho) + " / " +
        formatarTempo(semaforo.tempoAmarelo) + " / " +
        formatarTempo(semaforo.tempoVerde);

      var status = semaforo.ativo
        ? '<span class="badge text-bg-success">Ativo</span>'
        : '<span class="badge text-bg-secondary">Inativo</span>';

      marcador.bindPopup(
        '<div class="sf-popup">' +
          '<div class="sf-popup-titulo"><i class="bi bi-stoplights" aria-hidden="true"></i> ' + escaparHtml(semaforo.nome || "Sem nome") + "</div>" +
          "<div class=\"sf-popup-ciclo\">Ciclo (Vm / Am / Vd): <strong>" + ciclo + "</strong></div>" +
          "<div class=\"sf-popup-coords\">" + pos.latitude.toFixed(5) + ", " + pos.longitude.toFixed(5) + "</div>" +
          '<div class="sf-popup-status">' + status + "</div>" +
          "</div>"
      );
    });

    if (colocados > 0) {
      mapa.fitBounds(L.featureGroup(marcadores).getBounds().pad(0.15));
    }

    var elInfo = document.getElementById("mapInfo");
    if (elInfo) {
      elInfo.textContent = colocados > 0
        ? colocados + " semáforo(s) exibido(s) no mapa"
        : "Nenhum semáforo com localização cadastrada";
    }
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  onReady(function () {
    var semaforos = recuperarSemaforos();
    if (typeof L !== "undefined") {
      configurarMapa(semaforos);
    } else {
      var container = document.getElementById("mapaSemaforos");
      if (container) {
        container.innerHTML = '<div class="blank-state"><span class="bi bi-map text-muted"></span><p class="text-muted mb-0">Biblioteca Leaflet não carregada.</p></div>';
      }
    }
  });
})();
