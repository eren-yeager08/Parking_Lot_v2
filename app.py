from flask import Flask
from application.database import db
from application.models import User, Role
from application.resources import api
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore 
from werkzeug.security import generate_password_hash
# from application.celery_init import celery_init_app
from celery.schedules import crontab
from application.task import monthly_reservation_report, daily_reminder
from application.cache import cache




def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)
    api.init_app(app)
    cache.init_app(app, config={
        'CACHE_TYPE': 'RedisCache',
        'CACHE_REDIS_HOST': 'localhost',
        'CACHE_REDIS_PORT': 6379,
        'CACHE_REDIS_DB': 0,
        'CACHE_DEFAULT_TIMEOUT': 300
    })
    app.cache = cache   
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    app.app_context().push()
    return app

app = create_app()
# celery = celery_init_app(app)


with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name="admin", description="Superuser")
    app.security.datastore.find_or_create_role(name="user", description="Generaluser")
    db.session.commit()
    if not app.security.datastore.find_user(email = "admin@gmail.com"):
        app.security.datastore.create_user(email = "admin@gmail.com",
                                            username = "Mr_Admin" ,
                                            password = generate_password_hash("admin@") ,
                                            pincode = "206122",
                                            roles = ['admin'])
    db.session.commit()
    

from application.routes import *


# @celery.on_after_finalize.connect
# def setup_periodic_tasks(sender, **kwargs):
#     sender.add_periodic_task(
#         crontab(minute=0, hour=0, day_of_month=1),
#         # crontab(minute='*/1'),
#         monthly_reservation_report.s())

#     sender.add_periodic_task(
#         crontab(hour=18, minute=0),
#         # crontab(minute='*/3'),
#         daily_reminder.s())


if __name__ == '__main__':
    app.run(debug=True)