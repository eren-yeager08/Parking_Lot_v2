from flask_restful import Resource, reqparse, Api, request
from .models import *
from flask_security import auth_required, roles_required, roles_accepted, current_user
from datetime import datetime
from .database import db
from .utily import roles_list



api = Api()

# ----------------------------
# Parsers
# ----------------------------

lot_parser = reqparse.RequestParser()
lot_parser.add_argument('prime_location_name', required=True)
lot_parser.add_argument('address', required=True)
lot_parser.add_argument('pincode', required=True)
lot_parser.add_argument('price_per_hour', type=float, required=True)
lot_parser.add_argument('maximum_number_of_spots', type=int, required=True)

reserve_parser = reqparse.RequestParser()
reserve_parser.add_argument('spot_id', type=int, required=True)
reserve_parser.add_argument('vehicle_number', required=True)
reserve_parser.add_argument('cost_per_hour', type=float, required=True)

class ParkingLotAPI(Resource):

    def get(self, lot_id=None):
        if lot_id is None:
            # Return all parking lots with spots
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
                    "spots": [
                        {
                            "id": spot.id,
                            "status": spot.status
                        } for spot in lot.spots  # assuming backref/relationship exists
                    ]
                })

            if lots_json:
                return lots_json, 200
            return {"message": "No parking lots found"}, 404

        else:
            # Return single lot by ID
            lot = ParkingLot.query.get(lot_id)
            return {
                "id": lot.id,
                "prime_location_name": lot.prime_location_name,
                "address": lot.address,
                "pincode": lot.pincode,
                "price_per_hour": lot.price_per_hour,
                "maximum_number_of_spots": lot.maximum_number_of_spots,
                "spots": [
                    {
                        "id": spot.id,
                        "status": spot.status
                    } for spot in lot.spots
                ]
            }, 200


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

        # Auto-create empty spots
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

        # Update lot first
        lot.maximum_number_of_spots = new_max
        db.session.commit()

        if new_max > old_max:
            # Add new spots
            for _ in range(new_max - old_max):
                new_spot = ParkingSpot(lot_id=lot.id, status='A')
                db.session.add(new_spot)
            db.session.commit()
        elif new_max < old_max:
            # Remove *only* AVAILABLE extra spots
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

        # Ensure no occupied spots
        occupied_spots = [spot for spot in lot.spots if spot.status != 'A']
        if occupied_spots:
            return {"message": "Cannot delete lot: some spots are still occupied"}, 400

        db.session.delete(lot)
        db.session.commit()
        return {"message": "Parking lot deleted successfully"}, 200

api.add_resource(ParkingLotAPI, '/api/lots', '/api/lots/<int:lot_id>',
                                '/api/create')

# -----------------------------------------------------------------------------------------

class SpotResource(Resource):
    @auth_required('token')
    @roles_accepted('admin')          # or ('user', 'admin') if users may delete
    def delete(self, spot_id):
        spot = ParkingSpot.query.get_or_404(spot_id)
        lot  = ParkingLot.query.get_or_404(spot.lot_id)

        if spot.status == 'O':
            return {"message": "Cannot delete an occupied spot"}, 400

        db.session.delete(spot)
        db.session.flush()                        # spot actually gone now

        # ❱❱ recalc capacity from the DB, then store it
        lot.maximum_number_of_spots = (
            ParkingSpot.query.filter_by(lot_id=lot.id).count()
        )
        db.session.commit()

        return {"message": "Spot deleted successfully"}, 200
    
# after api = Api(app)
api.add_resource(SpotResource, '/api/spots/<int:spot_id>')

####################################################################################

class CurrentUserAPI(Resource):
    """
    GET /api/me
    Returns the logged‑in user’s basic details and roles.
    """
    @auth_required('token')
    def get(self):
        return {
            "id": current_user.id,
            "name": getattr(current_user, "username", None)
                    or getattr(current_user, "email", None)
                    or "User",
            "roles": roles_list(current_user.roles)     # e.g. ["admin"] or ["user"]
        }, 200


# Register the endpoint once, next to your other resources
api.add_resource(CurrentUserAPI, "/api/me")

#####################################################################################
class UserListAPI(Resource):
    """
    GET /api/users   →  list of all registered users
    (admin token required)
    """
    @auth_required('token')
    @roles_required('admin')          # <-- only admins allowed
    def get(self):
        users = User.query.filter(User.id != current_user.id).all()
        return [
            {
                "id":       u.id,
                "email":    u.email,
                "username": u.username,
                "pincode":  u.pincode
            } for u in users
        ], 200


# register once, alongside your other resources
api.add_resource(UserListAPI, "/api/users")