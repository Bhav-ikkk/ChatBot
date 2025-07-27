-- Create database
CREATE DATABASE chatbot_db;

-- Connect to the database
\c chatbot_db;

-- Create default admin user (run this after the tables are created)
INSERT INTO users (email, username, password_hash, is_admin, is_active) 
VALUES ('admin@example.com', 'admin', 'hashed_password_here', true, true);

-- Create default plans
INSERT INTO plans (name, description, price, daily_requests, stripe_price_id, is_active) 
VALUES 
('Free', 'Free tier with basic features', 0.00, 10, 'price_free', true),
('Pro', 'Professional plan with more requests', 29.99, 1000, 'price_pro', true),
('Enterprise', 'Enterprise plan with unlimited requests', 99.99, 10000, 'price_enterprise', true);
