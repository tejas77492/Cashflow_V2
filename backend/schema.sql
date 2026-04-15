CREATE DATABASE IF NOT EXISTS cashflow;
USE cashflow;

CREATE TABLE IF NOT EXISTS branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  charge_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cc_charge_percentage DECIMAL(8,4) NOT NULL DEFAULT 2.50,
  bill_charge_percentage DECIMAL(8,4) NOT NULL DEFAULT 3.50,
  branch_manager_share_percentage DECIMAL(8,4) NOT NULL DEFAULT 30.00,
  head_manager_share_percentage DECIMAL(8,4) NOT NULL DEFAULT 70.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'branch_manager', 'operator') NOT NULL,
  branch_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  branch_id INT NOT NULL,
  type ENUM('cc', 'bill') NOT NULL,
  portal_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  customer_charge DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  portal_cost DECIMAL(12,2) NOT NULL,
  profit DECIMAL(12,2) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_transactions_portal FOREIGN KEY (portal_id) REFERENCES portals(id),
  CONSTRAINT fk_transactions_user FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_expenses_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Default settings (bill: 3.5%, CC: 2.5%, branch: 30%, head: 70%)
INSERT INTO settings (cc_charge_percentage, bill_charge_percentage, branch_manager_share_percentage, head_manager_share_percentage)
SELECT 2.50, 3.50, 30.00, 70.00
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Default portal
INSERT INTO portals (name, charge_percentage)
SELECT 'Portal A', 1.00
WHERE NOT EXISTS (SELECT 1 FROM portals);

-- Default admin user  (password: Admin@123)
INSERT INTO users (name, email, password, role)
SELECT 'Administrator', 'admin@cashflow.com', '$2a$10$E9rddXQiG2yEQ4SaGju3BeQlyGP7MYuaVXdnNQFO1Of6h6LnRqlEO', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@cashflow.com');
