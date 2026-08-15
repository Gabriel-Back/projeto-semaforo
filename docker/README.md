# Docker - Broker MQTT (Mosquitto)

Esta pasta contém tudo o que é necessário para subir o broker MQTT local usado pelo projeto do semáforo.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.

## Como subir o broker

Dentro desta pasta (`docker/`), rode:

```bash
docker compose up -d --build
```

## Portas disponíveis após subir

| Protocolo | Endereço |
|---|---|
| MQTT (TCP) | `mqtt://localhost:1880` |
| MQTT via WebSocket | `ws://localhost:8000` |

## Estrutura desta pasta

```
docker/
├── Dockerfile              # Constrói a imagem já com o mosquitto.conf embutido
├── docker-compose.yml      # Define o serviço do broker Mosquitto
├── README.md               # Este arquivo
├── mosquitto.conf          # Configuração do broker (portas, persistência, etc.)
├── data/                   # Gerado automaticamente pelo Mosquitto (não versionado)
└── log/                    # Gerado automaticamente pelo Mosquitto (não versionado)
```

## Observações importantes

- O broker está configurado com `allow_anonymous true` (sem autenticação). Adequado apenas para desenvolvimento local.
- As pastas `data/` e `log/` são criadas automaticamente pelo Docker ao subir o container, mesmo que não existam ainda no repositório.
- `data/`, `log/` e `passwd` (caso autenticação seja configurada no futuro) não devem ser versionados — devem estar no `.gitignore` da raiz do projeto.