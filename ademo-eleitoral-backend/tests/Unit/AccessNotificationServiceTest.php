<?php

namespace Tests\Unit;

use App\Services\AccessNotificationService;
use PHPUnit\Framework\TestCase;

class AccessNotificationServiceTest extends TestCase
{
    public function test_initial_password_is_the_expected_first_access_password(): void
    {
        $this->assertSame('12345678', AccessNotificationService::generateInitialPassword());
    }
}
