CREATE SCHEMA ;

-- ============================================================
--  ADEMO — Migração Completa PostgreSQL
--  Ordem respeitando dependências (foreign keys)
-- ============================================================

-- Extensão para UUIDs (opcional, caso seja necessário no futuro)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PASSO 1 — province
-- (sem dependências)
-- ============================================================
CREATE TABLE province (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    code        VARCHAR(10)     UNIQUE,           -- ex: MPN, MPT, MMS…
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  province           IS 'Províncias de Moçambique';
COMMENT ON COLUMN province.code      IS 'Código abreviado da província';

-- ============================================================
-- PASSO 2 — distrit
-- (depende de: province)
-- ============================================================
CREATE TABLE distrit (
    id          BIGSERIAL       PRIMARY KEY,
    province_id BIGINT          NOT NULL
                                REFERENCES province(id)
                                ON UPDATE CASCADE ON DELETE RESTRICT,
    name        VARCHAR(150)    NOT NULL,
    code        VARCHAR(10),                      -- código do distrito, opcional
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  distrit              IS 'Distritos de cada província';
COMMENT ON COLUMN distrit.province_id  IS 'Província a que o distrito pertence';

-- ============================================================
-- PASSO 3 — delegations
-- (depende de: province, distrit)
-- ============================================================
CREATE TABLE delegations (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL,
    province_id BIGINT          NOT NULL
                                REFERENCES province(id)
                                ON UPDATE CASCADE ON DELETE RESTRICT,
    district_id BIGINT
                                REFERENCES distrit(id)
                                ON UPDATE CASCADE ON DELETE SET NULL,
    address     TEXT,
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  delegations              IS 'Delegações/províncias da ADEMO';
COMMENT ON COLUMN delegations.province_id  IS 'Província da delegação (FK)';
COMMENT ON COLUMN delegations.district_id  IS 'Distrito da delegação (FK, opcional)';

-- ============================================================
-- PASSO 4 — organs
-- (sem dependências)
-- ============================================================
CREATE TABLE organs (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL,
    description TEXT,
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organs IS 'Órgãos sociais da ADEMO';

-- ============================================================
-- PASSO 5 — positions
-- (depende de: organs)
-- ============================================================
CREATE TABLE positions (
    id          BIGSERIAL       PRIMARY KEY,
    organ_id    BIGINT          NOT NULL
                                REFERENCES organs(id)
                                ON UPDATE CASCADE ON DELETE RESTRICT,
    name        VARCHAR(150)    NOT NULL,
    description TEXT,
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  positions           IS 'Cargos associados aos órgãos sociais';
COMMENT ON COLUMN positions.organ_id  IS 'Órgão social ao qual o cargo pertence';

-- ============================================================
-- PASSO 6 — users
-- (depende de: delegations)
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    access_code     VARCHAR(50)     NOT NULL UNIQUE,
    email           VARCHAR(200)    UNIQUE,
    phone           VARCHAR(30),
    password        VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL
                                    CHECK (role IN ('ADMIN','COMMISSION','FISCAL','VOTER')),
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                    CHECK (status IN ('ACTIVE','INACTIVE','BLOCKED')),
    delegation_id   BIGINT
                                    REFERENCES delegations(id)
                                    ON UPDATE CASCADE ON DELETE SET NULL,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users               IS 'Utilizadores que entram no sistema';
COMMENT ON COLUMN users.access_code   IS 'Código de acesso único do utilizador';
COMMENT ON COLUMN users.role          IS 'ADMIN | COMMISSION | FISCAL | VOTER';
COMMENT ON COLUMN users.status        IS 'ACTIVE | INACTIVE | BLOCKED';

-- ============================================================
-- PASSO 7 — members
-- (depende de: delegations)
-- ============================================================
CREATE TABLE members (
    id              BIGSERIAL       PRIMARY KEY,
    member_code     VARCHAR(50)     NOT NULL UNIQUE,
    name            VARCHAR(150)    NOT NULL,
    phone           VARCHAR(30),
    email           VARCHAR(200),
    bi_number       VARCHAR(20),
    delegation_id   BIGINT          NOT NULL
                                    REFERENCES delegations(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                                    CHECK (status IN ('ACTIVE','INACTIVE')),
    registered_at   DATE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  members              IS 'Membros da ADEMO';
COMMENT ON COLUMN members.member_code  IS 'Código único do membro';
COMMENT ON COLUMN members.bi_number    IS 'Número do Bilhete de Identidade';

-- ============================================================
-- PASSO 8 — elections
-- (depende de: organs, positions, delegations, users)
-- ============================================================
CREATE TABLE elections (
    id                  BIGSERIAL       PRIMARY KEY,
    title               VARCHAR(200)    NOT NULL,
    organ_id            BIGINT          NOT NULL
                                        REFERENCES organs(id)
                                        ON UPDATE CASCADE ON DELETE RESTRICT,
    position_id         BIGINT          NOT NULL
                                        REFERENCES positions(id)
                                        ON UPDATE CASCADE ON DELETE RESTRICT,
    delegation_id       BIGINT
                                        REFERENCES delegations(id)
                                        ON UPDATE CASCADE ON DELETE SET NULL,
    parent_election_id  BIGINT
                                        REFERENCES elections(id)
                                        ON UPDATE CASCADE ON DELETE SET NULL,
    round_number        INTEGER         NOT NULL DEFAULT 1
                                        CHECK (round_number IN (1, 2)),
    starts_at           TIMESTAMP       NOT NULL,
    ends_at             TIMESTAMP       NOT NULL,
    description         TEXT,
    allow_blank_vote    BOOLEAN         NOT NULL DEFAULT FALSE,
    status              VARCHAR(30)     NOT NULL DEFAULT 'DRAFT'
                                        CHECK (status IN (
                                            'DRAFT','PUBLISHED','OPEN',
                                            'CLOSED','CANCELLED','FINISHED'
                                        )),
    created_by          BIGINT          NOT NULL
                                        REFERENCES users(id)
                                        ON UPDATE CASCADE ON DELETE RESTRICT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_elections_dates CHECK (ends_at > starts_at)
);

COMMENT ON TABLE  elections                    IS 'Eleições institucionais da ADEMO';
COMMENT ON COLUMN elections.parent_election_id IS 'Referência à 1ª volta, quando aplicável';
COMMENT ON COLUMN elections.round_number       IS '1 = primeira volta  |  2 = segunda volta';
COMMENT ON COLUMN elections.allow_blank_vote   IS 'Indica se o voto em branco é permitido';

-- ============================================================
-- PASSO 9 — election_team
-- (depende de: elections, users)
-- ============================================================
CREATE TABLE election_team (
    id                  BIGSERIAL       PRIMARY KEY,
    election_id         BIGINT          NOT NULL
                                        REFERENCES elections(id)
                                        ON UPDATE CASCADE ON DELETE CASCADE,
    user_id             BIGINT          NOT NULL
                                        REFERENCES users(id)
                                        ON UPDATE CASCADE ON DELETE CASCADE,
    role_in_election    VARCHAR(30)     NOT NULL
                                        CHECK (role_in_election IN ('COMMISSION','FISCAL')),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_election_team UNIQUE (election_id, user_id)
);

COMMENT ON TABLE  election_team                   IS 'Comissão e fiscais por eleição';
COMMENT ON COLUMN election_team.role_in_election  IS 'COMMISSION | FISCAL';

-- ============================================================
-- PASSO 10 — candidates
-- (depende de: elections, members, positions)
-- ============================================================
CREATE TABLE candidates (
    id              BIGSERIAL       PRIMARY KEY,
    election_id     BIGINT          NOT NULL
                                    REFERENCES elections(id)
                                    ON UPDATE CASCADE ON DELETE CASCADE,
    member_id       BIGINT          NOT NULL
                                    REFERENCES members(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    position_id     BIGINT          NOT NULL
                                    REFERENCES positions(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    biography       TEXT,
    proposal        TEXT,
    photo_path      VARCHAR(255),
    document_path   VARCHAR(255),
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_candidate_per_election UNIQUE (election_id, member_id)
);

COMMENT ON TABLE  candidates             IS 'Candidatos por eleição';
COMMENT ON COLUMN candidates.photo_path  IS 'Caminho da fotografia do candidato';

-- ============================================================
-- PASSO 11 — election_voters
-- (depende de: elections, members, delegations)
-- ============================================================
CREATE TABLE election_voters (
    id              BIGSERIAL       PRIMARY KEY,
    election_id     BIGINT          NOT NULL
                                    REFERENCES elections(id)
                                    ON UPDATE CASCADE ON DELETE CASCADE,
    member_id       BIGINT          NOT NULL
                                    REFERENCES members(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    delegation_id   BIGINT
                                    REFERENCES delegations(id)
                                    ON UPDATE CASCADE ON DELETE SET NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'AUTHORIZED'
                                    CHECK (status IN ('AUTHORIZED','REMOVED')),
    has_voted       BOOLEAN         NOT NULL DEFAULT FALSE,
    voted_at        TIMESTAMP,
    voter_hash      VARCHAR(255)    NOT NULL UNIQUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_voter_per_election UNIQUE (election_id, member_id)
);

COMMENT ON TABLE  election_voters             IS 'Eleitores autorizados por eleição';
COMMENT ON COLUMN election_voters.voter_hash  IS 'Hash para recibo — não revela o voto';
COMMENT ON COLUMN election_voters.has_voted   IS 'TRUE após o voto ser registado';

-- ============================================================
-- PASSO 12 — votes
-- (depende de: elections, candidates)
-- NÃO armazena member_id nem user_id → sigilo do voto
-- ============================================================
CREATE TABLE votes (
    id              BIGSERIAL       PRIMARY KEY,
    election_id     BIGINT          NOT NULL
                                    REFERENCES elections(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    candidate_id    BIGINT
                                    REFERENCES candidates(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    is_blank        BOOLEAN         NOT NULL DEFAULT FALSE,
    proof_hash      VARCHAR(255)    NOT NULL UNIQUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- candidate_id é nulo apenas quando is_blank = TRUE
    CONSTRAINT chk_vote_blank_or_candidate
        CHECK (
            (is_blank = TRUE  AND candidate_id IS NULL) OR
            (is_blank = FALSE AND candidate_id IS NOT NULL)
        )
);

COMMENT ON TABLE  votes             IS 'Votos sem ligação directa ao eleitor (sigilo)';
COMMENT ON COLUMN votes.is_blank    IS 'TRUE = voto em branco; candidate_id fica NULL';
COMMENT ON COLUMN votes.proof_hash  IS 'Hash do comprovativo de participação';

-- ============================================================
-- PASSO 13 — vote_receipts
-- (depende de: elections)
-- ============================================================
CREATE TABLE vote_receipts (
    id              BIGSERIAL       PRIMARY KEY,
    election_id     BIGINT          NOT NULL
                                    REFERENCES elections(id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
    voter_hash      VARCHAR(255)    NOT NULL,
    public_code     VARCHAR(100)    NOT NULL UNIQUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  vote_receipts              IS 'Comprovativos de participação na votação';
COMMENT ON COLUMN vote_receipts.voter_hash   IS 'Hash do eleitor — não identifica o voto';
COMMENT ON COLUMN vote_receipts.public_code  IS 'Código público entregue ao eleitor';

-- ============================================================
-- PASSO 14 — audit_logs
-- (depende de: elections, users)
-- ============================================================
CREATE TABLE audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    election_id BIGINT
                                REFERENCES elections(id)
                                ON UPDATE CASCADE ON DELETE SET NULL,
    user_id     BIGINT
                                REFERENCES users(id)
                                ON UPDATE CASCADE ON DELETE SET NULL,
    action      VARCHAR(100)    NOT NULL,
    entity      VARCHAR(100)    NOT NULL,
    entity_id   BIGINT,
    details     JSONB,
    ip          VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  audit_logs         IS 'Histórico de acções críticas do sistema';
COMMENT ON COLUMN audit_logs.action  IS 'Ex: VOTE_CAST, LOGIN, CANDIDATE_ADDED…';
COMMENT ON COLUMN audit_logs.entity  IS 'Nome da tabela afectada';
COMMENT ON COLUMN audit_logs.ip      IS 'Suporta IPv4 e IPv6 (até 45 caracteres)';

-- ============================================================
-- PASSO 15 — notifications
-- (depende de: users)
-- ============================================================
CREATE TABLE notifications (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     BIGINT          NOT NULL
                                REFERENCES users(id)
                                ON UPDATE CASCADE ON DELETE CASCADE,
    title       VARCHAR(200)    NOT NULL,
    message     TEXT            NOT NULL,
    type        VARCHAR(50)     NOT NULL
                                CHECK (type IN ('INFO','WARNING','ELECTION','SYSTEM')),
    read_at     TIMESTAMP,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  notifications       IS 'Notificações internas, principalmente para eleitores';
COMMENT ON COLUMN notifications.type  IS 'INFO | WARNING | ELECTION | SYSTEM';

-- ============================================================
-- PASSO 16 — settings
-- (depende de: users)
-- ============================================================
CREATE TABLE settings (
    id                      BIGSERIAL       PRIMARY KEY,
    user_id                 BIGINT          NOT NULL UNIQUE
                                            REFERENCES users(id)
                                            ON UPDATE CASCADE ON DELETE CASCADE,
    theme                   VARCHAR(20)     NOT NULL DEFAULT 'LIGHT'
                                            CHECK (theme IN ('LIGHT','DARK','SYSTEM')),
    high_contrast           BOOLEAN         NOT NULL DEFAULT FALSE,
    font_size               VARCHAR(10)     NOT NULL DEFAULT 'MEDIUM'
                                            CHECK (font_size IN ('SMALL','MEDIUM','LARGE')),
    email_notifications     BOOLEAN         NOT NULL DEFAULT TRUE,
    system_notifications    BOOLEAN         NOT NULL DEFAULT TRUE,
    whatsapp_notifications  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  settings          IS 'Preferências de conta por utilizador';
COMMENT ON COLUMN settings.user_id  IS 'Um registo por utilizador (UNIQUE)';

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================

-- province / distrit
CREATE INDEX idx_distrit_province ON distrit(province_id);

-- delegations
CREATE INDEX idx_delegations_province ON delegations(province_id);
CREATE INDEX idx_delegations_district ON delegations(district_id);

-- users
CREATE INDEX idx_users_delegation ON users(delegation_id);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_status     ON users(status);

-- members
CREATE INDEX idx_members_delegation ON members(delegation_id);
CREATE INDEX idx_members_status     ON members(status);

-- elections
CREATE INDEX idx_elections_organ      ON elections(organ_id);
CREATE INDEX idx_elections_position   ON elections(position_id);
CREATE INDEX idx_elections_delegation ON elections(delegation_id);
CREATE INDEX idx_elections_status     ON elections(status);
CREATE INDEX idx_elections_parent     ON elections(parent_election_id);

-- election_team
CREATE INDEX idx_election_team_election ON election_team(election_id);
CREATE INDEX idx_election_team_user     ON election_team(user_id);

-- candidates
CREATE INDEX idx_candidates_election ON candidates(election_id);
CREATE INDEX idx_candidates_member   ON candidates(member_id);

-- election_voters
CREATE INDEX idx_election_voters_election ON election_voters(election_id);
CREATE INDEX idx_election_voters_member   ON election_voters(member_id);
CREATE INDEX idx_election_voters_hash     ON election_voters(voter_hash);

-- votes
CREATE INDEX idx_votes_election  ON votes(election_id);
CREATE INDEX idx_votes_candidate ON votes(candidate_id);

-- vote_receipts
CREATE INDEX idx_vote_receipts_election ON vote_receipts(election_id);
CREATE INDEX idx_vote_receipts_hash     ON vote_receipts(voter_hash);

-- audit_logs
CREATE INDEX idx_audit_logs_election ON audit_logs(election_id);
CREATE INDEX idx_audit_logs_user     ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action   ON audit_logs(action);

-- notifications
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================


$2a$12$5FJeb5nTaSQ7Zbw53Ak6V.A46o5MHCytPCxsMhD8jegaQOUg5Lkoe  --12345678