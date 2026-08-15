# 🚦 Semáforo IoT com ESP32

## 📝 Sobre o Projeto
Este projeto consiste no desenvolvimento de um sistema de semáforo inteligente. A iniciativa é dividida em duas fases principais:

1. **Fase de Software:** Desenvolvimento de uma interface web interativa onde é possível simular o funcionamento do semáforo, ajustar os tempos de cada luz (verde, amarelo e vermelho) e salvar as configurações no navegador.
2. **Fase de Hardware:** Integração do sistema web com um microcontrolador **ESP32**, permitindo que os comandos da interface gráfica controlem LEDs físicos e vice-versa.

## ✨ Funcionalidades (Interface Web)
- Ciclo automático do semáforo (Vermelho -> Verde -> Amarelo).
- Modo intermitente (luz amarela piscando).
- Configuração personalizada do tempo de cada luz.
- Persistência de dados: os tempos configurados são salvos no `localStorage` do navegador.

## 📡 Broker MQTT (Docker)
A comunicação entre a interface web é feita via MQTT, usando um broker Mosquitto que roda localmente em Docker.
Instruções completas de como subir o broker estão na pasta [`docker/`](./docker/README.md).

## 🛠️ Tecnologias Utilizadas
* **Front-end:** HTML, CSS, e JavaScript.
* **Armazenamento:** Web Storage API (`localStorage`).
* **Comunicação:** MQTT (broker Mosquitto via Docker).
* **Hardware:** Placa ESP32, Linguagem C/C++.
