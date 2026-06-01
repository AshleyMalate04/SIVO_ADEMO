-- ============================================================
--  ADEMO — Queries de Operação (SELECT, INSERT, UPDATE, DELETE)
--  Organizado por tabela, seguindo a ordem de dependências
-- ============================================================


-- ============================================================
-- 1. PROVINCE
-- ============================================================

-- Ver todas as províncias
SELECT * FROM province ORDER BY name;

-- Ver apenas activas
SELECT * FROM province WHERE status = 'ACTIVE' ORDER BY name;

-- Pesquisar por nome
SELECT * FROM province WHERE name ILIKE '%maputo%';

-- Ver uma por ID
SELECT * FROM province WHERE id = 1;

-- Inserir
INSERT INTO province (name, code, status)
VALUES ('Maputo Cidade', 'MPC', 'ACTIVE');

-- Actualizar nome e código
UPDATE province
SET name = 'Maputo Cidade', code = 'MPC', updated_at = NOW()
WHERE id = 1;

-- Desactivar (soft delete recomendado)
UPDATE province SET status = 'INACTIVE', updated_at = NOW() WHERE id = 1;

-- Remover (apenas se não tiver distritos associados)
DELETE FROM province WHERE id = 1;


-- ============================================================
-- 2. DISTRIT
-- ============================================================

-- Ver todos os distritos com o nome da província
SELECT d.*, p.name AS province_name
FROM distrit d
JOIN province p ON p.id = d.province_id
ORDER BY p.name, d.name;

-- Ver distritos de uma província específica
SELECT * FROM distrit WHERE province_id = 1 ORDER BY name;

-- Pesquisar por nome
SELECT d.*, p.name AS province_name
FROM distrit d
JOIN province p ON p.id = d.province_id
WHERE d.name ILIKE '%matola%';

-- Ver um por ID
SELECT * FROM distrit WHERE id = 1;

-- Inserir
INSERT INTO distrit (province_id, name, code, status)
VALUES (1, 'Matola', 'MTL', 'ACTIVE');

-- Actualizar
UPDATE distrit
SET name = 'Matola', code = 'MTL', updated_at = NOW()
WHERE id = 1;

-- Desactivar
UPDATE distrit SET status = 'INACTIVE', updated_at = NOW() WHERE id = 1;

-- Remover
DELETE FROM distrit WHERE id = 1;


-- ============================================================
-- 3. DELEGATIONS
-- ============================================================

-- Ver todas as delegações com província e distrito
SELECT
    del.*,
    p.name  AS province_name,
    d.name  AS district_name
FROM delegations del
JOIN province  p ON p.id  = del.province_id
LEFT JOIN distrit d ON d.id = del.district_id
ORDER BY del.name;

-- Ver apenas activas
SELECT del.*, p.name AS province_name
FROM delegations del
JOIN province p ON p.id = del.province_id
WHERE del.status = 'ACTIVE';

-- Pesquisar por nome
SELECT * FROM delegations WHERE name ILIKE '%maputo%';

-- Ver uma por ID
SELECT * FROM delegations WHERE id = 1;

-- Inserir
INSERT INTO delegations (name, province_id, district_id, address, status)
VALUES ('Delegação Maputo', 1, 2, 'Av. Eduardo Mondlane, nº 100', 'ACTIVE');

-- Actualizar
UPDATE delegations
SET name = 'Delegação Maputo Centro', address = 'Av. 25 de Setembro, nº 50', updated_at = NOW()
WHERE id = 1;

-- Desactivar
UPDATE delegations SET status = 'INACTIVE', updated_at = NOW() WHERE id = 1;

-- Remover
DELETE FROM delegations WHERE id = 1;


-- ============================================================
-- 4. ORGANS
-- ============================================================

-- Ver todos
SELECT * FROM organs ORDER BY name;

-- Ver activos
SELECT * FROM organs WHERE status = 'ACTIVE';

-- Pesquisar por nome
SELECT * FROM organs WHERE name ILIKE '%assembleia%';

-- Ver um por ID
SELECT * FROM organs WHERE id = 1;

-- Inserir
INSERT INTO organs (name, description, status)
VALUES ('Assembleia Geral', 'Órgão máximo de deliberação da ADEMO', 'ACTIVE');

-- Actualizar
UPDATE organs
SET name = 'Assembleia Geral', description = 'Descrição actualizada', updated_at = NOW()
WHERE id = 1;

-- Desactivar
UPDATE organs SET status = 'INACTIVE', updated_at = NOW() WHERE id = 1;

