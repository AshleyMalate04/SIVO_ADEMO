# ADEMO - Sistema Eleitoral
# Solução para Eleições Híbridas: Online + Presencial
Documento técnico para adaptação do backend Laravel e frontend React
Data: 21/05/2026 | Versão: 1.0

> Objectivo: Definir como o sistema deve registar votos online, receber resultados presenciais, consolidar tudo e publicar apenas o resultado final oficial.

# 1. Contexto

A cliente informou que as eleições da ADEMO podem ocorrer de duas formas ao mesmo tempo: votação online e votação presencial. O sistema actual já tem estrutura para eleições, candidatos, eleitores autorizados, votos online, comprovativos e auditoria. O ponto que falta é garantir que o resultado final não mostre apenas a parte online, mas sim a soma oficial dos votos online com os votos presenciais.

A regra principal é: a eleição continua a ser uma só. Não se deve criar uma eleição separada para online e outra para presencial quando se trata do mesmo processo eleitoral.

# 2. Problema a resolver

Se o sistema mostrar apenas os votos registados online, os eleitores que participaram pela internet vão ver um resultado parcial. Isso é perigoso porque a mesma eleição também terá votos presenciais contados fora do sistema. O resultado correcto só pode ser divulgado depois da consolidação.

- Evitar que o eleitor veja apenas resultados da votação online.
- Permitir que a comissão registe os totais presenciais apurados em mesa.
- Permitir que fiscal ou comissão aprove os resultados presenciais antes da publicação.
- Somar votos online e presenciais no resultado final.
- Manter o sigilo do voto online, sem ligar cada voto ao membro ou utilizador.
- Guardar auditoria das acções sensíveis: registo, aprovação e publicação de resultados.

# 3. Decisão técnica principal

A solução recomendada é tratar a eleição como híbrida: uma única eleição pode ter votos online e votos presenciais. Os votos online são registados individualmente na tabela votes. Os votos presenciais devem ser registados como totais apurados por candidato, porque normalmente vêm de boletins em papel contados pela mesa eleitoral.

| Componente | Função |
| --- | --- |
| elections | Guarda a eleição única: título, órgão, cargo, datas, estado e criador. |
| votes | Guarda votos online sem ligação directa ao eleitor. |
| election_voters | Guarda os eleitores autorizados e pode indicar se o eleitor vota online ou presencial. |
| physical_vote_totals | Nova tabela para guardar os totais presenciais por candidato e votos em branco. |
| results | Endpoint lógico que devolve o resultado final consolidado. |

# 4. O que já existe no teu sistema

O schema actual já é uma boa base. A tabela elections representa a eleição; candidates representa candidatos por eleição; election_voters representa eleitores autorizados; votes representa votos sem ligação directa ao eleitor; vote_receipts guarda comprovativos; audit_logs guarda histórico de acções críticas.

Também já existem endpoints para eleições, candidatos, eleitores, votação, resultados e publicação de resultados. Portanto, a solução não exige recomeçar o projecto; exige apenas acrescentar o controlo da votação presencial e consolidar a resposta dos resultados.

# 5. Alterações recomendadas na base de dados

## 5.1. Adicionar modo de votação ao eleitor autorizado

A tabela election_voters deve indicar se o membro foi autorizado a votar online ou presencialmente. Isso evita que uma pessoa autorizada para voto presencial tente votar online, e também ajuda a validar se os totais presenciais não ultrapassam o número de eleitores presenciais autorizados.

```
php artisan make:migration add_voting_mode_to_election_voters_table
```

```
Schema::table('election_voters', function (Blueprint $table) {
    $table->string('voting_mode', 20)
        ->default('ONLINE')
        ->after('status');
});
```

## 5.2. Identificar a origem dos votos online

Embora a tabela votes seja usada principalmente para voto online, é útil adicionar uma coluna vote_origin. No MVP, todos os votos registados individualmente pelo sistema devem ser ONLINE. Isso deixa o modelo preparado caso no futuro a mesa presencial registe votos um a um.

```
php artisan make:migration add_vote_origin_to_votes_table
```

```
Schema::table('votes', function (Blueprint $table) {
    $table->string('vote_origin', 20)
        ->default('ONLINE')
        ->after('is_blank');
});
```

