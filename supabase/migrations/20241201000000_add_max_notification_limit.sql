-- Add max_notification_limit field to products table
ALTER TABLE products ADD COLUMN max_notification_limit integer DEFAULT 5;

-- Update existing products with their max_notification_limit values
UPDATE products SET max_notification_limit = 5 WHERE name = 'Basic';
UPDATE products SET max_notification_limit = 20 WHERE name = 'Growth';
UPDATE products SET max_notification_limit = 50 WHERE name = 'Pro'; 