<?php

namespace App\Validation;

use App\Http\HttpError;

/**
 * Minimal port of the Zod schemas used by the Node backend.
 * Same semantics where it matters: unknown keys are stripped, defaults apply only to missing keys,
 * optional() does not accept null, coerce turns query-string values into numbers,
 * and errors are reported as [{ path, message }] under VALIDATION_ERROR.
 */
final class Rule
{
    private string $type;
    private bool $coerce = false;
    private bool $optional = false;
    private bool $nullable = false;
    private bool $hasDefault = false;
    private $default = null;
    private bool $trim = false;
    private array $checks = [];
    private ?array $values = null;
    private ?Rule $items = null;
    private ?array $shape = null;

    private function __construct(string $type)
    {
        $this->type = $type;
    }

    // ---- constructors ------------------------------------------------------

    public static function str(): self
    {
        return new self('string');
    }

    public static function num(): self
    {
        return new self('number');
    }

    /** z.coerce.number() */
    public static function coerceNum(): self
    {
        $r = new self('number');
        $r->coerce = true;
        return $r;
    }

    public static function bool(): self
    {
        return new self('boolean');
    }

    public static function oneOf(array $values): self
    {
        $r = new self('enum');
        $r->values = $values;
        return $r;
    }

    public static function listOf(Rule $items): self
    {
        $r = new self('array');
        $r->items = $items;
        return $r;
    }

    public static function obj(array $shape): self
    {
        $r = new self('object');
        $r->shape = $shape;
        return $r;
    }

    // ---- modifiers (each returns a copy) -----------------------------------

    public function min($n): self
    {
        return $this->check('min', $n);
    }

    public function max($n): self
    {
        return $this->check('max', $n);
    }

    public function integer(): self
    {
        return $this->check('int');
    }

    public function positive(): self
    {
        return $this->check('positive');
    }

    public function email(): self
    {
        return $this->check('email');
    }

    public function regex(string $pattern): self
    {
        return $this->check('regex', $pattern);
    }

    public function trimmed(): self
    {
        $c = clone $this;
        $c->trim = true;
        return $c;
    }

    public function optional(): self
    {
        $c = clone $this;
        $c->optional = true;
        return $c;
    }

    public function nullable(): self
    {
        $c = clone $this;
        $c->nullable = true;
        return $c;
    }

    public function withDefault($value): self
    {
        $c = clone $this;
        $c->hasDefault = true;
        $c->default = $value;
        return $c;
    }

    /** Zod .partial(): every key optional, and defaults no longer applied. */
    public function partial(): self
    {
        $c = clone $this;
        $shape = [];
        foreach ($this->shape ?? [] as $key => $rule) {
            $r = clone $rule;
            $r->optional = true;
            $r->hasDefault = false;
            $r->default = null;
            $shape[$key] = $r;
        }
        $c->shape = $shape;
        return $c;
    }

    public function omit(array $keys): self
    {
        $c = clone $this;
        $c->shape = array_diff_key($this->shape ?? [], array_flip($keys));
        return $c;
    }

    private function check(string $name, $arg = null): self
    {
        $c = clone $this;
        $c->checks[] = [$name, $arg];
        return $c;
    }

    // ---- parsing -----------------------------------------------------------

    /** Validates $input and returns the cleaned value, or throws a 400 VALIDATION_ERROR. */
    public function parse($input)
    {
        $issues = [];
        if ($input === null) {
            $issues[] = ['path' => '', 'message' => 'Required'];
            throw HttpError::validation($issues);
        }
        $out = $this->run($input, [], $issues);
        if ($issues) {
            throw HttpError::validation($issues);
        }
        return $out;
    }

    private function run($value, array $path, array &$issues)
    {
        if ($value === null) {
            if ($this->nullable) {
                return null;
            }
            $this->issue($issues, $path, 'Expected ' . $this->expected() . ', received null');
            return null;
        }

        switch ($this->type) {
            case 'string':
                return $this->runString($value, $path, $issues);
            case 'number':
                return $this->runNumber($value, $path, $issues);
            case 'boolean':
                if (!is_bool($value)) {
                    $this->issue($issues, $path, 'Expected boolean, received ' . self::typeOf($value));
                }
                return $value;
            case 'enum':
                if (!is_string($value) || !in_array($value, $this->values, true)) {
                    $expected = "'" . implode("' | '", $this->values) . "'";
                    $received = is_string($value) ? "'" . $value . "'" : self::typeOf($value);
                    $this->issue($issues, $path, 'Invalid enum value. Expected ' . $expected . ', received ' . $received);
                }
                return $value;
            case 'array':
                return $this->runArray($value, $path, $issues);
            case 'object':
                return $this->runObject($value, $path, $issues);
        }
        return $value;
    }

