# 🚦 Semáforo IoT com ESP32

## 📝 Sobre o Projeto
Este projeto consiste no desenvolvimento de um sistema de semáforo inteligente. A iniciativa é dividida em duas fases principais:
1. **Fase de Software:** Simulador web do semáforo que reage **exclusivamente** a mensagens MQTT enviadas pelo **MQTTX** (texto puro).
2. **Fase de Hardware:** Integração do sistema com um microcontrolador **ESP32**, permitindo que os comandos MQTT controlem LEDs físicos.

O simulador foi refatorado com **simplicidade extrema**: mantém o template da página (sidebar, navbar e footer), mas o **conteúdo é limpo** — só o visual do semáforo, sem botões/inputs. O semáforo só responde ao que chega via MQTT.

## 📡 Broker MQTT (Docker)
A comunicação é feita via MQTT, usando um broker Mosquitto que roda localmente em Docker. Instruções completas na pasta [`docker/`](./docker/README.md).

- MQTT (TCP): `mqtt://localhost:1880`
- MQTT (WebSocket, usado pela página): `ws://localhost:8000`

## 🖥️ Como rodar o simulador

```bash
# 1. Suba o broker (na pasta docker/)
docker compose up -d --build

# 2. Abra o arquivo (clique duas vezes ou arraste para o navegador)
application/simulador/index.html
```

A página não precisa de internet: a biblioteca MQTT (`paho-mqtt.min.js`) está salva localmente em `assets/js/`.

## 📋 Tabela pronta para o MQTTX (colar e disparar na apresentação)

> No MQTTX: **Host** `localhost` · **Porta** `8000` · **Protocolo** `ws` · **Tópico** `semaforo/estado` · **QoS** 0.
> Espaços ao redor do `=` são tolerados (`tempoVermelho=2` ou `tempoVermelho = 2`).
> O parser também aceita **JSON antigo** (`{"msg": "iniciar"}`) e **texto com aspas** (`"iniciar"`).

| # | Payload | O que faz |
|---|------------------------------|------------------------------------------------------------|
| 1 | `iniciar` | Liga o ciclo normal: Vermelho → Verde → Amarelo (repete) |
| 2 | `parar` | Desliga o semáforo (todas as luzes apagadas) |
| 3 | `ligarIntermitente` | Amarelo piscando (1s aceso / 1s apagado) |
| 4 | `tempoVermelho = X` | Altera o tempo do **vermelho** em segundos (ex.: `tempoVermelho = 2`) |
| 5 | `tempoAmarelo = X` | Altera o tempo do **amarelo** em segundos (ex.: `tempoAmarelo = 1`) |
| 6 | `tempoVerde = X` | Altera o tempo do **verde** em segundos (ex.: `tempoVerde = 4`) |

**Roteiro de apresentação sugerido:**
1. Envie `iniciar` → ciclo começa (3s vermelho, 3s verde, 1s amarelo).
2. Envie `tempoVerde = 6` → perceba o verde ficar mais tempo aceso.
3. Envie `parar` → tudo apaga.
4. Envie `ligarIntermitente` → amarelo piscando.
5. Envie `parar` → semáforo desligado (veja também que o `parar` manda em qualquer fluxo).

## 🔧 "O semáforo fica em parado e não executa as ações"

O estado inicial da página **é** `parado` (por design) — o semáforo só sai dele quando recebe `iniciar` pelo MQTT. Se ele **recebe** a mensagem (a barra de status mostra `Recebido: ...`) mas **não executa**:

1. **Confira o payload no MQTTX.** O comando precisa ser texto simples, sem aspas: `iniciar`, e não `"iniciar"`. (Hoje o parser já tolera aspas e o JSON antigo `{"msg": "..."}` — mas o mais seguro é enviar texto puro.)
2. **Confira o tópico e o host.** O MQTTX deve publicar em `semaforo/estado` no mesmo broker (`localhost:1880` TCP ou `localhost:8000` WebSocket).
3. **Veja a barra de status da página.** Ela mostra **exatamente** o que chegou (`Recebido: ...`), o comando interpretado (`Último comando: ...`) e o modo atual. Se `Recebido` mostrar algo diferente do payload digitado, o problema está no lado do MQTTX.
4. **Abra o console (F12).** Toda mensagem chega registrada com `Mensagem recebida: <payload>`.

## 🔁 "A página fica recarregando/piscando sozinha"

O código **não** recarrega a página (não há `location.reload()`), e a conexão MQTT reconecta sozinha a cada 3s apenas se o Docker cair. A página carregou esta única vez num teste de 30s (loads=1, unloads=0) — portando o recarregamento vem de **fora do código**:

1. **Olhe o contador `Recarregamentos` na barra de status** (canto da página). Se ficar em `1`, não há reload. Se **subir sozinho** sem você apertar F5, é algo recarregando a aba.
2. **Causas típicas:** extensão de *auto-refresh* (Chrome/Edge "Live Reload", "Auto Refresh"), ferramenta de preview (Code Runner, Live Server que observa o arquivo), ou abrir pelo IDE com watcher.
3. **Teste limpo:** desative essas extensões/tools e abra o `index.html` clicando 2× no arquivo (sem Live Server). Se parar de piscar, a causa era a ferramenta.
4. Extra: com um **servidor** (ex.: `python -m http.server`) o comportamento não muda, pois a página não depende de backend.

## 🗺️ Mapa do código (para o professor pedir mudanças na hora)

Tudo está em um arquivo só: `application/simulador/index.html`, dividido em seções numeradas e comentadas:

| Seção | Onde está | Regra que controla |
|---|---|---|
| Configurações (broker/tópico) | `1. CONFIGURAÇÕES` | Mudar host/porta/tópico do MQTT |
| Tempos padrão (segundos) | `2. ESTADO DO SEMÁFORO` | Valores iniciais de V/A/G |
| Aparência das luzes | `ESTADO 1/2/3` + CSS `.sf-luz` | Como a luz "acende" |
| Ciclo normal | `4. MÁQUINA DE ESTADOS` → `iniciarCiclo()` | Ordem V→G→A (blocos `ESTADO 1`, `ESTADO 2`, `ESTADO 3`) |
| Intermitente | `4. MÁQUINA DE ESTADOS` → `modoIntermitente()` | Ritmo do pisca-pisca |
| Parser dos comandos | `5. PARSER DOS COMANDOS` | Adicionar/alterar comandos (funciona com texto puro, aspas ou JSON `{"msg"}`) |
| Reconexão automática | `6. MQTT` → `conectar()` | Ajustar intervalo de `setInterval` (reconecta se o Docker subir depois) |

**Exemplo rápido de mudança na hora:**
- Trocar a ordem do ciclo → reordenar os três blocos `ESTADO X` dentro de `iniciarCiclo()`.
- Mudar o ritmo do pisca → alterar os `esperar(1)` dentro de `modoIntermitente()`.
- Adicionar um comando novo → incluir um `case` no parser (seção 5).

## 🛠️ Tecnologias Utilizadas
* **Front-end:** HTML, CSS e JavaScript puros (uma única página, sem frameworks).
* **Comunicação:** MQTT via WebSocket (biblioteca Paho salva localmente) + broker Mosquitto no Docker.
* **Hardware (futuro):** Placa ESP32, Linguagem C/C++.