-- Insert default accounts and force them to be enabled/verified (is_enabled = 1)
INSERT IGNORE INTO users (email, password, role, full_name, is_enabled) VALUES ('admin@uumis.edu.my', '123', 'ADMIN', 'System Admin', 1);
INSERT IGNORE INTO users (email, password, role, full_name, is_enabled) VALUES ('staff@uumis.edu.my', '123', 'STAFF', 'System Staff', 1);
INSERT IGNORE INTO users (email, password, role, full_name, is_enabled) VALUES ('student@uumis.edu.my', '123', 'STUDENT', 'System Student', 1);
INSERT IGNORE INTO users (email, password, role, full_name, is_enabled) VALUES ('parent@uumis.edu.my', '123', 'PARENT', 'System Parent', 1);
INSERT IGNORE INTO users (email, password, role, full_name, is_enabled) VALUES ('register@uumis.edu.my', '123', 'STAFF', 'Register Manager', 1);
INSERT IGNORE INTO users (email, password, role, full_name, is_enabled) VALUES ('finance@uumis.edu.my', '123', 'STAFF', 'Financial Manager', 1);