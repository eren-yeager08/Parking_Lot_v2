class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///parking_lot_v2.db"
    DEBUG = True
    SECRET_KEY = "this-is-a-secret-key"  
    SECURITY_PASSWORD_HASH = "bcrypt"  
    SECURITY_PASSWORD_SALT = "this-is-a-password-salt"  
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"