-- Remover (apenas se não tiver cargos associados)
DELETE FROM organs WHERE id = 1;


-- ============================================================
-- 5. POSITIONS
-- ============================================================

-- Ver todos os cargos com o órgão
SELECT
    pos.*,
    o.name AS organ_name
FROM positions pos
JOIN organs o ON o.id = pos.organ_id
ORDER BY o.name, pos.name;

-- Ver cargos de um órgão específico
SELECT * FROM positions WHERE organ_id = 1 ORDER BY name;

-- Pesquisar por nome
SELECT pos.*, o.name AS organ_name
FROM positions pos
JOIN organs o ON o.id = pos.organ_id
WHERE pos.name ILIKE '%presidente%';

-- Ver um por ID
SELECT * FROM positions WHERE id = 1;

-- Inserir
INSERT INTO positions (organ_id, name, description, status)
VALUES (1, 'Presidente', 'Preside a Assembleia Geral', 'ACTIVE');

-- Actualizar
UPDATE positions
SET name = 'Vice-Presidente', updated_at = NOW()
WHERE id = 1;

-- Desactivar
UPDATE positions SET status = 'INACTIVE', updated_at = NOW() WHERE id = 1;

-- Remover
DELETE FROM positions WHERE id = 1;


-- ============================================================
-- 6. USERS
-- ============================================================

-- Ver todos com delegação
SELECT
    u.id, u.name, u.email, u.phone, u.role, u.status,
    u.access_code, u.last_login_at,
    d.name AS delegation_name
FROM users u
LEFT JOIN delegations d ON d.id = u.delegation_id
ORDER BY u.name;

-- Filtrar por papel (role)
SELECT * FROM users WHERE role = 'VOTER' ORDER BY name;
SELECT * FROM users WHERE role = 'ADMIN';
SELECT * FROM users WHERE role IN ('COMMISSION', 'FISCAL');

-- Filtrar por estado
SELECT * FROM users WHERE status = 'ACTIVE';
SELECT * FROM users WHERE status = 'BLOCKED';

-- Pesquisar por nome ou email
SELECT * FROM users WHERE name ILIKE '%silva%' OR email ILIKE '%silva%';

-- Ver um por ID
SELECT * FROM users WHERE id = 1;

-- Ver por código de acesso
SELECT * FROM users WHERE access_code = 'USR-2024-001';

-- Inserir
INSERT INTO users (name, access_code, email, phone, password, role, status, delegation_id)
VALUES ('João Silva', 'USR-2024-001', 'joao@ademo.mz', '+258840000001',
        'hash_da_password', 'VOTER', 'ACTIVE', 1);

-- Actualizar dados gerais
UPDATE users
SET name = 'João António Silva', email = 'joao.silva@ademo.mz', updated_at = NOW()
WHERE id = 1;

-- Actualizar papel
UPDATE users SET role = 'COMMISSION', updated_at = NOW() WHERE id = 1;

-- Bloquear utilizador
UPDATE users SET status = 'BLOCKED', updated_at = NOW() WHERE id = 1;

-- Activar utilizador
UPDATE users SET status = 'ACTIVE', updated_at = NOW() WHERE id = 1;

-- Registar último login
UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = 1;

-- Remover
DELETE FROM users WHERE id = 1;


-- ============================================================
-- 7. MEMBERS
-- ============================================================

-- Ver todos os membros com delegação
SELECT
    m.*,
    d.name AS delegation_name
FROM members m
JOIN delegations d ON d.id = m.delegation_id
ORDER BY m.name;

-- Filtrar por delegação
SELECT * FROM members WHERE delegation_id = 1 ORDER BY name;

-- Filtrar por estado
SELECT * FROM members WHERE status = 'ACTIVE';

-- Pesquisar por nome, email ou BI
SELECT * FROM members
WHERE name       ILIKE '%carlos%'
   OR email      ILIKE '%carlos%'
   OR bi_number  ILIKE '%123%';

-- Ver um por ID
SELECT * FROM members WHERE id = 1;

-- Ver por código de membro
SELECT * FROM members WHERE member_code = 'MBR-2024-001';

-- Inserir
INSERT INTO members (member_code, name, phone, email, bi_number, delegation_id, status, registered_at)
VALUES ('MBR-2024-001', 'Carlos Machava', '+258840000002', 'carlos@email.com',
        '123456789A', 1, 'ACTIVE', '2024-01-15');

