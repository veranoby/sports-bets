INSERT INTO system_settings (key, value, type, category, description, is_public) VALUES
('enable_wallets', 'true', 'boolean', 'features', 'Enable wallet system', false),
('enable_betting', 'true', 'boolean', 'features', 'Enable betting system', false),
('enable_streaming', 'true', 'boolean', 'features', 'Enable streaming features', false),
('maintenance_mode', 'false', 'boolean', 'system', 'Platform maintenance mode', true),
('commission_percentage', '5', 'number', 'business', 'Platform commission percentage', true),
('min_bet_amount', '1', 'number', 'business', 'Minimum bet amount', true),
('max_bet_amount', '10000', 'number', 'business', 'Maximum bet amount', true);
