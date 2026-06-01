<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RepairMojibakeCommand extends Command
{
    protected $signature = 'encoding:repair-mojibake {--commit : Grava as correccoes na base de dados}';

    protected $description = 'Localiza e corrige texto mojibake como VotaÃ§Ã£o para Votacao.';

    public function handle(): int
    {
        $commit = (bool) $this->option('commit');
        $changed = 0;

        foreach ($this->textColumns() as $column) {
            $rows = DB::table($column->table_name)
                ->select('id', $column->column_name)
                ->whereNotNull($column->column_name)
                ->get();

            foreach ($rows as $row) {
                $original = (string) $row->{$column->column_name};

                if (! $this->looksBroken($original)) {
                    continue;
                }

                $fixed = $this->repair($original);

                if ($fixed === $original || ! mb_check_encoding($fixed, 'UTF-8')) {
                    continue;
                }

                $changed++;
                $this->line(sprintf(
                    '%s.%s[%s]: %s -> %s',
                    $column->table_name,
                    $column->column_name,
                    $row->id,
                    $original,
                    $fixed
                ));

                if ($commit) {
                    DB::table($column->table_name)
                        ->where('id', $row->id)
                        ->update([$column->column_name => $fixed]);
                }
            }
        }

        $this->info($commit
            ? "Correccoes gravadas: {$changed}"
            : "Correccoes encontradas: {$changed}. Execute com --commit para gravar.");

        return self::SUCCESS;
    }

    private function textColumns(): array
    {
        return DB::select(
            <<<'SQL'
            select table_name, column_name
            from information_schema.columns
            where table_schema = 'public'
              and data_type in ('character varying', 'character', 'text')
              and exists (
                  select 1
                  from information_schema.columns ids
                  where ids.table_schema = information_schema.columns.table_schema
                    and ids.table_name = information_schema.columns.table_name
                    and ids.column_name = 'id'
              )
            order by table_name, column_name
            SQL
        );
    }

    private function looksBroken(string $value): bool
    {
        return preg_match('/(?:Ã.|Â.|â.|ï¿½|�)/u', $value) === 1;
    }

    private function repair(string $value): string
    {
        $fixed = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $value);

        return is_string($fixed) ? $fixed : $value;
    }
}
