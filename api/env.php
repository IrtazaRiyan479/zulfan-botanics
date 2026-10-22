<?php
function app_env(string $key, string $default = ''): string {
    $value = getenv($key);
    if ($value !== false) return (string)$value;
    static $fileValues = null;
    if ($fileValues === null) {
        $fileValues = [];
        $envFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (is_file($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
                [$name, $val] = explode('=', $line, 2);
                $name = trim($name);
                $val = trim($val);
                if (strlen($val) >= 2 && (($val[0] === '"' && substr($val, -1) === '"') || ($val[0] === "'" && substr($val, -1) === "'"))) $val = substr($val, 1, -1);
                $fileValues[$name] = $val;
            }
        }
    }
    return $fileValues[$key] ?? $default;
}
function api_json(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function api_input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}
function api_method(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) api_json(405, ['ok'=>false,'error'=>'Method not allowed']);
}
