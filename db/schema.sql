-- CPD database schema for UniKL RCMP

CREATE DATABASE IF NOT EXISTS cpd;
USE cpd;

-- Reference tables first (required for foreign keys on staff)

CREATE TABLE IF NOT EXISTS role_table (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO role_table (role_id, role_name) VALUES
(1, 'Staff'),
(2, 'Administrator'),
(3, 'Head of Department'),
(4, 'CEO / DEAN')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

CREATE TABLE IF NOT EXISTS department_table (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO department_table (department_id, department_name) VALUES
(1, 'CORPORATE GOVERNANCE DEPT'),
(2, 'LIBRARY DEPT'),
(3, 'ACADEMIC SERVICES (FOM)'),
(4, 'CORPORATE SERVICE DIVISION'),
(5, 'UNIVERSITY INTERNATIONAL OFFICE'),
(6, 'MeSRA'),
(7, 'MAINTENANCE DEPARTMENT'),
(8, 'RESEARCH, INNOVATION & POST GRADUATE STUDY'),
(9, 'NURSING PROGRAMME'),
(10, 'SURGICAL BASED DEPT'),
(11, 'BACHELOR IN PHARMACY PROG'),
(12, 'ADMINISTRATION, FACILITIES & SAFETY DEPARTMENT'),
(13, 'HUMAN CAPITAL DEPT'),
(14, 'COMMUNITY BASED DEPT'),
(15, 'CAMPUS LIFESTYLE'),
(16, 'INFORMATION TECH DEPT'),
(17, 'STUDENT RESIDENTIAL DEPT'),
(18, 'FINANCE & PROCUREMENT DEPT'),
(19, 'DIPLOMA IN PHARMACY PROG'),
(20, 'DEAN''S OFFICE'),
(21, 'LABORATORY DEPT'),
(22, 'PRE-CLINICAL DEPT'),
(23, 'MEDICAL IMAGING PROGRAMME'),
(24, 'MEDICINE BASED DEPT'),
(25, 'RESEARCH & POST GRADUATE STUDY'),
(26, 'STUDENT DEVELOPMENT'),
(27, 'TEKNOPUTRA'),
(28, 'PSYCHOLOGY DEPARTMENT'),
(29, 'DD''S OFFICE'),
(30, 'FOUNDATION IN MEDICAL SCIENCES PROG'),
(31, 'QUALITY ASSURANCE DEPT'),
(32, 'PHYSIOTHERAPY PROGRAMME (DIPLOMA)'),
(33, 'ACADEMIC SERVICES (FPHS)'),
(34, 'CEO''S OFFICE'),
(35, 'INDUSTRIAL LINKAGES'),
(36, 'PHYSIOTHERAPY PROGRAMME (BACHELOR)'),
(37, 'PUSAT KAJIAN WARISAN & SEJARAH PERAK'),
(38, 'ACE DEPT'),
(39, 'BACHELOR OF PHARMACEUTICAL TECHNOLOGY PROG'),
(40, 'INTERNATIONAL STUDENT MARKETING')
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

CREATE TABLE IF NOT EXISTS staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    role_id INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_role FOREIGN KEY (role_id) REFERENCES role_table (role_id),
    CONSTRAINT fk_staff_department FOREIGN KEY (department_id) REFERENCES department_table (department_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Demo password for all seeded users: RCMP1234 (bcrypt cost 10)
INSERT INTO staff (staff_id, full_name, email_address, phone_number, department_id, role_id, password_hash) VALUES
(620000, 'Wan Afiq', 'afiq.danial@unikl.edu.my', '0134567890', 16, 1, '$2b$10$lfoXnFtySP1kYHYFtQmqgeIJpjO/JeDh0ngrn5hA9YeHfKfSY6s5u'),
(620001, 'Marina Abd Kadir', 'marinaak@unikl.edu.my', '0134567890', 13, 2, '$2b$10$lfoXnFtySP1kYHYFtQmqgeIJpjO/JeDh0ngrn5hA9YeHfKfSY6s5u'),
(610002, 'Tun Hazman', 'tun.hazman@unikl.edu.my', '0134567890', 16, 3, '$2b$10$lfoXnFtySP1kYHYFtQmqgeIJpjO/JeDh0ngrn5hA9YeHfKfSY6s5u'),
(620003, 'Hisshamuddin', 'hisshamuddin@unikl.edu.my', '0134567890', 34, 4, '$2b$10$lfoXnFtySP1kYHYFtQmqgeIJpjO/JeDh0ngrn5hA9YeHfKfSY6s5u')
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    email_address = VALUES(email_address),
    phone_number = VALUES(phone_number),
    department_id = VALUES(department_id),
    role_id = VALUES(role_id),
    password_hash = VALUES(password_hash);
