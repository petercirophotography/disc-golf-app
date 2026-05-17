-- Migration: 001_throw_tracker.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE discs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    disc_type VARCHAR(20) NOT NULL CHECK (disc_type IN ('Driver', 'Fairway', 'Midrange', 'Putter')),
    stability VARCHAR(5) NOT NULL CHECK (stability IN ('VOS', 'OS', 'ST', 'US', 'VUS')),
    brand VARCHAR(100),
    speed NUMERIC(3,1),
    glide NUMERIC(3,1),
    turn NUMERIC(4,1),
    fade NUMERIC(3,1),
    in_bag BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE throwing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(200) NOT NULL,
    conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE throws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES throwing_sessions(id) ON DELETE CASCADE,
    disc_id UUID NOT NULL REFERENCES discs(id) ON DELETE CASCADE,
    distance_yards NUMERIC(5,1) NOT NULL CHECK (distance_yards >= 0),
    distance_feet NUMERIC(6,1) NOT NULL GENERATED ALWAYS AS (distance_yards * 3) STORED,
    throw_number SMALLINT NOT NULL CHECK (throw_number BETWEEN 1 AND 3),
    flag VARCHAR(10) CHECK (flag IN ('roller', 'skip', 'outlier')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, disc_id, throw_number)
);

CREATE TABLE putting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(200) NOT NULL DEFAULT 'Backyard',
    conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE putts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    putting_session_id UUID NOT NULL REFERENCES putting_sessions(id) ON DELETE CASCADE,
    distance_feet NUMERIC(4,1) NOT NULL CHECK (distance_feet > 0 AND distance_feet <= 66),
    attempts SMALLINT NOT NULL CHECK (attempts > 0),
    makes SMALLINT NOT NULL CHECK (makes >= 0),
    circle VARCHAR(2) NOT NULL GENERATED ALWAYS AS (
        CASE WHEN distance_feet < 33 THEN 'C1' ELSE 'C2' END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT makes_lte_attempts CHECK (makes <= attempts)
);

-- Indexes for common queries
CREATE INDEX idx_throws_session_id ON throws(session_id);
CREATE INDEX idx_throws_disc_id ON throws(disc_id);
CREATE INDEX idx_putts_session_id ON putts(putting_session_id);
CREATE INDEX idx_sessions_date ON throwing_sessions(session_date);
CREATE INDEX idx_putting_sessions_date ON putting_sessions(session_date);
CREATE INDEX idx_discs_in_bag ON discs(in_bag) WHERE in_bag = true;