-- Actualizar
UPDATE members
SET name = 'Carlos Ernesto Machava', phone = '+258840000099', updated_at = NOW()
WHERE id = 1;

-- Desactivar membro
UPDATE members SET status = 'INACTIVE', updated_at = NOW() WHERE id = 1;

-- Remover
DELETE FROM members WHERE id = 1;


-- ============================================================
-- 8. ELECTIONS
-- ============================================================

-- Ver todas as eleições com detalhes
SELECT
    e.*,
    o.name   AS organ_name,
    p.name   AS position_name,
    d.name   AS delegation_name,
    u.name   AS created_by_name
FROM elections e
JOIN organs      o ON o.id = e.organ_id
JOIN positions   p ON p.id = e.position_id
LEFT JOIN delegations d ON d.id = e.delegation_id
JOIN users       u ON u.id = e.created_by
ORDER BY e.starts_at DESC;

-- Filtrar por estado
SELECT * FROM elections WHERE status = 'OPEN';
SELECT * FROM elections WHERE status IN ('DRAFT', 'PUBLISHED');

-- Eleições abertas actualmente
SELECT * FROM elections
WHERE status = 'OPEN'
  AND starts_at <= NOW()
  AND ends_at   >= NOW();

-- Eleições encerradas
SELECT * FROM elections WHERE status = 'FINISHED' ORDER BY ends_at DESC;

-- Ver uma por ID
SELECT * FROM elections WHERE id = 1;

-- Ver segunda volta de uma eleição
SELECT * FROM elections WHERE parent_election_id = 1;

-- Pesquisar por título
SELECT * FROM elections WHERE title ILIKE '%presidente%';

-- Inserir
INSERT INTO elections (
    title, organ_id, position_id, delegation_id,
    round_number, starts_at, ends_at, description,
    allow_blank_vote, status, created_by
)
VALUES (
    'Eleição do Presidente da Assembleia Geral 2024',
    1, 1, NULL,
    1, '2024-06-01 08:00:00', '2024-06-01 18:00:00',
    'Primeira volta da eleição presidencial',
    TRUE, 'DRAFT', 1
);

-- Publicar eleição
UPDATE elections SET status = 'PUBLISHED', updated_at = NOW() WHERE id = 1;

-- Abrir votação
UPDATE elections SET status = 'OPEN', updated_at = NOW() WHERE id = 1;

-- Encerrar votação
UPDATE elections SET status = 'CLOSED', updated_at = NOW() WHERE id = 1;

-- Marcar como finalizada
UPDATE elections SET status = 'FINISHED', updated_at = NOW() WHERE id = 1;

-- Cancelar
UPDATE elections SET status = 'CANCELLED', updated_at = NOW() WHERE id = 1;

-- Actualizar datas
UPDATE elections
SET starts_at = '2024-06-05 08:00:00', ends_at = '2024-06-05 18:00:00', updated_at = NOW()
WHERE id = 1;

-- Remover (apenas em estado DRAFT)
DELETE FROM elections WHERE id = 1 AND status = 'DRAFT';


-- ============================================================
-- 9. ELECTION_TEAM
-- ============================================================

-- Ver equipa de uma eleição
SELECT
    et.*,
    u.name  AS user_name,
    u.role  AS user_role,
    e.title AS election_title
FROM election_team et
JOIN users     u ON u.id = et.user_id
JOIN elections e ON e.id = et.election_id
WHERE et.election_id = 1;

-- Ver todas as eleições onde um utilizador participa
SELECT
    et.role_in_election,
    e.title, e.status, e.starts_at
FROM election_team et
JOIN elections e ON e.id = et.election_id
WHERE et.user_id = 1;

-- Inserir membro na equipa
INSERT INTO election_team (election_id, user_id, role_in_election)
VALUES (1, 5, 'COMMISSION');

-- Alterar papel na equipa
UPDATE election_team
SET role_in_election = 'FISCAL', updated_at = NOW()
WHERE election_id = 1 AND user_id = 5;

-- Remover membro da equipa
DELETE FROM election_team WHERE election_id = 1 AND user_id = 5;

-- Remover toda a equipa de uma eleição
DELETE FROM election_team WHERE election_id = 1;


-- ============================================================
-- 10. CANDIDATES
-- ============================================================

-- Ver candidatos de uma eleição
SELECT
    c.*,
    m.name         AS member_name,
    m.member_code,
    p.name         AS position_name
FROM candidates c
JOIN members   m ON m.id = c.member_id
JOIN positions p ON p.id = c.position_id
WHERE c.election_id = 1
ORDER BY m.name;

