# Auditoria de preparação para produção — 13 de novembro de 2026

## A. Diagnóstico inicial

O projecto é uma aplicação eleitoral com API Laravel 13/PHP 8.4, PostgreSQL, Sanctum e Reverb, frontend React 19/Vite 8, e composição Docker para produção. O repositório já tinha muitas alterações locais antes desta auditoria; foram preservadas.

Riscos concretos encontrados nesta revisão: bypass da marcação de alteração da senha inicial, seeder capaz de repor a senha do administrador, documentos de candidatos escritos no disco público e servido por rota genérica, rota automática do disco `local` em `/storage/{path}`, dependências fixadas com avisos de segurança e bundle JavaScript inicial de cerca de 992 kB. O lint tinha seis avisos de dependências de hooks.

A interface tem estados de carregamento e componentes de gestão, mas não houve execução num navegador nem inspecção visual de todas as páginas e resoluções. Não é possível classificar a responsividade ou a coerência visual como verificadas apenas pela leitura do CSS e dos componentes.

## B. Melhorias implementadas

- **Segurança de contas:** a alteração de senha exige a senha actual correcta; a resposta a uma tentativa repetida já não marca a senha inicial como alterada. O seeder de administrador preserva uma conta existente.
- **Ficheiros:** documentos novos ficam no disco privado; a rota de descarga exige assinatura válida por uma hora, devolve o ficheiro como anexo e aceita ficheiros antigos do disco público. O caminho público genérico e o Nginx fornecido bloqueiam documentos. A rota automática de publicação do disco `local` foi desactivada. O cliente deixa de escolher o caminho de documento de outro candidato.
- **Dependências:** o lockfile Composer actualizou `league/commonmark` e componentes Symfony afectados. O lockfile npm actualizou Vite, Zod, `follow-redirects`, `source-map-js` e dependências associadas.
- **Desempenho/UX:** as 33 páginas React são carregadas por rota com estado de carregamento; o JavaScript inicial passou de cerca de 992 kB para 418 kB no build local. Os efeitos de carregamento e subscrições em tempo real usam callbacks estáveis, eliminando os seis avisos de hooks sem refetch inicial adicional.
- **Documentação:** README e guia Docker descrevem desenvolvimento, configuração, testes, armazenamento privado, migrações e requisitos de backup. O arranque Docker já não tenta criar um link público de storage.
- **Testes:** casos de regressão cobrem senha inicial, reexecução do seeder e acesso a documentos com assinatura válida, inválida e expirada.

## C. Validações realizadas

| Verificação | Resultado |
| --- | --- |
| `php artisan test` | 15 testes, 71 asserções, aprovados em SQLite em memória |
| `npm.cmd run lint` | 0 erros, 0 avisos |
| `npm.cmd run build` | Build concluído com Vite 8.3.8; chunk inicial de 418 kB |
| `composer audit --locked` | 0 avisos conhecidos após actualização |
| `npm.cmd audit --omit=dev` | 0 avisos conhecidos nas dependências de produção |
| `npm.cmd audit` completo | 4 avisos moderados ligados a `minimatch`/ESLint no conjunto de desenvolvimento |
| `php artisan route:cache` | Concluído; cache de rotas limpo após o teste |
| `docker compose config --no-env-resolution --no-interpolate --quiet` | Sintaxe validada; sem validar valores reais de ambiente |
| Navegador e tamanhos de ecrã | Não verificados |
| PostgreSQL, Reverb, SMTP, fila e backup/restauro reais | Não verificados |

O `git diff --check` não detectou erros de whitespace; o Git emitiu avisos de conversão LF/CRLF próprios da configuração local.

## D. Pendências e riscos

1. Os documentos antigos no disco público devem ser copiados para o privado, verificados por hash e só removidos do público após backup e autorização operacional. Confirmar que qualquer servidor/proxy fora do Nginx incluído também bloqueia `/storage/candidates/documents/`.
2. O token Sanctum ainda é guardado no `localStorage`; uma migração para cookies seguros exige desenho e testes de autenticação entre domínios. A senha inicial partilhada `12345678` e a resposta de recuperação que revela emails registados continuam a ser riscos conhecidos de regras operacionais existentes.
3. O anonimato do voto pode ser enfraquecido por correlação temporal entre participação e voto; os registos de auditoria não são imutáveis. É necessária revisão independente antes de uma eleição real.
4. Não há evidência de backup automático nem de ensaio de restauro. Definir retenção, protecção, RPO/RTO e testar recuperação tanto de PostgreSQL como do volume de ficheiros.
5. Executar testes de concorrência e fluxos completos num PostgreSQL de staging, verificar HTTPS, DNS, SMTP, Reverb, filas, logs, acessibilidade e layouts em telemóvel/tablet/desktop.
6. Os quatro avisos moderados npm restantes afectam ferramentas de desenvolvimento. A correcção indicada pelo `npm audit` implica mudar a versão principal do ESLint; requer teste de compatibilidade do lint.

## E. Avaliação de preparação para produção

| Área | Estado | Fundamentação |
| --- | --- | --- |
| Arquitectura e organização | Parcialmente conforme | Separação frontend/backend e Docker; integração real não exercitada |
| Interface e responsividade | Não verificado | Build e lint não substituem revisão visual e testes de navegação |
| Autenticação, autorização e segurança | Parcialmente conforme | Correcções e auditorias aprovadas; riscos de token, senha inicial e anonimato persistem |
| Integridade de dados | Parcialmente conforme | Migrações e testes SQLite; concorrência PostgreSQL não testada |
| Desempenho | Parcialmente conforme | Bundle inicial reduzido; carga e consultas reais não medidas |
| Testes | Parcialmente conforme | 15 testes aprovados; falta E2E, carga e PostgreSQL |
| Configuração e build | Parcialmente conforme | Build e sintaxe Docker validados; ambiente e serviços reais não verificados |
| Backups e recuperação | Não conforme | Sem prova de backup e restauro operacional |
| Documentação | Parcialmente conforme | Guias actualizados; runbooks e parâmetros reais dependem do operador |

**Conclusão:** o projecto está parcialmente preparado, mas não deve ser declarado pronto para uma eleição em produção enquanto os riscos de sigilo, recuperação e testes em ambiente equivalente ao real não forem tratados e validados.