## 5.3. Criar tabela para totais presenciais

Esta é a parte mais importante da solução. A votação presencial não deve ser misturada directamente na tabela votes, porque normalmente a contagem física já vem apurada por candidato. A comissão deve lançar esses totais no sistema, e outro responsável deve aprovar.

```
php artisan make:migration create_physical_vote_totals_table
```

```
Schema::create('physical_vote_totals', function (Blueprint $table) {
    $table->id();

    $table->foreignId('election_id')
        ->constrained('elections')
        ->cascadeOnDelete();

    $table->foreignId('candidate_id')
        ->nullable()
        ->constrained('candidates')
        ->restrictOnDelete();

    $table->boolean('is_blank')->default(false);
    $table->unsignedInteger('total_votes')->default(0);

    $table->foreignId('entered_by')
        ->constrained('users')
        ->restrictOnDelete();

    $table->foreignId('approved_by')
        ->nullable()
        ->constrained('users')
        ->nullOnDelete();

    $table->string('status', 20)->default('DRAFT');
    $table->text('observation')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->timestamps();

    $table->unique(['election_id', 'candidate_id', 'is_blank'], 'uq_physical_total_item');
});
```

| Campo | Finalidade |
| --- | --- |
| election_id | Indica a eleição à qual o total presencial pertence. |
| candidate_id | Indica o candidato. Fica null quando for voto em branco. |
| is_blank | TRUE quando o registo representa votos em branco presenciais. |
| total_votes | Quantidade de votos presenciais contados. |
| entered_by | Utilizador da comissão que registou os totais. |
| approved_by | Fiscal ou comissário que aprovou os totais. |
| status | DRAFT, APPROVED ou CANCELLED. Só APPROVED entra no resultado final. |

## 5.4. Controlar publicação dos resultados

Podes usar o estado FINISHED da tabela elections para indicar que a eleição terminou, mas é melhor guardar também quem publicou o resultado e quando publicou. Para isso, adiciona campos de publicação na tabela elections.

```
php artisan make:migration add_result_publication_fields_to_elections_table
```

```
Schema::table('elections', function (Blueprint $table) {
    $table->string('results_status', 20)
        ->default('NOT_PUBLISHED')
        ->after('status');

    $table->timestamp('results_published_at')
        ->nullable()
        ->after('results_status');

    $table->foreignId('results_published_by')
        ->nullable()
        ->after('results_published_at')
        ->constrained('users')
        ->nullOnDelete();
});
```

# 6. Regras de negócio

| Regra | Descrição |
| --- | --- |
| RB01 | A mesma eleição pode aceitar votação online e presencial, mas continua a ser uma única eleição. |
| RB02 | O eleitor marcado como PRESENTIAL não deve conseguir votar no endpoint online de votação. |
| RB03 | O eleitor marcado como ONLINE não deve ser contado nos totais presenciais. |
| RB04 | O resultado parcial online não deve ser mostrado ao eleitor comum. |
| RB05 | Os totais presenciais só entram no resultado final quando estiverem com status APPROVED. |
| RB06 | O resultado final só deve ser publicado quando a eleição estiver fechada e os totais presenciais estiverem aprovados. |
| RB07 | O total presencial não pode ultrapassar a quantidade de eleitores presenciais autorizados. |
| RB08 | Todas as acções críticas devem ser registadas em audit_logs. |
| RB09 | O voto online deve continuar sem member_id e sem user_id na tabela votes, para manter o sigilo. |
| RB10 | Depois da publicação, o eleitor vê o resultado final consolidado, não apenas o online. |

# 7. Fluxo completo da solução

1. A comissão cria a eleição normalmente.
2. A comissão adiciona candidatos.
3. A comissão adiciona eleitores autorizados e define o modo de votação: ONLINE ou PRESENTIAL.
4. Os eleitores online votam no sistema. Os votos ficam na tabela votes.
5. Os eleitores presenciais votam em boletins físicos, na mesa eleitoral.
6. Depois da contagem presencial, a comissão regista os totais no endpoint de resultados presenciais.
7. O fiscal ou responsável aprova os totais presenciais.
8. O sistema calcula o resultado consolidado: online + presencial.
9. A comissão publica o resultado final.
10. O eleitor, no React, vê apenas o resultado final publicado.

