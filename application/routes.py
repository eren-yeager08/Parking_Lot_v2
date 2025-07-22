from .database import db
from .models import *
from flask import current_app as app, jsonify, request, render_template
from flask_security import auth_required, roles_required, current_user, login_user, roles_accepted
from werkzeug.security import check_password_hash, generate_password_hash
from .utily import roles_list


@app.route('/', methods = ['GET'])
def home():
    return render_template('index.html')

@app.route('/admin') 
@auth_required('token') # Authentication
@roles_required('admin') # Authorization / RBAC 
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


@app.route('/api/export')
@auth_required("token")
@roles_required("admin")
def export_csv():
    result = download_reservations_csv.delay()
    return jsonify({"id": result.id})


@app.route('/api/csv_result/<id>')
@auth_required("token")
@roles_required("admin")
def get_csv_file(id):
    result = AsyncResult(id)
    if not result.ready():
        return jsonify({"status": "Pending", "message": "File is still being generated. Try again later."}), 202
    if result.failed():
        return jsonify({"status": "Failed", "message": "Task failed to complete."}), 500
    filename = result.result
    if not filename:
        return jsonify({"status": "Error", "message": "No file generated."}), 500
    try:
        print("Sending file:", filename)
        print("Directory contents:", os.listdir('static'))
        return send_from_directory('static', filename, as_attachment=True)
    except Exception as e:
        print("Error sending file:", e)
        return jsonify({"status": "Error", "message": str(e)}), 500
    

@app.route('/api/mail', methods=['GET'])
def send_reports():
    res = monthly_reservation_report.delay()
    return {
        "status": "queued",
        "task_id": res.id
    }