-- Ver apenas aprovados
SELECT c.*, m.name AS member_name
FROM candidates c
JOIN members m ON m.id = c.member_id
WHERE c.election_id = 1 AND c.status = 'APPROVED';

-- Ver um candidato por ID
SELECT * FROM candidates WHERE id = 1;

-- Inserir candidato
INSERT INTO candidates (election_id, member_id, position_id, biography, proposal, status)
VALUES (1, 3, 1, 'Engenheiro com 10 anos de experiência', 'Proposta de modernização', 'PENDING');

-- Aprovar candidato
UPDATE candidates SET status = 'APPROVED', updated_at = NOW() WHERE id = 1;

-- Rejeitar candidato
UPDATE candidates SET status = 'REJECTED', updated_at = NOW() WHERE id = 1;

-- Actualizar biografia e proposta
UPDATE candidates
SET biography = 'Nova biografia', proposal = 'Nova proposta', updated_at = NOW()
WHERE id = 1;

-- Actualizar foto
UPDATE candidates SET photo_path = 'candidates/foto_joao.jpg', updated_at = NOW() WHERE id = 1;

-- Remover candidato
DELETE FROM candidates WHERE id = 1;


-- ============================================================
-- 11. ELECTION_VOTERS
-- ============================================================

-- Ver eleitores de uma eleição
SELECT
    ev.*,
    m.name        AS member_name,
    m.member_code,
    d.name        AS delegation_name
FROM election_voters ev
JOIN members    m ON m.id  = ev.member_id
LEFT JOIN delegations d ON d.id = ev.delegation_id
WHERE ev.election_id = 1
ORDER BY m.name;

-- Ver eleitores que ainda não votaram
SELECT ev.*, m.name AS member_name
FROM election_voters ev
JOIN members m ON m.id = ev.member_id
WHERE ev.election_id = 1 AND ev.has_voted = FALSE AND ev.status = 'AUTHORIZED';

-- Ver eleitores que já votaram
SELECT ev.*, m.name AS member_name
FROM election_voters ev
JOIN members m ON m.id = ev.member_id
WHERE ev.election_id = 1 AND ev.has_voted = TRUE;

-- Contagem de participação por eleição
SELECT
    election_id,
    COUNT(*)                                        AS total_eleitores,
    SUM(CASE WHEN has_voted THEN 1 ELSE 0 END)     AS votaram,
    SUM(CASE WHEN NOT has_voted THEN 1 ELSE 0 END) AS nao_votaram,
    ROUND(
        SUM(CASE WHEN has_voted THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(*), 0) * 100, 2
    )                                               AS percentagem_participacao
FROM election_voters
WHERE status = 'AUTHORIZED'
GROUP BY election_id;

-- Verificar se um membro é eleitor autorizado
SELECT * FROM election_voters
WHERE election_id = 1 AND member_id = 3 AND status = 'AUTHORIZED';

-- Inserir eleitor
INSERT INTO election_voters (election_id, member_id, delegation_id, status, voter_hash)
VALUES (1, 3, 1, 'AUTHORIZED', md5(random()::text));

-- Inserir múltiplos eleitores de uma delegação
INSERT INTO election_voters (election_id, member_id, delegation_id, status, voter_hash)
SELECT 1, m.id, m.delegation_id, 'AUTHORIZED', md5(m.id::text || '1' || NOW()::text)
FROM members m
WHERE m.delegation_id = 1 AND m.status = 'ACTIVE';

-- Registar voto (marcar que votou)
UPDATE election_voters
SET has_voted = TRUE, voted_at = NOW(), updated_at = NOW()
WHERE election_id = 1 AND member_id = 3;

-- Remover eleitor
UPDATE election_voters SET status = 'REMOVED', updated_at = NOW()
WHERE election_id = 1 AND member_id = 3;

-- Remover permanentemente
DELETE FROM election_voters WHERE election_id = 1 AND member_id = 3;


-- ============================================================
-- 12. VOTES
-- ============================================================

-- Contagem de votos por candidato numa eleição
SELECT
    c.id            AS candidate_id,
    m.name          AS candidate_name,
    COUNT(v.id)     AS total_votos
FROM votes v
JOIN candidates c ON c.id = v.candidate_id
JOIN members    m ON m.id = c.member_id
WHERE v.election_id = 1
GROUP BY c.id, m.name
ORDER BY total_votos DESC;

-- Contagem com votos em branco
SELECT
    COALESCE(m.name, '[ Voto em Branco ]') AS candidato,
    COUNT(v.id)                             AS total_votos
