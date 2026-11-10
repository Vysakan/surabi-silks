<?php

namespace App\Http;

final class Request
{
    public string $method = 'GET';
    /** Path relative to /api/v1, e.g. "/products/12". */
    public string $path = '/';
    public array $query = [];
    public array $params = [];
    public array $cookies = [];
    private array $headers = [];

    /** Set by the auth middleware. */
    public ?array $user = null;
    public ?string $sessionId = null;
    /** Set by the validation middleware. */
    public $validated = null;

    private $body = null;
    private bool $bodyParsed = false;

    public static function fromGlobals(): self
    {
        $r = new self();
        $r->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $r->query = $_GET;
        $r->cookies = $_COOKIE;

        foreach ($_SERVER as $key => $value) {
            if (strncmp($key, 'HTTP_', 5) === 0) {
                $r->headers[strtolower(str_replace('_', '-', substr($key, 5)))] = (string) $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $r->headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $r->headers['content-length'] = (string) $_SERVER['CONTENT_LENGTH'];
        }

        $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        if (!is_string($uriPath)) {
            $uriPath = '/';
        }
        if (preg_match('#^.*?/api/v1(?=/|$)(.*)$#', $uriPath, $m)) {
            $rest = rtrim($m[1], '/');
            $r->path = $rest === '' ? '/' : $rest;
        } else {
            $r->path = '/__not_api__';
        }
        return $r;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }

    /**
     * Parsed request body: array for JSON / form posts, null when there is no parsable body
     * (mirrors express.json() + express.urlencoded()).
     */
    public function body()
    {
        if ($this->bodyParsed) {
            return $this->body;
        }
        $this->bodyParsed = true;

        $type = strtolower($this->header('content-type') ?? '');
        if (strpos($type, 'application/json') !== false || preg_match('#\+json\b#', $type)) {
            $raw = (string) file_get_contents('php://input');
            if (strlen($raw) > 1024 * 1024) {
                throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
            }
            if (trim($raw) === '') {
                $this->body = [];
                return $this->body;
            }
            $data = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                throw new HttpError(400, 'INVALID_JSON', 'Malformed JSON in request body');
            }
            $this->body = $data;
        } elseif (strpos($type, 'application/x-www-form-urlencoded') !== false
            || strpos($type, 'multipart/form-data') !== false) {
            $this->body = $_POST;
        }
        return $this->body;
    }
}
