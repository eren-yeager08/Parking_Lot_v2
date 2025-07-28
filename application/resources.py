from flask_restful import Resource, reqparse, Api, request
from .models import *
from flask_security import auth_required, roles_required, roles_accepted, current_user
from datetime import datetime ,timezone, timedelta
from .database import db
from .utily import *
from application.cache import cache

api = Api()

lot_parser = reqparse.RequestParser()
lot_parser.add_argument('prime_location_name', required=True)
lot_parser.add_argument('address', required=True)
lot_parser.add_argument('pincode', required=True)
lot_parser.add_argument('price_per_hour', type=float, required=True)
lot_parser.add_argument('maximum_number_of_spots', type=int, required=True)

####################################################################################

reserve_parser = reqparse.RequestParser()
reserve_parser.add_argument('spot_id', type=int, required=True)
reserve_parser.add_argument('vehicle_number', required=True)
reserve_parser.add_argument('cost_per_hour', type=float, required=True)

####################################################################################

class ParkingLotAPI(Resource):
    def get(self, lot_id=None):
        if lot_id is None:
            lots = ParkingLot.query.all()
            lots_json = []
            for lot in lots:
                lots_json.append({
                    "id": lot.id,
                    "prime_location_name": lot.prime_location_name,
                    "address": lot.address,
                    "pincode": lot.pincode,
                    "price_per_hour": lot.price_per_hour,
                    "maximum_number_of_spots": lot.maximum_number_of_spots,
                    "spots": [{"id": spot.id, "status": spot.status} for spot in lot.spots]
                })
            if lots_json:
                return lots_json, 200
            return {"message": "No parking lots found"}, 404
        else:
            lot = ParkingLot.query.get(lot_id)
            return {
                "id": lot.id,
                "prime_location_name": lot.prime_location_name,
                "address": lot.address,
                "pincode": lot.pincode,
                "price_per_hour": lot.price_per_hour,
                "maximum_number_of_spots": lot.maximum_number_of_spots,
                "spots": [{"id": spot.id, "status": spot.status} for spot in lot.spots ]}, 200
                
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        args = lot_parser.parse_args()
        lot = ParkingLot(prime_location_name = args['prime_location_name'],
                        address = args['address'],
                        pincode = args['pincode'],
                        price_per_hour = args['price_per_hour'],
                        maximum_number_of_spots = args['maximum_number_of_spots'])
        db.session.add(lot)
        db.session.commit()
        for _ in range(lot.maximum_number_of_spots):
            spot = ParkingSpot(lot_id=lot.id, status='A')
            db.session.add(spot)
        db.session.commit()
        return {"lot_id": lot.id, "message": "Parking lot created with spots"}, 201

    @auth_required('token')
    @roles_required('admin')
    def put(self, lot_id):
        lot = ParkingLot.query.get(lot_id)
        data = request.get_json()
        lot.prime_location_name = data['prime_location_name']
        lot.address = data['address']
        lot.pincode = data['pincode']
        lot.price_per_hour = float(data['price_per_hour'])
        new_max = int(data['maximum_number_of_spots'])
        old_max = lot.maximum_number_of_spots
        lot.maximum_number_of_spots = new_max
        db.session.commit()

        if new_max > old_max:
            for _ in range(new_max - old_max):
                new_spot = ParkingSpot(lot_id=lot.id, status='A')
                db.session.add(new_spot)
            db.session.commit()
        elif new_max < old_max:
            extra_spots = (
                ParkingSpot.query
                .filter_by(lot_id=lot.id, status='A')
                .order_by(ParkingSpot.id.desc())
                .limit(old_max - new_max)
                .all()
            )
            for spot in extra_spots:
                db.session.delete(spot)
            db.session.commit()
        return {"message": "Parking lot updated successfully"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, lot_id):
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return {"message": "Parking lot not found"}, 404
        if any(spot.status == 'O' for spot in lot.spots):
            return {"message": "Cannot delete — one or more spots are occupied"}, 400
        occupied_spots = [spot for spot in lot.spots if spot.status != 'A']
        if occupied_spots:
            return {"message": "Cannot delete lot: some spots are still occupied"}, 400
        db.session.delete(lot)
        db.session.commit()
        return {"message": "Parking lot deleted successfully"}, 200

api.add_resource(ParkingLotAPI, '/api/lots', '/api/lots/<int:lot_id>')

####################################################################################

class SpotResource(Resource):
    @auth_required('token')
    @roles_accepted('admin')         
    def delete(self, spot_id):
        spot = ParkingSpot.query.get_or_404(spot_id)
        lot  = ParkingLot.query.get_or_404(spot.lot_id)
        if spot.status == 'O':
            return {"message": "Cannot delete an occupied spot"}, 400
        db.session.delete(spot)
        db.session.flush()                        
        lot.maximum_number_of_spots = (
            ParkingSpot.query.filter_by(lot_id=lot.id).count())
        db.session.commit()
        return {"message": "Spot deleted successfully"}, 200
    
api.add_resource(SpotResource, '/api/spots/<int:spot_id>')

####################################################################################

class CurrentUserAPI(Resource):
    @auth_required('token')
    def get(self):
        return {
            "id": current_user.id,
            "name": getattr(current_user, "username", None)
                    or getattr(current_user, "email", None)
                    or "User",
            "roles": roles_list(current_user.roles)}, 200

api.add_resource(CurrentUserAPI, "/api/me")

#####################################################################################

class UserListAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    @cache.cached(timeout=300)
    def get(self):
        users = User.query.filter(User.id != current_user.id).all()
        data = []
        for u in users:
            total_reservations = Reservation.query.filter_by(user_id=u.id).count()
            total_paid = db.session.query(
                db.func.coalesce(db.func.sum(Reservation.total_cost), 0)
            ).filter_by(user_id=u.id).scalar()
            data.append({
                "id":       u.id,
                "email":    u.email,
                "username": u.username,
                "pincode":  u.pincode,
                "total_reservations": total_reservations,
                "total_paid": round(total_paid, 2)
            })
        return data, 200

api.add_resource(UserListAPI, "/api/users")

####################################################################################

class AdminSummaryAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    @cache.cached(timeout=300)
    def get(self):
        total_users = User.query.filter(User.roles.any(name='user')).count()
        total_lots = ParkingLot.query.count()
        total_spots = ParkingSpot.query.all()
        available = sum(1 for s in total_spots if s.status == 'A')
        occupied = sum(1 for s in total_spots if s.status == 'O')

        lots = ParkingLot.query.all()
        lots_data = []
        for lot in lots:
            spots = lot.spots
            available_count = sum(1 for s in spots if s.status == 'A')
            occupied_count = sum(1 for s in spots if s.status == 'O')
            reservations = Reservation.query.join(ParkingSpot).filter(
                ParkingSpot.lot_id == lot.id,
                Reservation.leaving_time.isnot(None)
            ).all()
            lot_revenue = 0
            for r in reservations:
                lot_revenue += calc_total(r)
            lots_data.append({
                "id": lot.id,
                "name": lot.prime_location_name,
                "available": available_count,
                "occupied": occupied_count,
                "revenue": round(lot_revenue, 2)
            })
        total_revenue = round(sum(lot["revenue"] for lot in lots_data), 2)
        return {
            "user_count": total_users,
            "lot_count": total_lots,
            "available_count": available,
            "occupied_count": occupied,
            "total_revenue": total_revenue,
            "lots": lots_data
        }, 200

api.add_resource(AdminSummaryAPI, "/api/admin_summary")

####################################################################################

class MyReservationAPI(Resource):
    @auth_required('token')
    @cache.cached(timeout=300)
    def get(self):
        history = []
        for r in current_user.reservations:
            lot = r.spot.lot
            history.append({
                "id": r.id,
                "lot_id": lot.id,
                "spot_id": r.spot.id,                           
                "address": lot.address,
                "vehicle_number": r.vehicle_number,
                "parking_time": r.parking_time.isoformat(),
                "leaving_time": r.leaving_time.isoformat() if r.leaving_time else None,
                "total_cost": calc_total(r)
            })
        return history, 200

api.add_resource(MyReservationAPI, "/api/my_reservations")

####################################################################################
class ReservationCostAPI(Resource):
    @auth_required('token')
    @cache.cached(timeout=300)
    def get(self, res_id):
        r = Reservation.query.get_or_404(res_id)
        if r.user_id != current_user.id and not current_user.has_role('admin'):
            return 403 
        return {"total_cost": calc_total(r)}, 200

api.add_resource(ReservationCostAPI, "/api/reservations/<int:res_id>/cost_now")

####################################################################################

class ReservationAPI(Resource):
    @auth_required('token')
    def post(self):
        data = request.get_json()
        lot_id = data['lot_id']
        spot_id = data['spot_id']
        vehicle = data['vehicle_number']
        spot = ParkingSpot.query.get(spot_id)
        IST = timezone(timedelta(hours=5, minutes=30))
        if not spot or spot.status != 'A':
            return {"message": "Invalid or unavailable spot"}, 400
        spot.status = 'O'
        r = Reservation(
            user_id=current_user.id,
            spot_id=spot.id,
            vehicle_number=vehicle,
            parking_time=datetime.now(IST),
            cost_per_hour=spot.lot.price_per_hour
        )
        db.session.add(r)
        db.session.commit()
        return {"message": "Reservation successful"}, 201
    
    @auth_required('token')
    def delete(self, reservation_id):
        resv = Reservation.query.get_or_404(reservation_id)
        IST = timezone(timedelta(hours=5, minutes=30))
        if resv.user_id != current_user.id:
            return {"message": "Unauthorized"}, 403
        resv.leaving_time = datetime.now(IST)
        resv.spot.status = 'A'
        resv.total_cost = calc_total(resv)
        db.session.commit()
        return {"message": "Reservation released"}, 200
    
api.add_resource(ReservationAPI, "/api/reservations", "/api/reservations/<int:reservation_id>")

####################################################################################

class UserSummaryAPI(Resource):
    @auth_required('token')
    @cache.cached(timeout=300)
    def get(self):
        from collections import Counter
        usage = Counter()
        for r in current_user.reservations:
            lot = r.spot.lot
            usage[lot.address] += 1
        total = sum(usage.values())  
        summary = {
            "labels": list(usage.keys()),
            "data": list(usage.values()),
            "total_used_spots": total
        }
        return summary, 200
api.add_resource(UserSummaryAPI, "/api/user_summary")

####################################################################################

class SpotInfoAPI(Resource):
    @auth_required('token')
    @cache.cached(timeout=300)
    def get(self, spot_id):
        spot = ParkingSpot.query.get_or_404(spot_id)
        reservation = Reservation.query.filter_by(spot_id=spot.id, leaving_time=None).first()
        if not reservation:
            return {"message": "No active reservation found"}, 404
        estimated_cost = calc_total(reservation) 
        return {
            "id": reservation.id,
            "user_id": reservation.user_id,
            "vehicle_number": reservation.vehicle_number,
            "parking_time": reservation.parking_time.isoformat(),
            "estimated_cost": estimated_cost  
        }, 200

api.add_resource(SpotInfoAPI, "/api/spot_info/<int:spot_id>")




