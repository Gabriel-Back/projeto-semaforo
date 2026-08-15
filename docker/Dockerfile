FROM eclipse-mosquitto:2

RUN printf '%s\n' \
    "listener 1880" \
    "protocol mqtt" \
    "" \
    "listener 8000" \
    "protocol websockets" \
    "" \
    "persistence true" \
    "persistence_location /mosquitto/data/" \
    "" \
    "log_dest file /mosquitto/log/mosquitto.log" \
    "log_dest stdout" \
    "" \
    "allow_anonymous true" \
    > /mosquitto/config/mosquitto.conf