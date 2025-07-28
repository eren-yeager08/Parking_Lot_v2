# Parking Lot_v2 -App-dev2-

# Steps to start Parking Lot_v2  -Application

# Step1:-Start Redis Server in WSL(Ubuntu):
 command(redis-server )

# Step2:- Start MailHog in WSL(Ubuntu):
command(MailHog)

# Step:-3 Activate Virtual Environment in PowerShell:
.\env\Scripts\activate

# Step:-4 Run the Main Application:
python app.py

# Step:-5 Start Celery Worker:
celery -A app.celery  worker --loglevel INFO

# Step:-6 Start Celery Beat:
celery -A app.celery beat --loglevel=INFO
