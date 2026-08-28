<?php
/*
 * Servidor HTTP estático MÍNIMO para a apresentação do semáforo.
 *
 * Por que existe: o "Live Server" do VS Code recarrega a página em loop
 * no Windows (falso positivo do watcher). Este servidor NÃO tem hot-reload,
 * por isso a página fica 100% estável — exatamente o que você quer num
 * ao vivo. O código do semáforo é o mesmo; mudou só a forma de servir.
 *
 * Como usar (nesta pasta do projeto):
 *   1. `php -S 127.0.0.1:5501 serve.php`
 *   2. Abra  http://127.0.0.1:5501/application/simulador/
 *   (Ou use o atalho  abrir-semaforo.cmd  que já faz os dois passos.)
 */

$document = @$_GET['p'] ?: 'application/simulador/';

// Só serve caminhos dentro desta pasta (não deixa escapar para cima).
$docRoot  = realpath(__DIR__);
$target   = realpath($docRoot . DIRECTORY_SEPARATOR . $document);

if ($target === false
    || strpos($target, $docRoot) !== 0
    || !is_file($target)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    exit("404 - Arquivo não encontrado: $document");
}

// Extensão -> Content-Type (fácil de estender se precisar de .png/.map etc).
$tipos = [
    'html' => 'text/html; charset=utf-8',
    'css'  => 'text/css; charset=utf-8',
    'js'   => 'application/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'txt'  => 'text/plain; charset=utf-8',
    'woff2'=> 'font/woff2',
    'woff' => 'font/woff',
    'ttf'  => 'font/ttf',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'ico'  => 'image/x-icon',
];

$ext = strtolower(pathinfo($target, PATHINFO_EXTENSION));
header('Content-Type: ' . ($tipos[$ext] ?? 'application/octet-stream'));
readfile($target);