FROM votes v
LEFT JOIN candidates c ON c.id = v.candidate_id
LEFT JOIN members    m ON m.id = c.member_id
WHERE v.election_id = 1
GROUP BY COALESCE(m.name, '[ Voto em Branco ]')
ORDER BY total_votos DESC;

-- Total geral de votos por eleição
SELECT election_id, COUNT(*) AS total_votos FROM votes GROUP BY election_id;

-- Verificar se um hash de comprovativo existe
SELECT * FROM votes WHERE proof_hash = 'abc123hash';

-- Registar voto num candidato
INSERT INTO votes (election_id, candidate_id, is_blank, proof_hash)
VALUES (1, 2, FALSE, md5(random()::text));

-- Registar voto em branco
INSERT INTO votes (election_id, candidate_id, is_blank, proof_hash)
VALUES (1, NULL, TRUE, md5(random()::text));

-- (Votos não devem ser actualizados — integridade eleitoral)
-- (Remoção apenas em ambiente de teste)
DELETE FROM votes WHERE election_id = 1;


-- ============================================================
-- 13. VOTE_RECEIPTS
-- ============================================================

-- Ver recibos de uma eleição
SELECT * FROM vote_receipts WHERE election_id = 1;

-- Verificar recibo por código público
SELECT * FROM vote_receipts WHERE public_code = 'PUB-XXXXXX';

-- Cruzar recibo com participação
SELECT
    vr.public_code,
    vr.voter_hash,
    ev.has_voted,
    ev.voted_at
FROM vote_receipts vr
JOIN election_voters ev
    ON ev.voter_hash   = vr.voter_hash
    AND ev.election_id = vr.election_id
WHERE vr.election_id = 1;

-- Inserir recibo
INSERT INTO vote_receipts (election_id, voter_hash, public_code)
VALUES (1, 'hash_do_eleitor', 'PUB-2024-ABC123');

-- Remover recibos de uma eleição (teste)
DELETE FROM vote_receipts WHERE election_id = 1;


-- ============================================================
-- 14. AUDIT_LOGS
-- ============================================================

-- Ver todos os logs (mais recentes primeiro)
SELECT
    al.*,
    u.name AS user_name
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC;

-- Logs de uma eleição específica
SELECT * FROM audit_logs WHERE election_id = 1 ORDER BY created_at DESC;

-- Logs de um utilizador
SELECT * FROM audit_logs WHERE user_id = 1 ORDER BY created_at DESC;

-- Filtrar por acção
SELECT * FROM audit_logs WHERE action = 'VOTE_CAST' ORDER BY created_at DESC;
SELECT * FROM audit_logs WHERE action = 'LOGIN'     ORDER BY created_at DESC;

-- Logs de hoje
SELECT * FROM audit_logs WHERE created_at::date = CURRENT_DATE ORDER BY created_at DESC;

-- Logs num intervalo de datas
SELECT * FROM audit_logs
WHERE created_at BETWEEN '2024-06-01' AND '2024-06-30'
ORDER BY created_at DESC;

-- Inserir log
INSERT INTO audit_logs (election_id, user_id, action, entity, entity_id, details, ip, user_agent)
VALUES (1, 1, 'VOTE_CAST', 'votes', 55,
        '{"candidate_id": 2}'::jsonb,
        '196.28.0.1', 'Mozilla/5.0...');

-- Logs não devem ser actualizados nem removidos (imutáveis por norma)
-- Em caso de necessidade administrativa:
DELETE FROM audit_logs WHERE id = 1;


-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================

-- Ver notificações de um utilizador (não lidas primeiro)
SELECT * FROM notifications
WHERE user_id = 1
ORDER BY read_at NULLS FIRST, created_at DESC;

-- Apenas não lidas
SELECT * FROM notifications WHERE user_id = 1 AND read_at IS NULL;

-- Apenas lidas
SELECT * FROM notifications WHERE user_id = 1 AND read_at IS NOT NULL;

-- Contar não lidas
SELECT COUNT(*) AS nao_lidas FROM notifications WHERE user_id = 1 AND read_at IS NULL;

-- Filtrar por tipo
SELECT * FROM notifications WHERE user_id = 1 AND type = 'ELECTION';

-- Inserir notificação
INSERT INTO notifications (user_id, title, message, type)
VALUES (1, 'Votação aberta', 'A eleição para Presidente da AG está agora aberta.', 'ELECTION');