# 8. Endpoints novos ou ajustados

Os endpoints existentes de resultados podem continuar, mas precisam devolver resultado consolidado. Para a votação presencial, adiciona endpoints próprios.

| Método | Endpoint | Permissão | Finalidade |
| --- | --- | --- | --- |
| POST | /api/elections/{id}/physical-results | COMMISSION | Registar ou actualizar totais presenciais. |
| GET | /api/elections/{id}/physical-results | COMMISSION, FISCAL, ADMIN | Consultar totais presenciais lançados. |
| PATCH | /api/elections/{id}/physical-results/approve | FISCAL ou COMMISSION autorizada | Aprovar totais presenciais. |
| GET | /api/results/{electionId} | Autorizados | Consultar resultado consolidado. |
| POST | /api/results/{electionId}/publish | COMMISSION | Publicar resultado final oficial. |

## 8.1. Exemplo de rotas em Laravel

```
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/elections/{election}/physical-results', [PhysicalResultController::class, 'store']);
    Route::get('/elections/{election}/physical-results', [PhysicalResultController::class, 'show']);
    Route::patch('/elections/{election}/physical-results/approve', [PhysicalResultController::class, 'approve']);

    Route::get('/results/{election}', [ResultController::class, 'show']);
    Route::post('/results/{election}/publish', [ResultController::class, 'publish']);
});
```

# 9. Exemplo de body para registar resultado presencial

A comissão envia os votos presenciais já contados. Cada item representa o total presencial de um candidato ou dos votos em branco.

```
{
  "results": [
    {
      "candidate_id": 1,
      "is_blank": false,
      "total_votes": 60
    },
    {
      "candidate_id": 2,
      "is_blank": false,
      "total_votes": 35
    },
    {
      "candidate_id": null,
      "is_blank": true,
      "total_votes": 5
    }
  ],
  "observation": "Resultados presenciais apurados pela mesa eleitoral."
}
```

# 10. Modelo Laravel recomendado

## 10.1. Model PhysicalVoteTotal

```
class PhysicalVoteTotal extends Model
{
    protected $fillable = [
        'election_id',
        'candidate_id',
        'is_blank',
        'total_votes',
        'entered_by',
        'approved_by',
        'status',
        'observation',
        'approved_at',
    ];

    protected $casts = [
        'is_blank' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function election()
    {
        return $this->belongsTo(Election::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }
}
```

## 10.2. Relações no model Election

```
public function physicalVoteTotals()
{
    return $this->hasMany(PhysicalVoteTotal::class);
}

public function votes()
{
    return $this->hasMany(Vote::class);
}

public function candidates()
{
    return $this->hasMany(Candidate::class);
}
```

# 11. Lógica para gravar totais presenciais

O controller deve validar se a eleição existe, se o utilizador tem permissão, se os candidatos pertencem à eleição e se o total de votos presenciais não ultrapassa o número de eleitores presenciais autorizados.

```
public function store(Request $request, Election $election)
{
    $data = $request->validate([
        'results' => ['required', 'array', 'min:1'],
        'results.*.candidate_id' => ['nullable', 'integer', 'exists:candidates,id'],
        'results.*.is_blank' => ['required', 'boolean'],
        'results.*.total_votes' => ['required', 'integer', 'min:0'],
        'observation' => ['nullable', 'string'],
    ]);

    $totalPresentialVotes = collect($data['results'])->sum('total_votes');

    $authorizedPresentialVoters = ElectionVoter::where('election_id', $election->id)
        ->where('status', 'AUTHORIZED')
        ->where('voting_mode', 'PRESENTIAL')
        ->count();

    if ($totalPresentialVotes > $authorizedPresentialVoters) {
        return response()->json([
            'message' => 'O total presencial ultrapassa o número de eleitores presenciais autorizados.'
        ], 422);
    }

    foreach ($data['results'] as $item) {
        PhysicalVoteTotal::updateOrCreate(
            [
                'election_id' => $election->id,
                'candidate_id' => $item['candidate_id'],
                'is_blank' => $item['is_blank'],
            ],
            [
                'total_votes' => $item['total_votes'],
                'entered_by' => auth()->id(),
                'status' => 'DRAFT',
                'observation' => $data['observation'] ?? null,
            ]
        );
    }

    return response()->json([
        'message' => 'Resultados presenciais registados com sucesso.'
    ], 201);
}
```

