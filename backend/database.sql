-- 1. Create Custom Types for Fixed Categories
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Super Admin', 'Centre Admin', 'Student', 'Reviewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE degree_type AS ENUM ('MSc', 'PhD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE thesis_status AS ENUM ('Draft', 'Submitted', 'Approved', 'Locked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE programme_name AS ENUM (
        'Artificial Intelligence', 
        'Cyber Security', 
        'Management Information System'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop tables if they exist to ensure clean slate (careful in prod, ok for dev)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS theses;
DROP TABLE IF EXISTS users;

-- 2. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    matric_number VARCHAR(50) UNIQUE, -- Only for students
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'Student',
    programme programme_name,
    degree degree_type,
    staff_id VARCHAR(50) UNIQUE, -- Only for admins
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Theses Table
CREATE TABLE theses (
    thesis_id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(user_id),
    title TEXT NOT NULL,
    abstract TEXT,
    keywords TEXT[], -- Array of keywords for better search
    supervisors TEXT[], -- Array of supervisors
    author_name VARCHAR(255), -- Denormalized for legacy
    matric_number VARCHAR(50), -- Denormalized
    programme programme_name NOT NULL,
    degree degree_type NOT NULL,
    graduation_year INTEGER NOT NULL,
    pdf_url TEXT, -- Cloud storage link
    file_hash TEXT, -- For integrity verification
    status thesis_status DEFAULT 'Draft',
    is_legacy BOOLEAN DEFAULT FALSE, -- To distinguish migrated files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit & Access Logs
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(100), -- e.g., 'THESIS_UPLOAD', 'ADMIN_APPROVE'
    target_id INTEGER, -- ID of the thesis or user affected
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes for High-Performance Search
CREATE INDEX idx_thesis_search ON theses USING gin(to_tsvector('english', title || ' ' || abstract));
CREATE INDEX idx_programme_degree ON theses(programme, degree);

-- 6. Publications Table (New Entity)
CREATE TABLE IF NOT EXISTS publications (
    publication_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT[], -- Array of authors
    journal_name VARCHAR(255),
    doi VARCHAR(100),
    volume VARCHAR(50),
    issue VARCHAR(50),
    pages VARCHAR(50),
    publication_date DATE,
    keywords TEXT[],
    pdf_url TEXT,
    external_link TEXT,
    uploaded_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Indexes for Publications Search
CREATE INDEX IF NOT EXISTS idx_publication_search ON publications USING gin(to_tsvector('english', title || ' ' || COALESCE(abstract, '')));

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