    private function runString($value, array $path, array &$issues)
    {
        if (!is_string($value)) {
            $this->issue($issues, $path, 'Expected string, received ' . self::typeOf($value));
            return $value;
        }
        if ($this->trim) {
            $value = trim($value);
        }
        $len = self::length($value);
        foreach ($this->checks as [$name, $arg]) {
            if ($name === 'min' && $len < $arg) {
                $this->issue($issues, $path, 'String must contain at least ' . $arg . ' character(s)');
            } elseif ($name === 'max' && $len > $arg) {
                $this->issue($issues, $path, 'String must contain at most ' . $arg . ' character(s)');
            } elseif ($name === 'email' && filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
                $this->issue($issues, $path, 'Invalid email');
            } elseif ($name === 'regex' && !preg_match($arg, $value)) {
                $this->issue($issues, $path, 'Invalid');
            }
        }
        return $value;
    }

    private function runNumber($value, array $path, array &$issues)
    {
        if ($this->coerce) {
            $value = self::toNumber($value);
            if ($value === null) {
                $this->issue($issues, $path, 'Expected number, received nan');
                return null;
            }
        }
        if (!is_int($value) && !is_float($value)) {
            $this->issue($issues, $path, 'Expected number, received ' . self::typeOf($value));
            return $value;
        }
        if (is_float($value) && !is_finite($value)) {
            $this->issue($issues, $path, 'Expected number, received nan');
            return $value;
        }
        $isInt = false;
        foreach ($this->checks as [$name, $arg]) {
            if ($name === 'int') {
                if (is_float($value) && floor($value) != $value) {
                    $this->issue($issues, $path, 'Expected integer, received float');
                } else {
                    $isInt = true;
                }
            } elseif ($name === 'min' && $value < $arg) {
                $this->issue($issues, $path, 'Number must be greater than or equal to ' . $arg);
            } elseif ($name === 'max' && $value > $arg) {
                $this->issue($issues, $path, 'Number must be less than or equal to ' . $arg);
            } elseif ($name === 'positive' && $value <= 0) {
                $this->issue($issues, $path, 'Number must be greater than 0');
            }
        }
        return $isInt ? (int) $value : $value;
    }

    private function runArray($value, array $path, array &$issues)
    {
        if (!is_array($value) || !self::isList($value)) {
            $this->issue($issues, $path, 'Expected array, received ' . self::typeOf($value));
            return $value;
        }
        $count = count($value);
        foreach ($this->checks as [$name, $arg]) {
            if ($name === 'min' && $count < $arg) {
                $this->issue($issues, $path, 'Array must contain at least ' . $arg . ' element(s)');
            } elseif ($name === 'max' && $count > $arg) {
                $this->issue($issues, $path, 'Array must contain at most ' . $arg . ' element(s)');
            }
        }
        $out = [];
        foreach ($value as $i => $item) {
            $out[] = $this->items->run($item, array_merge($path, [$i]), $issues);
        }
        return $out;
    }

    private function runObject($value, array $path, array &$issues)
    {
        if (!is_array($value) || (count($value) > 0 && self::isList($value))) {
            $this->issue($issues, $path, 'Expected object, received ' . self::typeOf($value));
            return $value;
        }
        $out = [];
        foreach ($this->shape as $key => $rule) {
            $keyPath = array_merge($path, [$key]);
            if (!array_key_exists($key, $value)) {
                if ($rule->hasDefault) {
                    $out[$key] = $rule->run($rule->default, $keyPath, $issues);
                } elseif (!$rule->optional) {
                    $this->issue($issues, $keyPath, 'Required');
                }
                continue;
            }
            $out[$key] = $rule->run($value[$key], $keyPath, $issues);
        }
        return $out;
    }

    // ---- helpers -----------------------------------------------------------

    private function issue(array &$issues, array $path, string $message): void
    {
        $issues[] = ['path' => implode('.', $path), 'message' => $message];
    }

    private function expected(): string
    {
        return $this->type === 'enum' ? "'" . implode("' | '", $this->values) . "'" : $this->type;
    }

    /** JavaScript Number(value); null when the result would be NaN. */
    private static function toNumber($v)
    {
        if (is_int($v) || is_float($v)) {
            return $v;
        }
        if (is_bool($v)) {
            return $v ? 1 : 0;
        }
        if (is_string($v)) {
            $t = trim($v);
            if ($t === '') {
                return 0;
            }
            if (is_numeric($t)) {
                return $t + 0;
            }
        }
        return null;
    }

    private static function typeOf($v): string
    {
        if ($v === null) {
            return 'null';
        }
        if (is_bool($v)) {
            return 'boolean';
        }
        if (is_int($v) || is_float($v)) {
            return 'number';
        }
        if (is_string($v)) {
            return 'string';
        }
        if (is_array($v)) {
            return (count($v) > 0 && self::isList($v)) ? 'array' : 'object';
        }
        return gettype($v);
    }

    private static function isList(array $a): bool
    {
        $i = 0;
        foreach ($a as $k => $_) {
            if ($k !== $i++) {
                return false;
            }
        }
        return true;
    }

    private static function length(string $s): int
    {
        return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : (int) preg_match_all('/./us', $s);
    }
}
