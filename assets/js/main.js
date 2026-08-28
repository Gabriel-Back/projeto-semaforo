"use strict";

(function () {
  var sidebarStorageKey = "adminHMD.sidebarMini";
  var themeStorageKey = "adminHMD.colorTheme";
  var desktopMedia = "(min-width: 992px)";
  var logsStorageKey = "adminHMD.logsAlteracao";

  function getCurrentUser() {
    var savedUser = null;

    try {
      savedUser = sessionStorage.getItem("adminHMD.usuarioAtual");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      savedUser = null;
    }

    try {
      savedUser = localStorage.getItem("adminHMD.usuarioAtual");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      savedUser = null;
    }

    return { name: "Administrador" };
  }

  function recuperarLogs() {
    try {
      return JSON.parse(localStorage.getItem(logsStorageKey) || "[]");
    } catch (error) {
      return [];
    }
  }

  function registrarLog(acao, usuarioNome) {
    var usuario = usuarioNome || getCurrentUser().name || "Administrador";
    var logs = recuperarLogs();
    var novoLog = {
      id: Date.now() + Math.random().toString(16).slice(2),
      horario: new Date().toISOString(),
      usuario: usuario,
      alteracao: String(acao || "Alteração registrada").trim(),
    };

    logs.unshift(novoLog);
    localStorage.setItem(logsStorageKey, JSON.stringify(logs.slice(0, 500)));
    return novoLog;
  }

  function registrarLogin() {
    try {
      if (!sessionStorage.getItem("adminHMD.loginRegistrado")) {
        var usuarioAtual = getCurrentUser();
        window.registrarLog("Login no sistema", usuarioAtual.name || "Administrador");
        sessionStorage.setItem("adminHMD.loginRegistrado", "true");
      }
    } catch (error) {
      // Ignora falhas de storage em ambientes restritos.
    }
  }

  if (typeof window !== "undefined") {
    window.adminHMDUser = window.adminHMDUser || { name: "Administrador", workspace: "Workspace ativo", avatar: "../../assets/images/avatar/avatar.jpg" };
    try {
      sessionStorage.setItem("adminHMD.usuarioAtual", JSON.stringify(window.adminHMDUser));
      localStorage.setItem("adminHMD.usuarioAtual", JSON.stringify(window.adminHMDUser));
    } catch (error) {
      // Ignora falhas de storage em ambientes restritos.
    }

    window.registrarLog = registrarLog;
    window.recuperarLogs = recuperarLogs;
    registrarLogin();
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  function isDesktop() {
    return window.matchMedia(desktopMedia).matches;
  }

  function canUseStorage() {
    try {
      var testKey = sidebarStorageKey + ".test";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getSavedMiniState(storageAvailable) {
    if (!storageAvailable) {
      return false;
    }

    return window.localStorage.getItem(sidebarStorageKey) === "true";
  }

  function saveMiniState(storageAvailable, isMini) {
    if (storageAvailable) {
      window.localStorage.setItem(sidebarStorageKey, String(isMini));
    }
  }

  function getPreferredTheme(storageAvailable) {
    var savedTheme = storageAvailable ? window.localStorage.getItem(themeStorageKey) : "";

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  }

  onReady(function () {
    var body = document.body;

    function initSidebarNavigation() {
      var sidebarNav = document.querySelector(".sidebar-nav");

      if (!sidebarNav) {
        return;
      }

      var path = window.location.pathname.replace(/\\/g, "/");
      var inApplicationRoot = /\/application\/[^/]+\.html$/.test(path);
      var inSemaforo = path.indexOf("/cadastros_semaforo/") !== -1;
      var inUsuarios = path.indexOf("/cadastros_usuarios/") !== -1;
      var semaforoPath = inApplicationRoot ? "cadastros_semaforo/index.html" : "../cadastros_semaforo/index.html";
      var usuariosPath = inApplicationRoot ? "cadastros_usuarios/index.html" : "../cadastros_usuarios/index.html";
      var simuladorPath = inApplicationRoot ? "simulador/index.html" : "../simulador/index.html";
      var monitoramentoPath = inApplicationRoot ? "monitoramento/index.html" : "../monitoramento/index.html";
      var logsPath = inApplicationRoot ? "logs_alteracao/index.html" : "../logs_alteracao/index.html";
      var semaforoActive = inSemaforo ? " active" : "";
      var usuariosActive = inUsuarios ? " active" : "";
      var currentPath = window.location.pathname;

      sidebarNav.innerHTML = '<button class="nav-link nav-accordion-toggle' + semaforoActive + '" type="button" aria-expanded="true" aria-controls="semaforo-submenu"><span class="nav-icon"><i class="bi bi-stoplights" aria-hidden="true"></i></span><span class="nav-text">Semáforo</span><i class="bi bi-chevron-down nav-chevron" aria-hidden="true"></i></button><div class="nav-submenu" id="semaforo-submenu"><a class="nav-sublink' + (inSemaforo && /\/index\.html$/.test(currentPath) ? " active" : "") + '" href="' + semaforoPath + '">Cadastros</a><a class="nav-sublink" href="' + simuladorPath + '">Simulador</a><a class="nav-sublink" href="' + monitoramentoPath + '">Monitoramento</a></div><button class="nav-link nav-accordion-toggle" type="button" aria-expanded="false" aria-controls="relatorios-submenu"><span class="nav-icon"><i class="bi bi-file-earmark-bar-graph" aria-hidden="true"></i></span><span class="nav-text">Relatórios</span><i class="bi bi-chevron-down nav-chevron" aria-hidden="true"></i></button><div class="nav-submenu" id="relatorios-submenu" hidden><a class="nav-sublink" href="' + logsPath + '">Logs de alterações</a></div><a class="nav-link' + usuariosActive + '" href="' + usuariosPath + '"><span class="nav-icon"><i class="bi bi-people" aria-hidden="true"></i></span><span class="nav-text">Usuários</span></a><a class="nav-link" href="' + monitoramentoPath + '"><span class="nav-icon"><i class="bi bi-person-badge" aria-hidden="true"></i></span><span class="nav-text">Perfil</span></a><a class="nav-link" href="' + monitoramentoPath + '"><span class="nav-icon"><i class="bi bi-file-earmark" aria-hidden="true"></i></span><span class="nav-text">Blank Page</span></a>';
    }

    initSidebarNavigation();
    var sidebarToggle = document.querySelector("[data-sidebar-toggle]");
    var themeToggles = document.querySelectorAll("[data-theme-toggle]");
    var themeIcons = document.querySelectorAll("[data-theme-icon]");
    var closeButtons = document.querySelectorAll("[data-sidebar-close]");
    var sidebarLinks = document.querySelectorAll(".sidebar-nav .nav-link");
    var accordionToggles = document.querySelectorAll(".nav-accordion-toggle");
    var mediaQuery = window.matchMedia(desktopMedia);
    var storageAvailable = canUseStorage();

    function initValidation() {
      var forms = document.querySelectorAll(".needs-validation");

      Array.prototype.forEach.call(forms, function (form) {
        form.addEventListener("submit", function (event) {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }

          form.classList.add("was-validated");
        });
      });
    }

    function initTableSearch() {
      var searchInputs = document.querySelectorAll("[data-table-search]");

      Array.prototype.forEach.call(searchInputs, function (input) {
        var tableId = input.getAttribute("data-table-search");
        var table = document.getElementById(tableId);

        if (!table) {
          return;
        }

        input.addEventListener("input", function () {
          var query = input.value.trim().toLowerCase();
          var rows = table.querySelectorAll("tbody tr");

          Array.prototype.forEach.call(rows, function (row) {
            row.hidden = query !== "" && row.textContent.toLowerCase().indexOf(query) === -1;
          });
        });
      });
    }

    function updateThemeControls(theme) {
      var nextTheme = theme === "dark" ? "light" : "dark";
      var label = "Switch to " + nextTheme + " mode";
      var iconClass = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";

      Array.prototype.forEach.call(themeToggles, function (button) {
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
      });

      Array.prototype.forEach.call(themeIcons, function (icon) {
        icon.className = iconClass;
      });
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-bs-theme", theme);

      if (storageAvailable) {
        window.localStorage.setItem(themeStorageKey, theme);
      }

      updateThemeControls(theme);
    }

    function initThemeToggle() {
      applyTheme(getPreferredTheme(storageAvailable));

      Array.prototype.forEach.call(themeToggles, function (button) {
        button.addEventListener("click", function () {
          var currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
          applyTheme(currentTheme === "dark" ? "light" : "dark");
        });
      });
    }

    initValidation();
    initTableSearch();
    initThemeToggle();

    // Initialize user profile values in UI. Provide a window.adminHMDUser object to override defaults.
    function initUserProfile() {
      var user = window.adminHMDUser || { name: "Admin Hasan", workspace: "Active Workspace", avatar: "../assets/images/avatar/avatar.jpg" };

      var sidebarNameEl = document.querySelector(".sidebar-user strong");
      var sidebarWorkspaceEl = document.querySelector(".sidebar-user small");
      var sidebarAvatar = document.querySelector(".sidebar-user .avatar-img");
      var profileNameEls = document.querySelectorAll(".profile-name");
      var profileAvatarEls = document.querySelectorAll(".profile-button .avatar-img, .profile-button img");

      if (sidebarNameEl) sidebarNameEl.textContent = user.name;
      if (sidebarWorkspaceEl) sidebarWorkspaceEl.textContent = user.workspace;
      if (sidebarAvatar && user.avatar) { sidebarAvatar.src = user.avatar; sidebarAvatar.alt = user.name; }

      Array.prototype.forEach.call(profileNameEls, function (el) { el.textContent = user.name; });
      Array.prototype.forEach.call(profileAvatarEls, function (img) { if (user.avatar) img.src = user.avatar; if (user.name) img.alt = user.name; });
    }

    initUserProfile();

    Array.prototype.forEach.call(accordionToggles, function (toggle) {
      toggle.addEventListener("click", function () {
        var submenu = document.getElementById(toggle.getAttribute("aria-controls"));
        var expanded = toggle.getAttribute("aria-expanded") === "true";

        if (!submenu) {
          return;
        }

        toggle.setAttribute("aria-expanded", String(!expanded));
        submenu.hidden = expanded;
      });
    });

    if (!sidebarToggle) {
      return;
    }

    function setClass(element, className, enabled) {
      if (enabled) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }

    function setToggleExpanded() {
      var expanded = isDesktop()
        ? !body.classList.contains("sidebar-mini")
        : body.classList.contains("sidebar-open");

      sidebarToggle.setAttribute("aria-expanded", String(expanded));
    }

    function closeMobileSidebar() {
      body.classList.remove("sidebar-open");
      setToggleExpanded();
    }

    function toggleSidebar() {
      if (isDesktop()) {
        body.classList.toggle("sidebar-mini");
        saveMiniState(storageAvailable, body.classList.contains("sidebar-mini"));
      } else {
        body.classList.toggle("sidebar-open");
      }

      setToggleExpanded();
    }

    function addCloseHandlers(items) {
      Array.prototype.forEach.call(items, function (item) {
        item.addEventListener("click", function () {
          if (!isDesktop()) {
            closeMobileSidebar();
          }
        });
      });
    }

    if (getSavedMiniState(storageAvailable) && isDesktop()) {
      body.classList.add("sidebar-mini");
    }

    sidebarToggle.addEventListener("click", toggleSidebar);
    addCloseHandlers(closeButtons);
    addCloseHandlers(sidebarLinks);
    setToggleExpanded();

    function handleBreakpointChange() {
      if (isDesktop()) {
        body.classList.remove("sidebar-open");
        setClass(body, "sidebar-mini", getSavedMiniState(storageAvailable));
      } else {
        body.classList.remove("sidebar-mini");
      }

      setToggleExpanded();
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleBreakpointChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleBreakpointChange);
    }
  });
})();
