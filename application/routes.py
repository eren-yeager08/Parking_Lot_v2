from .database import db
from .models import *
from flask import current_app as app, jsonify, request, render_template, send_from_directory
from flask_security import auth_required, roles_required, current_user, login_user, roles_accepted
from werkzeug.security import check_password_hash, generate_password_hash
from .utily import roles_list
from celery.result import AsyncResult
from .task import export_user_csv



@app.route('/', methods = ['GET'])
def home():
    return render_template('index.html')


@app.route('/admin') 
@auth_required('token') 
@roles_required('admin') 
def admin_home():
    return jsonify({"message" : "admin is logged in successfully"})


@app.route('/api/home')
@auth_required('token')
@roles_accepted('user','admin') 
def user_home():
    user = current_user
    return jsonify({
        "username": user.username,
        "email": user.email,
        "roles": roles_list(user.roles)
    })


@app.route('/api/login', methods=['POST'])
def user_login():
    body = request.get_json()
    email = body['email']
    password = body['password']
    if not email:
        return jsonify({"message" : "email is required"}), 400
    user = app.security.datastore.find_user(email=email)
    if user:
        if check_password_hash(user.password, password):
            login_user(user)
            return jsonify({
                "id" : user.id,
                "username" : user.username,
                "auth-token" : user.get_auth_token(),
                "roles": roles_list(user.roles)
            })
        else:
            return ({"message" : "Incoreect Password"}), 400
    else:
        return jsonify({"message" : "user not found"})


@app.post('/api/register')
def create_user():
    credentials = request.get_json()
    if not app.security.datastore.find_user(email = credentials["email"]):
        app.security.datastore.create_user(email = credentials["email"] ,
                                           username = credentials["username"],
                                           password = generate_password_hash(credentials["password"]),
                                           pincode = credentials["pincode"],
                                           roles = ['user'])
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 201
    return jsonify({"message": "User already exists!"}), 400 ,


@app.route('/api/user/export')
@auth_required('token')
@roles_required('user')
def trigger_user_csv_export():
    user_id = current_user.id
    result = export_user_csv.delay(user_id)
    return jsonify({ "id": result.id })


@app.route('/api/csv_result/<id>')
def get_csv_file(id):
    res = AsyncResult(id)
    return send_from_directory('static', res.result)