# 12. Lógica para aprovar totais presenciais

A aprovação transforma os totais presenciais em dados oficiais para o cálculo final. Enquanto estiverem em DRAFT, não entram no resultado final.

```
public function approve(Election $election)
{
    PhysicalVoteTotal::where('election_id', $election->id)
        ->where('status', 'DRAFT')
        ->update([
            'status' => 'APPROVED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

    return response()->json([
        'message' => 'Resultados presenciais aprovados com sucesso.'
    ]);
}
```

# 13. Como calcular o resultado final

O resultado final deve somar dois grupos: votos online registados individualmente na tabela votes e totais presenciais aprovados na tabela physical_vote_totals.

```
$result = Candidate::where('election_id', $election->id)
    ->with('member')
    ->get()
    ->map(function ($candidate) use ($election) {
        $onlineVotes = Vote::where('election_id', $election->id)
            ->where('candidate_id', $candidate->id)
            ->where('is_blank', false)
            ->count();

        $presentialVotes = PhysicalVoteTotal::where('election_id', $election->id)
            ->where('candidate_id', $candidate->id)
            ->where('is_blank', false)
            ->where('status', 'APPROVED')
            ->sum('total_votes');

        return [
            'candidate_id' => $candidate->id,
            'candidate_name' => $candidate->member->name,
            'online_votes' => $onlineVotes,
            'presential_votes' => $presentialVotes,
            'total_votes' => $onlineVotes + $presentialVotes,
        ];
    });
```

## 13.1. Votos em branco

```
$onlineBlankVotes = Vote::where('election_id', $election->id)
    ->where('is_blank', true)
    ->count();

$presentialBlankVotes = PhysicalVoteTotal::where('election_id', $election->id)
    ->where('is_blank', true)
    ->where('status', 'APPROVED')
    ->sum('total_votes');

$blankVotes = [
    'online' => $onlineBlankVotes,
    'presential' => $presentialBlankVotes,
    'total' => $onlineBlankVotes + $presentialBlankVotes,
];
```

# 14. Resposta ideal do endpoint de resultados

```
{
  "election_id": 1,
  "title": "Eleição do Presidente Provincial da ADEMO",
  "status": "FINISHED",
  "results_status": "PUBLISHED",
  "published": true,
  "results": [
    {
      "candidate_id": 1,
      "candidate_name": "Ana Manuel",
      "online_votes": 40,
      "presential_votes": 60,
      "total_votes": 100
    },
    {
      "candidate_id": 2,
      "candidate_name": "Carlos Jaime",
      "online_votes": 25,
      "presential_votes": 35,
      "total_votes": 60
    }
  ],
  "blank_votes": {
    "online": 2,
    "presential": 5,
    "total": 7
  }
}
```

# 15. Publicação do resultado final

A comissão só deve publicar o resultado quando a eleição estiver encerrada e os resultados presenciais estiverem aprovados. Antes disso, o endpoint pode devolver uma mensagem informando que os resultados ainda não foram publicados.

```
public function publish(Election $election)
{
    if (! in_array($election->status, ['CLOSED', 'FINISHED'])) {
        return response()->json([
            'message' => 'A eleição ainda não foi encerrada.'
        ], 422);
    }

    $hasDraftPhysicalResults = PhysicalVoteTotal::where('election_id', $election->id)
        ->where('status', 'DRAFT')
        ->exists();

    if ($hasDraftPhysicalResults) {
        return response()->json([
            'message' => 'Existem resultados presenciais ainda não aprovados.'
        ], 422);
    }

    $election->update([
        'results_status' => 'PUBLISHED',
        'results_published_at' => now(),
        'results_published_by' => auth()->id(),
        'status' => 'FINISHED',
    ]);

    return response()->json([
        'message' => 'Resultado final publicado com sucesso.'
    ]);
}
```

# 16. Como testar no Thunder Client

A ordem dos testes é importante. Primeiro autentica, depois cria dados base, depois cria eleição, adiciona candidatos e eleitores, regista votação online, lança resultado presencial, aprova e publica.

