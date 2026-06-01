<?php

namespace App\Support;

class CodeGenerator
{
    public static function make(string $prefix = '', int $length = 8): string
    {
        $code = strtoupper(substr(bin2hex(random_bytes($length)), 0, $length));

        return $prefix.$code;
    }
}
