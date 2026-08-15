var pahoConfig = {
    hostname: "localhost",  
    port: "8000",           
    clientId: "teste123"    
}

client = new Paho.Client(pahoConfig.hostname, Number(pahoConfig.port), pahoConfig.clientId);
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

client.connect({
    onSuccess: onConnect
});

function onConnect() {
    console.log("Connected with Server");
    client.subscribe("semaforo/estado");
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
}

function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.payloadString);
    let j = JSON.parse(message.payloadString);
    handleMessage(j);
}

function sendMessage(topic, message) {
    client.publish(topic, message)
}

function handleMessage(message) {
    if (message != null && message != undefined) {
        console.log(message)
        let mqttMessage = document.getElementById("mqtt-message");
        mqttMessage.innerHTML = message.msg;
    }
}