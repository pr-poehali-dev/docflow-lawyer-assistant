-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) NOT NULL DEFAULT 'Физическое лицо',
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    birth_date DATE,
    address TEXT,
    passport_series VARCHAR(20),
    passport_number VARCHAR(20),
    passport_issued TEXT,
    passport_date DATE,
    inn VARCHAR(20),
    ogrn VARCHAR(20),
    kpp VARCHAR(20),
    bank_details TEXT,
    last_contact DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Cases table (юридические дела, привязаны к клиенту)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Страховые споры',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    deadline DATE,
    court VARCHAR(255),
    vehicle VARCHAR(255),
    vehicle_plate VARCHAR(50),
    policy_number VARCHAR(100),
    insurance_company VARCHAR(255),
    driver_full_name VARCHAR(255),
    driver_birth_date DATE,
    driver_address TEXT,
    driver_insurance_company VARCHAR(255),
    incident_date DATE,
    incident_place VARCHAR(255),
    guilt_full_name VARCHAR(255),
    guilt_birth_date DATE,
    guilt_address TEXT,
    guilt_phone VARCHAR(50),
    guilt_owner_name VARCHAR(255),
    guilt_owner_address TEXT,
    guilt_vehicle VARCHAR(255),
    guilt_vehicle_plate VARCHAR(50),
    guilt_insurance_company VARCHAR(255),
    guilt_policy_number VARCHAR(100),
    amount NUMERIC(14,2),
    contract_number VARCHAR(100),
    contract_date DATE,
    circumstances TEXT,
    desired_result TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_cases_client_id ON cases(client_id);

-- Generated documents log
CREATE TABLE generated_documents (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    doc_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    docx_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_documents_case_id ON generated_documents(case_id);
