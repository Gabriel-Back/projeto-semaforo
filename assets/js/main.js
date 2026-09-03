"use strict";

(function () {
  var sidebarStorageKey = "semaforo.sidebarMini";
  var themeStorageKey = "semaforo.colorTheme";
  var desktopMedia = "(min-width: 992px)";
  var logsStorageKey = "semaforo.logsAlteracao";

  function getCurrentUser() {
    var savedUser = null;

    try {
      savedUser = sessionStorage.getItem("semaforo.usuarioAtual");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      savedUser = null;
    }

    try {
      savedUser = localStorage.getItem("semaforo.usuarioAtual");
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
      if (!sessionStorage.getItem("semaforo.loginRegistrado")) {
        var usuarioAtual = getCurrentUser();
        window.registrarLog("Login no sistema", usuarioAtual.name || "Administrador");
        sessionStorage.setItem("semaforo.loginRegistrado", "true");
      }
    } catch (error) {
      // Ignora falhas de storage em ambientes restritos.
    }
  }

  if (typeof window !== "undefined") {
    window.adminSemaforoUser = window.adminSemaforoUser || { name: "Administrador", workspace: "Operação de tráfego", avatar: "../../assets/images/avatar/avatar.jpg" };
    try {
      sessionStorage.setItem("semaforo.usuarioAtual", JSON.stringify(window.adminSemaforoUser));
      localStorage.setItem("semaforo.usuarioAtual", JSON.stringify(window.adminSemaforoUser));
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

    var sidebarToggle = document.querySelector("[data-sidebar-toggle]");
    var themeToggles = document.querySelectorAll("[data-theme-toggle]");
    var themeIcons = document.querySelectorAll("[data-theme-icon]");
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

    // Initialize user profile values in UI. Provide a window.adminSemaforoUser object to override defaults.
    // A sidebar (sidebar-user) é preenchida pelo layout.js.
    function initUserProfile() {
      var user = window.adminSemaforoUser || { name: "Administrador", workspace: "Operação de tráfego", avatar: "../assets/images/avatar/avatar.jpg" };

      var profileNameEls = document.querySelectorAll(".profile-name");
      var profileAvatarEls = document.querySelectorAll(".profile-button .avatar-img, .profile-button img");

      Array.prototype.forEach.call(profileNameEls, function (el) { el.textContent = user.name; });
      Array.prototype.forEach.call(profileAvatarEls, function (img) { if (user.avatar) img.src = user.avatar; if (user.name) img.alt = user.name; });
    }

    initUserProfile();

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

    function toggleSidebar() {
      if (isDesktop()) {
        body.classList.toggle("sidebar-mini");
        saveMiniState(storageAvailable, body.classList.contains("sidebar-mini"));
      } else {
        body.classList.toggle("sidebar-open");
      }

      setToggleExpanded();
    }

    if (getSavedMiniState(storageAvailable) && isDesktop()) {
      body.classList.add("sidebar-mini");
    }

    sidebarToggle.addEventListener("click", toggleSidebar);
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