-- Marcar uma como lida
UPDATE notifications SET read_at = NOW(), updated_at = NOW() WHERE id = 1;

-- Marcar todas como lidas para um utilizador
UPDATE notifications
SET read_at = NOW(), updated_at = NOW()
WHERE user_id = 1 AND read_at IS NULL;

-- Remover uma notificação
DELETE FROM notifications WHERE id = 1;

-- Remover todas as lidas de um utilizador
DELETE FROM notifications WHERE user_id = 1 AND read_at IS NOT NULL;


-- ============================================================
-- 16. SETTINGS
-- ============================================================

-- Ver configurações de um utilizador
SELECT s.*, u.name AS user_name
FROM settings s
JOIN users u ON u.id = s.user_id
WHERE s.user_id = 1;

-- Ver todos com nome do utilizador
SELECT s.*, u.name AS user_name
FROM settings s
JOIN users u ON u.id = s.user_id
ORDER BY u.name;

-- Inserir configurações padrão para um novo utilizador
INSERT INTO settings (user_id, theme, high_contrast, font_size,
                      email_notifications, system_notifications, whatsapp_notifications)
VALUES (1, 'LIGHT', FALSE, 'MEDIUM', TRUE, TRUE, FALSE);

-- Actualizar tema
UPDATE settings SET theme = 'DARK', updated_at = NOW() WHERE user_id = 1;

-- Activar alto contraste
UPDATE settings SET high_contrast = TRUE, updated_at = NOW() WHERE user_id = 1;

-- Actualizar tamanho da fonte
UPDATE settings SET font_size = 'LARGE', updated_at = NOW() WHERE user_id = 1;

-- Actualizar notificações
UPDATE settings
SET email_notifications    = TRUE,
    system_notifications   = TRUE,
    whatsapp_notifications = FALSE,
    updated_at             = NOW()
WHERE user_id = 1;

-- Repor padrões
UPDATE settings
SET theme                  = 'LIGHT',
    high_contrast          = FALSE,
    font_size              = 'MEDIUM',
    email_notifications    = TRUE,
    system_notifications   = TRUE,
    whatsapp_notifications = FALSE,
    updated_at             = NOW()
WHERE user_id = 1;

-- Remover (o trigger/aplicação deve recriar com padrões)
DELETE FROM settings WHERE user_id = 1;


-- ============================================================
-- QUERIES DE RELATÓRIO / DASHBOARD
-- ============================================================

-- Resumo geral de uma eleição
SELECT
    e.title,
    e.status,
    e.starts_at,
    e.ends_at,
    COUNT(DISTINCT ev.id)                                           AS total_eleitores,
    COUNT(DISTINCT CASE WHEN ev.has_voted THEN ev.id END)          AS votaram,
    COUNT(DISTINCT c.id)                                            AS total_candidatos,
    COUNT(DISTINCT v.id)                                            AS total_votos
FROM elections e
LEFT JOIN election_voters ev ON ev.election_id = e.id AND ev.status = 'AUTHORIZED'
LEFT JOIN candidates      c  ON c.election_id  = e.id AND c.status  = 'APPROVED'
LEFT JOIN votes           v  ON v.election_id  = e.id
WHERE e.id = 1
GROUP BY e.id;

-- Resultados finais de uma eleição (ranking)
SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(v.id) DESC) AS posicao,
    m.name                                         AS candidato,
    COUNT(v.id)                                    AS votos,
    ROUND(COUNT(v.id)::NUMERIC /
        NULLIF((SELECT COUNT(*) FROM votes WHERE election_id = 1), 0) * 100, 2) AS percentagem
FROM candidates c
JOIN members m ON m.id = c.member_id
LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = 1
WHERE c.election_id = 1 AND c.status = 'APPROVED'
GROUP BY m.name
ORDER BY votos DESC;

-- Participação por delegação numa eleição
SELECT
    d.name                                                        AS delegacao,
    COUNT(ev.id)                                                  AS total_eleitores,
    SUM(CASE WHEN ev.has_voted THEN 1 ELSE 0 END)                AS votaram,
    ROUND(
        SUM(CASE WHEN ev.has_voted THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(ev.id), 0) * 100, 2
    )                                                             AS percentagem
FROM election_voters ev
JOIN delegations d ON d.id = ev.delegation_id
WHERE ev.election_id = 1 AND ev.status = 'AUTHORIZED'
GROUP BY d.name
ORDER BY percentagem DESC;

-- ============================================================
-- FIM DO FICHEIRO DE QUERIES
-- ============================================================
