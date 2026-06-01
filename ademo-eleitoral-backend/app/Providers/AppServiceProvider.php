<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ini_set('default_charset', 'UTF-8');

        if (extension_loaded('mbstring')) {
            mb_internal_encoding('UTF-8');
            mb_http_output('UTF-8');
        }

        date_default_timezone_set(config('app.timezone', 'Africa/Maputo'));
    }
}
