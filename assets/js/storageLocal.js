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

}

