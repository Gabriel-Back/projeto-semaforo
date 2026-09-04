"use strict";

(function () {
  var desktopMedia = "(min-width: 992px)";

  function isDesktop() {
    return window.matchMedia(desktopMedia).matches;
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  function getLayoutSource() {
    // Caminho relativo à página: todas vivem em application/<seção>/index.html
    return "../layout.html";
  }

  function getSidebarSource() {
    return "../sidebar.html";
  }

  function normalizePath(path) {
    var normalized = String(path || "").replace(/\\/g, "/").replace(/\/+$/, "");
    return normalized || "/";
  }

  function currentPagePath() {
    return normalizePath(window.location.pathname);
  }

  function dirOf(path) {
    var index = String(path).lastIndexOf("/");
    return index > 0 ? String(path).slice(0, index) : "";
  }

  function linkMatchesCurrentPage(link) {
    var href = link.getAttribute("href");

    if (!href || href.charAt(0) === "#") {
      return false;
    }

    var resolved;

    try {
      resolved = new URL(href, window.location.href).pathname;
    } catch (error) {
      return false;
    }

    var target = normalizePath(resolved);
    var current = currentPagePath();

    if (target === current) {
      return true;
    }

    // Editor/ADICIONAR/EDITAR da mesma seção mantém o vínculo ativo no índice dela.
    return /\/index\.html$/.test(resolved) && dirOf(target) === dirOf(current);
  }

  function hydrateUser(root) {
    var user = window.adminSemaforoUser || {};
    var nameEl = root.querySelector(".sidebar-user strong");
    var workspaceEl = root.querySelector(".sidebar-user small");
    var avatar = root.querySelector(".sidebar-user .avatar-img");

    if (nameEl && user.name) {
      nameEl.textContent = user.name;
    }

    if (workspaceEl && user.workspace) {
      workspaceEl.textContent = user.workspace;
    }

    if (avatar && user.avatar) {
      avatar.src = user.avatar;
      avatar.alt = user.name || "Administrador";
    }
  }

  function setActiveState(root) {
    var activeLink = null;
    var links = root.querySelectorAll(".sidebar-nav a[href]");

    Array.prototype.forEach.call(links, function (link) {
      if (linkMatchesCurrentPage(link)) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
        activeLink = link;
      }
    });

    if (!activeLink) {
      return;
    }

    var submenu = activeLink.closest(".nav-submenu");

    if (submenu) {
      submenu.hidden = false;

      var toggle = root.querySelector(
        '.nav-accordion-toggle[aria-controls="' + submenu.id + '"]'
      );

      if (toggle) {
        toggle.classList.add("active");
        toggle.setAttribute("aria-expanded", "true");
      }
    }
  }

  function closeMobileSidebar() {
    document.body.classList.remove("sidebar-open");

    var sidebarToggle = document.querySelector("[data-sidebar-toggle]");

    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", "false");
    }
  }

  function bindInteractions(root) {
    var toggles = root.querySelectorAll(".nav-accordion-toggle");

    Array.prototype.forEach.call(toggles, function (toggle) {
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

    var links = root.querySelectorAll(".sidebar-nav .nav-link");

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener("click", function () {
        if (!isDesktop()) {
          closeMobileSidebar();
        }
      });
    });
  }

  function mountSidebar(mount) {
    fetch(getSidebarSource())
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Sidebar não encontrada em " + getSidebarSource());
        }

        return response.text();
      })
      .then(function (html) {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = html;

        var aside = wrapper.querySelector(".admin-sidebar");

        if (!aside) {
          throw new Error("Partial de sidebar inválido");
        }

        aside.id = mount.getAttribute("id") || "adminSidebar";
        mount.replaceWith(aside);

        hydrateUser(aside);
        setActiveState(aside);
        bindInteractions(aside);

        document.dispatchEvent(new CustomEvent("admin:sidebar:ready"));
      })
      .catch(function (error) {
        console.warn("Layout: falha ao carregar a sidebar.", error);
      });
  }

  function mountLayout(mount) {
    fetch(getLayoutSource())
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Layout não encontrado em " + getLayoutSource());
        }

        return response.text();
      })
      .then(function (html) {
        var shell = document.createElement("div");
        shell.className = "admin-shell";
        shell.innerHTML = html;

        var adminMain = document.querySelector(".admin-main");

        if (adminMain) {
          adminMain.removeAttribute("hidden");
          shell.appendChild(adminMain);
        }

        mount.replaceWith(shell);

        var sidebarMount = shell.querySelector(
          "admin-sidebar, [data-sidebar-mount]"
        );

        if (sidebarMount) {
          mountSidebar(sidebarMount);
        }
      })
      .catch(function (error) {
        console.warn("Layout: falha ao montar o shell.", error);
      });
  }

  function init() {
    var mounts = document.querySelectorAll("admin-layout");

    Array.prototype.forEach.call(mounts, mountLayout);
  }

  // O backdrop geralmente é único por página; a delegação garante o fechamento
  // mesmo quando a sidebar é injetada depois do carregamento inicial.
  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-sidebar-close]") && !isDesktop()) {
      closeMobileSidebar();
    }
  });

  onReady(init);
})();