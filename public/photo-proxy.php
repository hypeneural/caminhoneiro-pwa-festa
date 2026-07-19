<?php
declare(strict_types=1);

const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

function fail(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo $message;
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    fail(405, 'Método não permitido.');
}

$source = filter_input(INPUT_GET, 'url', FILTER_UNSAFE_RAW);
if (!is_string($source) || $source === '') {
    fail(400, 'URL da imagem não informada.');
}

$parts = parse_url($source);
if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https') {
    fail(400, 'URL da imagem inválida.');
}

$host = strtolower((string) ($parts['host'] ?? ''));
$path = (string) ($parts['path'] ?? '');
$allowedPaths = [
    'fotos.festadoscaminhoneiros.com.br' => ['/img/'],
    'festadoscaminhoneiros.com.br' => ['/assets/images/advertisers/icon/'],
];

if (!isset($allowedPaths[$host])) {
    fail(403, 'Domínio de imagem não permitido.');
}

$pathAllowed = false;
foreach ($allowedPaths[$host] as $prefix) {
    if (strpos($path, $prefix) === 0) {
        $pathAllowed = true;
        break;
    }
}

if (!$pathAllowed) {
    fail(403, 'Caminho de imagem não permitido.');
}

$contentType = '';
$contentLength = null;
$curl = curl_init($source);
if ($curl === false) {
    fail(500, 'Não foi possível preparar a imagem.');
}

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    CURLOPT_HTTPHEADER => ['Accept: image/avif,image/webp,image/jpeg,image/png'],
    CURLOPT_USERAGENT => 'FestaCaminhoneirosGallery/1.0',
    CURLOPT_HEADERFUNCTION => static function ($handle, string $header) use (&$contentType, &$contentLength): int {
        $length = strlen($header);
        $separator = strpos($header, ':');
        if ($separator === false) {
            return $length;
        }

        $name = strtolower(trim(substr($header, 0, $separator)));
        $value = trim(substr($header, $separator + 1));

        if ($name === 'content-type') {
            $contentType = strtolower($value);
        } elseif ($name === 'content-length' && ctype_digit($value)) {
            $contentLength = (int) $value;
        }

        return $length;
    },
]);

if ($contentLength !== null && $contentLength > MAX_IMAGE_BYTES) {
    curl_close($curl);
    fail(413, 'Imagem acima do limite permitido.');
}

$body = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$error = curl_error($curl);
curl_close($curl);

if (!is_string($body) || $body === '' || $status < 200 || $status >= 300) {
    fail(502, $error !== '' ? 'Falha ao buscar a imagem.' : 'Imagem indisponível.');
}

if (strlen($body) > MAX_IMAGE_BYTES) {
    fail(413, 'Imagem acima do limite permitido.');
}

$mime = trim(strtok($contentType, ';') ?: '');
if (strpos($mime, 'image/') !== 0) {
    fail(415, 'O arquivo retornado não é uma imagem.');
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . strlen($body));
header('Cache-Control: public, max-age=86400, stale-while-revalidate=604800');
header('X-Content-Type-Options: nosniff');
echo $body;
