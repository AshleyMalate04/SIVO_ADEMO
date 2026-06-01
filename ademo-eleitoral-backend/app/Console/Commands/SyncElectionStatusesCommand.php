<?php

namespace App\Console\Commands;

use App\Services\ElectionStatusSyncService;
use Illuminate\Console\Command;

class SyncElectionStatusesCommand extends Command
{
    protected $signature = 'elections:sync-statuses';

    protected $description = 'Sincroniza automaticamente os estados das eleicoes com base em data/hora.';

    public function handle(ElectionStatusSyncService $syncService): int
    {
        $updated = $syncService->sync();
        $this->info("Estados actualizados: {$updated}");

        return self::SUCCESS;
    }
}
