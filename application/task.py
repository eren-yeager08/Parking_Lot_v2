from celery import shared_task
from .models import User, Reservation, ParkingLot
from datetime import datetime, date
import csv
from .utily import format_report
from .mail import send_email
from sqlalchemy import extract



@shared_task(ignore_results=False, name="download_csv_report")
def export_user_csv(user_id):
        user = User.query.get(user_id)
        reservations = Reservation.query.filter_by(user_id=user.id).all()
        filename = f"user_reservations_{user.username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        with open(f'static/{filename}', 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([
            "Reservation ID", "Lot Name", "Spot ID", "Vehicle Number",
            "Parking Time", "Leaving Time", "Total Cost", "Status"
            ])
            for r in reservations:
                writer.writerow([
                    r.id,
                    r.spot.lot.prime_location_name if r.spot and r.spot.lot else "N/A",
                    r.spot.id if r.spot else "N/A",
                    r.vehicle_number if r.vehicle_number else "N/A",
                    r.parking_time.strftime('%d-%m-%Y %I:%M %p') if r.parking_time else "N/A",
                    r.leaving_time.strftime('%d-%m-%Y %I:%M %p') if r.leaving_time else "Active",
                    r.total_cost if r.total_cost else "Pending",
                    "Completed" if r.leaving_time else "Active"
                ])
        return filename



@shared_task(ignore_results=False, name="monthly_reservation_report")
def monthly_reservation_report():
    now = datetime.now()
    users = User.query.all()
    for user in users[1:]:  # Skip super admin
        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            extract('month', Reservation.parking_time) == now.month,
            extract('year', Reservation.parking_time) == now.year
            ).all()
        total_spent = sum([r.total_cost or 0 for r in reservations])
        lot_usage = {}
        for res in reservations:
            lot = res.spot.lot.prime_location_name
            lot_usage[lot] = lot_usage.get(lot, 0) + 1
        most_used_lot = max(lot_usage, key=lot_usage.get) if lot_usage else "N/A"
        user_data = {
            "username": user.username,
            "email": user.email,
            "summary": { "total_bookings": len(reservations), "amount_spent": total_spent, "most_used_lot": most_used_lot},
            "reservations": [
                {
                    "lot": r.spot.lot.prime_location_name,
                    "vehicle": r.vehicle_number,
                    "spot": f"Spot-{r.spot.id}",
                    "booked_at": r.parking_time.strftime("%d-%m-%Y %I:%M %p"),
                    "released_at": r.leaving_time.strftime("%d-%m-%Y %I:%M %p") if r.leaving_time else "Not Released",
                    "cost": r.total_cost if r.total_cost else "Pending"
                }
                for r in reservations
            ]
        }
        html_message = format_report("templates/mail.html", {"data": user_data})
        send_email(user.email, subject="Monthly Parking Report", message=html_message, content="html")
    return "Monthly Report sent"

     

@shared_task(name="daily_reminder")
def daily_reminder():
    today = date.today()
    lots_available = ParkingLot.query.count() > 0
    users = User.query.all()
    for user in users[1:]: 
        has_today_reservation = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.parking_time >= datetime(today.year, today.month, today.day)
        ).count() > 0
        template_data = {
            "username": user.username,
            "missed": not has_today_reservation and lots_available
        }
        html_message = format_report("templates/daily_reminder.html", template_data)
        send_email(
            user.email,
            subject="Your Daily Parking Reminder",
            message=html_message,
            content="html"
        )
    return "Daily reminders sent."
