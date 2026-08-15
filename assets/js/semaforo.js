class Semaforo {

    constructor() {
        this.tempoVermelho = 2000;
        this.tempoAmarelo = 2000;
        this.tempoVerde = 2000;
        this.ativo = false;
        this.idExecucao = 0;
    }

    async sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    desligarLeds() {
        let ledVermelho = document.getElementById("ledVermelho");
        let ledAmarelo = document.getElementById("ledAmarelo");
        let ledVerde = document.getElementById("ledVerde");

        ledVermelho.classList.remove("ligado");
        ledAmarelo.classList.remove("ligado");
        ledVerde.classList.remove("ligado");
    }

    ligarLed(led) {
        let l = document.getElementById(led);
        l.classList.add("ligado");
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

        this.tempoVermelho = parseInt(tempoVermelhoInput.value);
        this.tempoAmarelo = parseInt(tempoAmareloInput.value);
        this.tempoVerde = parseInt(tempoVerdeInput.value);
    }

    async run() {
        this.parar();
        this.ativo = true;
        let execucaoAtual = this.idExecucao;
        this.aplicarTempos(); 
        
        while (this.ativo && this.idExecucao === execucaoAtual) {
            this.desligarLeds();
            this.ligarLed("ledVermelho");
            await this.sleep(this.tempoVermelho);

            if (!this.ativo || this.idExecucao !== execucaoAtual) break;

            this.desligarLeds();
            this.ligarLed("ledVerde");
            await this.sleep(this.tempoVerde);

            if (!this.ativo || this.idExecucao !== execucaoAtual) break;

            this.desligarLeds();
            this.ligarLed("ledAmarelo");
            await this.sleep(this.tempoAmarelo);
        }
    }

    async ligarIntermitente() {
        this.parar();
        this.ativo = true;
        let execucaoAtual = this.idExecucao; 
        this.aplicarTempos();

        while (this.ativo && this.idExecucao === execucaoAtual) {
            this.desligarLeds();
            
            this.ligarLed("ledAmarelo");
            await this.sleep(this.tempoAmarelo);

            if (!this.ativo || this.idExecucao !== execucaoAtual) break;

            this.desligarLeds();
            await this.sleep(this.tempoAmarelo);
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