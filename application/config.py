class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class LocalDevelopmentConfig(Config):
    # Configuration
    SQLALCHEMY_DATABASE_URI = "sqlite:///parking_lot_v2.sqlite3"
    DEBUG = True

    # Config for security
    SECRET_KEY = "this-is-a-secret-key"  # Hash user credential session
    SECURITY_PASSWORD_HASH = "bcrypt"  # Mechanism for hashing password
    SECURITY_PASSWORD_SALT = "this-is-a-password-salt"  # Helps in hashing password
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"