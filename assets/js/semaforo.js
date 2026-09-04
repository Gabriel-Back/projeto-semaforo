let modoAtual = "parado";

class Semaforo {

    constructor(idVermelho = "luzVermelho", idAmarelo = "luzAmarelo", idVerde = "luzVerde") {
        this.idLuzVermelho = idVermelho;
        this.idLuzAmarelo = idAmarelo;
        this.idLuzVerde = idVerde;

        this.tempoVermelho = 2;
        this.tempoAmarelo = 2;
        this.tempoVerde = 2;
        this.ativo = false;
        this.idExecucao = 0;
    }

    async sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    desligarLeds() {
        let ledVermelho = document.getElementById(this.idLuzVermelho);
        let ledAmarelo = document.getElementById(this.idLuzAmarelo);
        let ledVerde = document.getElementById(this.idLuzVerde);

        [ledVermelho, ledAmarelo, ledVerde].forEach((led) => {
            if (led) led.classList.remove("ligado");
        });
    }

    ligarLed(led) {
        let l = document.getElementById(led);
        if (l) l.classList.add("ligado");
    }

    parar() {
        this.ativo = false;
        this.idExecucao++;
        this.desligarLeds();
    }

    aplicarTempos() {
        let tempoVermelhoInput = document.getElementById("tempoVermelho");
        let tempoAmareloInput = document.getElementById("tempoAmarelo");
        let tempoVerdeInput = document.getElementById("tempoVerde");

        const tempos = [tempoVermelhoInput, tempoAmareloInput, tempoVerdeInput]
            .map((input) => Number.parseInt(input.value, 10));

        if (tempos.some((tempo) => Number.isNaN(tempo) || tempo < 1 || tempo > 120)) {
            return false;
        }

        [this.tempoVermelho, this.tempoAmarelo, this.tempoVerde] = tempos;
        return true;
    }

    async run() {
        this.parar();
        this.ativo = true;
        let execucaoAtual = this.idExecucao;
        this.aplicarTempos();

        while (this.ativo && this.idExecucao === execucaoAtual) {
            this.desligarLeds();
            this.ligarLed(this.idLuzVermelho);
            await this.sleep(this.tempoVermelho * 1000);

            if (!this.ativo || this.idExecucao !== execucaoAtual) break;

            this.desligarLeds();
            this.ligarLed(this.idLuzVerde);
            await this.sleep(this.tempoVerde * 1000);

            if (!this.ativo || this.idExecucao !== execucaoAtual) break;

            this.desligarLeds();
            this.ligarLed(this.idLuzAmarelo);
            await this.sleep(this.tempoAmarelo * 1000);
        }
    }

    async ligarIntermitente() {
        this.parar();
        this.ativo = true;
        let execucaoAtual = this.idExecucao;
        this.aplicarTempos();

        while (this.ativo && this.idExecucao === execucaoAtual) {
            this.desligarLeds();

            this.ligarLed(this.idLuzAmarelo);
            await this.sleep(this.tempoAmarelo * 1000);

            if (!this.ativo || this.idExecucao !== execucaoAtual) break;

            this.desligarLeds();
            await this.sleep(this.tempoAmarelo * 1000);
        }
    }

    reset() {
        let vermelho = document.getElementById('tempoVermelho');
        let amarelo = document.getElementById('tempoAmarelo');
        let verde = document.getElementById('tempoVerde');

        vermelho.value = this.tempoVermelho;
        amarelo.value = this.tempoAmarelo;
        verde.value = this.tempoVerde;
    }

}

function atualizarPainelDeStatus() {
    if (!s) return;

    let modo = s.ativo ? modoAtual : "parado";
    let tempos = "V=" + s.tempoVermelho + "s · A=" + s.tempoAmarelo + "s · G=" + s.tempoVerde + "s";

    atualizarTexto("infoModo", "Modo: " + modo);
    atualizarTexto("infoTempos", tempos);
    atualizarTexto("statusConexao", "Funcionando localmente, sem MQTT");
}

function atualizarTexto(idElemento, texto) {
    let elemento = document.getElementById(idElemento);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function registrarAcao(modo) {
    modoAtual = modo;
    atualizarPainelDeStatus();
}