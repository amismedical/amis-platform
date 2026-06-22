-- ===========================================
-- AMIS Password Hash Fix
-- Version: 004 - Fix admin user password hash
-- Description: Update invalid password hash with valid bcrypt hash
-- ===========================================

DO $$
BEGIN
    -- Update admin user password hash with valid bcrypt hash for 'admin123'
    UPDATE users
    SET password_hash = '$2a$10$pTyV08HN.UpI3mLFxRPuwegHZ8DYrrIH1D9Q8jzQlChjXRmsC0O.u',
        updated_at = NOW()
    WHERE email = 'admin@amismedical.uz';

    RAISE NOTICE 'Admin password hash updated successfully';
END $$;

SELECT 'Password fix applied!' as status;