| Passo | Pedido | Objectivo |
| --- | --- | --- |
| 1 | POST /api/auth/login | Entrar como ADMIN ou COMMISSION. |
| 2 | POST /api/elections | Criar a eleição. |
| 3 | POST /api/elections/{id}/candidates | Adicionar candidatos. |
| 4 | POST /api/elections/{id}/voters | Adicionar eleitores com voting_mode ONLINE ou PRESENTIAL. |
| 5 | POST /api/voting/elections/{id}/confirm | Testar voto online com utilizador VOTER. |
| 6 | POST /api/elections/{id}/physical-results | Registar totais presenciais. |
| 7 | PATCH /api/elections/{id}/physical-results/approve | Aprovar totais presenciais. |
| 8 | POST /api/results/{id}/publish | Publicar resultado final. |
| 9 | GET /api/results/{id} | Ver resultado final consolidado. |

## 16.1. Exemplo de eleitor online

```
{
  "member_id": 1,
  "delegation_id": 1,
  "voting_mode": "ONLINE"
}
```

## 16.2. Exemplo de eleitor presencial

```
{
  "member_id": 2,
  "delegation_id": 1,
  "voting_mode": "PRESENTIAL"
}
```

# 17. Como deve ficar no React

No frontend React, a página pública ou do eleitor não deve chamar uma rota que devolve apenas votos online. Ela deve chamar o endpoint consolidado GET /api/results/{electionId}.

| Perfil | O que deve ver |
| --- | --- |
| VOTER | Resultado final publicado, de preferência apenas o total final por candidato. |
| COMMISSION | Resultado final e detalhe: online, presencial e total. |
| FISCAL | Detalhes de auditoria, resultado presencial lançado, aprovado e total consolidado. |
| ADMIN | Visão completa, incluindo logs e configuração. |

## 17.1. Exemplo de textos no ecrã

- Resultado ainda não publicado.
- Resultado final oficial.
- Total de votos: online + presencial.
- Resultado presencial pendente de aprovação.
- Resultado presencial aprovado.
- Publicado em: data e hora.

# 18. Cuidados importantes

- Não publiques resultados online antes de terminar a contagem presencial.
- Não mistures eleitor presencial com eleitor online sem uma regra clara.
- Não permitas que resultados presenciais em DRAFT entrem no total final.
- Não guardes member_id ou user_id na tabela votes, para não quebrar o sigilo.
- Regista logs sempre que alguém lançar, aprovar ou publicar resultados.
- Valida se o candidato pertence à eleição antes de aceitar votos ou totais presenciais.
- Valida se a soma presencial não ultrapassa os eleitores presenciais autorizados.
- Depois da publicação, bloqueia alterações ou cria um processo formal de rectificação.

# 19. Checklist de implementação

| Estado | Tarefa |
| --- | --- |
| [ ] | Criar migration para voting_mode em election_voters. |
| [ ] | Criar migration para vote_origin em votes. |
| [ ] | Criar migration da tabela physical_vote_totals. |
| [ ] | Adicionar campos de publicação de resultados em elections. |
| [ ] | Criar model PhysicalVoteTotal. |
| [ ] | Adicionar relações nos models Election, Candidate e PhysicalVoteTotal. |
| [ ] | Criar PhysicalResultController. |
| [ ] | Criar ResultController ou ajustar o existente. |
| [ ] | Adicionar rotas no api.php. |
| [ ] | Bloquear voto online para eleitor PRESENTIAL. |
| [ ] | Validar soma dos votos presenciais. |
| [ ] | Criar auditoria para registo, aprovação e publicação. |
| [ ] | Ajustar página de resultados no React. |
| [ ] | Testar tudo no Thunder Client. |

# 20. Conclusão

A solução correcta é manter uma eleição única e separar a origem dos resultados. O voto online fica registado individualmente na tabela votes. O voto presencial entra como total apurado e aprovado na tabela physical_vote_totals. O resultado final deve ser calculado pela soma dos dois e só deve ser apresentado ao eleitor depois da publicação oficial.

Com esta abordagem, o sistema continua seguro, mantém o sigilo do voto, evita resultados parciais enganadores e responde ao requisito da cliente: eleições online e presenciais para a mesma eleição.
