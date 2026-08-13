# 🚦 Semáforo IoT com ESP32

## 📝 Sobre o Projeto
Este projeto consiste no desenvolvimento de um sistema de semáforo inteligente. A iniciativa é dividida em duas fases principais:
1. **Fase de Software (Atual):** Desenvolvimento de uma interface web interativa onde é possível simular o funcionamento do semáforo, ajustar os tempos de cada luz (verde, amarelo e vermelho) e salvar as configurações no navegador.
2. **Fase de Hardware (Futura):** Integração do sistema web com um microcontrolador **ESP32**, permitindo que os comandos da interface gráfica controlem LEDs físicos e vice-versa.

## ✨ Funcionalidades (Interface Web)
- Ciclo automático do semáforo (Vermelho -> Verde -> Amarelo).
- Modo intermitente (luz amarela piscando).
- Configuração personalizada do tempo de cada luz (em milissegundos).
- Persistência de dados: os tempos configurados são salvos no `localStorage` do navegador.

## 🚀 Próximos Passos (Integração com ESP32)
- [ ] Configurar o ESP32 para se conectar à rede Wi-Fi.
- [ ] Criar um servidor web/API embarcado no ESP32 ou utilizar protocolo MQTT.
- [ ] Fazer a comunicação entre a interface (JavaScript) e o hardware (C/C++).
- [ ] Montagem do circuito físico com LEDs e resistores na protoboard.

## 🛠️ Tecnologias Utilizadas
* **Front-end:** HTML, CSS, e JavaScript Vanilla (Orientação a Objetos).
* **Armazenamento:** Web Storage API (`localStorage`).
* **Hardware (Em breve):** Placa ESP32, Linguagem C/C++ (Arduino IDE ou PlatformIO).
