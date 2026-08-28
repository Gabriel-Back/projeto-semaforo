(function () {
	var form = document.getElementById("userForm");
	if (!form) return;
	var armazenamento = new storageLocal();
	var storageKey = "usuariosCadastros";
	var formularioEmCacheKey = "usuariosCadastrosFormCache";
	var editId = new URLSearchParams(window.location.search).get("id");
	var defaults = [{ id: "admin", nome: "Administrador", sobrenome: "", email: "admin@adminhmd.com", perfil: "Administrador", ativo: true }];
	var users = armazenamento.recuperarUsuarios(defaults);
	var editingUser = editId ? users.find(function (user) { return user.id === editId; }) : null;
	var fields = ["nome", "sobrenome", "cpf", "nascimento", "email", "celular", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", "perfil", "ativo"];

	function digits(value) { return value.replace(/\D/g, ""); }
	function maskCpf(value) { return digits(value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
	function maskPhone(value) { return digits(value).slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2"); }
	function maskCep(value) { return digits(value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"); }
	function value(id) { return document.getElementById(id).value.trim(); }
	function fill(user) { fields.forEach(function (field) { var element = document.getElementById(field); if (!element || user[field] === undefined) return; if (element.type === "checkbox") element.checked = Boolean(user[field]); else element.value = user[field]; }); }
	function addressField(id, content) { var element = document.getElementById(id); if (element && !element.value) element.value = content || ""; }
	function validEmailUnique() { var email = value("email").toLowerCase(); return !users.some(function (user) { return user.email.toLowerCase() === email && (!editingUser || user.id !== editingUser.id); }); }
	function togglePassword(button) { var input = document.getElementById(button.dataset.togglePassword); var icon = button.querySelector("i"); input.type = input.type === "password" ? "text" : "password"; icon.className = input.type === "password" ? "bi bi-eye" : "bi bi-eye-slash"; button.setAttribute("aria-label", input.type === "password" ? "Mostrar senha" : "Ocultar senha"); }
	function salvarFormularioEmCache() {
		var formularioEmCache = {};
		fields.forEach(function (field) {
			var element = document.getElementById(field);
			if (!element) return;
			formularioEmCache[field] = element.type === "checkbox" ? element.checked : element.value.trim();
		});
		armazenamento.salvarFormularioUsuarioEmCache(formularioEmCache);
	}
	function restaurarFormularioDoCache() {
		var formularioEmCache = armazenamento.recuperarFormularioUsuarioEmCache();
		if (!formularioEmCache) return false;
		fill(formularioEmCache);
		return true;
	}
	function limparFormularioEmCache() { armazenamento.limparFormularioUsuarioEmCache(); }

	document.getElementById("cpf").addEventListener("input", function () { this.value = maskCpf(this.value); });
	document.getElementById("celular").addEventListener("input", function () { this.value = maskPhone(this.value); });
	document.getElementById("cep").addEventListener("input", function () { this.value = maskCep(this.value); this.setCustomValidity(""); if (digits(this.value).length === 8) fetch("https://viacep.com.br/ws/" + digits(this.value) + "/json/").then(function (response) { return response.json(); }).then(function (address) { if (address.erro) throw new Error("CEP não encontrado"); document.getElementById("cep").setCustomValidity(""); addressField("logradouro", address.logradouro); addressField("bairro", address.bairro); addressField("cidade", address.localidade); addressField("estado", address.uf); document.getElementById("numero").focus(); }).catch(function () { document.getElementById("cep").setCustomValidity("CEP não encontrado"); }); }); document.querySelectorAll("[data-toggle-password]").forEach(function (button) { button.addEventListener("click", function () { togglePassword(button); }); });
	form.addEventListener("input", salvarFormularioEmCache);
	form.addEventListener("change", salvarFormularioEmCache);
	form.addEventListener("submit", function (event) { event.preventDefault(); document.getElementById("email").setCustomValidity(validEmailUnique() ? "" : "Este e-mail já está cadastrado."); var password = document.getElementById("senha").value; var confirmation = document.getElementById("confirmacaoSenha").value; document.getElementById("confirmacaoSenha").setCustomValidity(password === confirmation ? "" : "As senhas devem ser iguais."); if (!form.checkValidity()) { form.classList.add("was-validated"); return; } var user = editingUser || { id: Date.now().toString() }; fields.forEach(function (field) { var element = document.getElementById(field); if (element) user[field] = element.type === "checkbox" ? element.checked : element.value.trim(); }); if (password) user.senha = password; var usuarioNome = user.nome || "Usuário"; var acao = editingUser ? "Atualizou usuário: " + usuarioNome : "Criou novo usuário: " + usuarioNome; if (editingUser) users = users.map(function (item) { return item.id === editingUser.id ? user : item; }); else users.push(user); armazenamento.salvarUsuarios(users); limparFormularioEmCache(); if (window.registrarLog) { window.registrarLog(acao); } window.location.href = "index.html"; });
	form.addEventListener("reset", function () { window.setTimeout(function () { form.classList.remove("was-validated"); document.getElementById("email").setCustomValidity(""); document.getElementById("confirmacaoSenha").setCustomValidity(""); document.getElementById("cep").setCustomValidity(""); limparFormularioEmCache(); }, 0); });
	if (editingUser) {
		if (!restaurarFormularioDoCache()) fill(editingUser);
		document.getElementById("senha").required = false; document.getElementById("confirmacaoSenha").required = false; document.querySelector("h1").textContent = "Editar usuário"; document.querySelector(".page-heading p.text-muted").textContent = "Atualize os dados pessoais, endereço e acesso.";
	} else {
		restaurarFormularioDoCache();
	}
}());
