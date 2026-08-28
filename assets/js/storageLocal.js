class storageLocal {

    constructor() {

    }

    guardarDados() {

        let vermelho = document.getElementById('tempoVermelho');
        let amarelo = document.getElementById('tempoAmarelo');
        let verde = document.getElementById('tempoVerde');

        let objJson = {
            "tempoVermelho": vermelho.value,
            "tempoAmarelo": amarelo.value,
            "tempoVerde": verde.value
        };

        console.log(objJson);

        this.salvarEmLocalStorage(objJson);

    }

    salvarEmLocalStorage(dadosJson) {
        let jsonStr = JSON.stringify(dadosJson);
        localStorage.setItem('timerSemaforo', jsonStr);
    }

    recuperarDoLocalStorage() {
        let jsonStr = localStorage.getItem('timerSemaforo');

        if (jsonStr !== null && jsonStr !== undefined) {
            let jsonObj = JSON.parse(jsonStr);
            this.preencherTemposSemaforo(jsonObj);
        }
    }

    preencherTemposSemaforo(jsonObj) {
        let tempoVermelho = document.getElementById('tempoVermelho');
        let tempoAmarelo = document.getElementById('tempoAmarelo');
        let tempoVerde = document.getElementById('tempoVerde');

        if (!tempoVermelho || !tempoAmarelo || !tempoVerde) {
            return;
        }

        tempoVermelho.value = jsonObj.tempoVermelho;
        tempoAmarelo.value = jsonObj.tempoAmarelo;
        tempoVerde.value = jsonObj.tempoVerde;
    }

    salvarCadastrosSemaforos(registros) {
        localStorage.setItem('semaforosCadastros', JSON.stringify(registros));
    }

    recuperarCadastrosSemaforos(defaults) {
        let dados = localStorage.getItem('semaforosCadastros');

        if (!dados) {
            return defaults || [];
        }

        return JSON.parse(dados);
    }

    salvarFormularioSemaforoEmCache(formulario) {
        localStorage.setItem('semaforosCadastrosFormCache', JSON.stringify(formulario));
    }

    recuperarFormularioSemaforoEmCache() {
        let formularioEmCache = localStorage.getItem('semaforosCadastrosFormCache');
        return formularioEmCache ? JSON.parse(formularioEmCache) : null;
    }

    limparFormularioSemaforoEmCache() {
        localStorage.removeItem('semaforosCadastrosFormCache');
    }

    salvarUsuarios(usuarios) {
        localStorage.setItem('usuariosCadastros', JSON.stringify(usuarios));
    }

    recuperarUsuarios(defaults) {
        let dados = localStorage.getItem('usuariosCadastros');

        if (!dados) {
            return defaults || [];
        }

        return JSON.parse(dados);
    }

    salvarFormularioUsuarioEmCache(formulario) {
        localStorage.setItem('usuariosCadastrosFormCache', JSON.stringify(formulario));
    }

    recuperarFormularioUsuarioEmCache() {
        let formularioEmCache = localStorage.getItem('usuariosCadastrosFormCache');
        return formularioEmCache ? JSON.parse(formularioEmCache) : null;
    }

    limparFormularioUsuarioEmCache() {
        localStorage.removeItem('usuariosCadastrosFormCache');
    }

    limparCadastrosSemaforos() {
        localStorage.removeItem('semaforosCadastros');
    }

    limparUsuarios() {
        localStorage.removeItem('usuariosCadastros');
    }

}

