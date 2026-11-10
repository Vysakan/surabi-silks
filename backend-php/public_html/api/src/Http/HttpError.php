<?php

namespace App\Http;

/** Equivalent of the Node AppError family: becomes { error: { code, message, details? } }. */
class HttpError extends \RuntimeException
{
    public int $status;
    public string $errorCode;
    public ?array $details;

    public function __construct(int $status, string $errorCode, string $message, ?array $details = null)
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $errorCode;
        $this->details = $details;
    }

    public static function validation(array $details): self
    {
        return new self(400, 'VALIDATION_ERROR', 'Validation failed', $details);
    }

    public static function notFound(string $resource = 'Resource'): self
    {
        return new self(404, 'NOT_FOUND', $resource . ' not found');
    }

    public static function unauthorized(string $message = 'Authentication required'): self
    {
        return new self(401, 'UNAUTHORIZED', $message);
    }

    public static function forbidden(string $message = 'Insufficient permissions'): self
    {
        return new self(403, 'FORBIDDEN', $message);
    }

    public static function conflict(string $message = 'Resource already exists'): self
    {
        return new self(409, 'CONFLICT', $message);
    }
}
