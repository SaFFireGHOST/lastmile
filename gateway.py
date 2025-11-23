# gateway.py
import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import grpc
from google.protobuf.json_format import MessageToDict

# Import your generated gRPC code
# Ensure you are running this from the 'lastmile' root directory
from lastmile.v1 import (
    user_pb2, user_pb2_grpc,
    station_pb2, station_pb2_grpc,
    rider_pb2, rider_pb2_grpc,
    driver_pb2, driver_pb2_grpc,
    location_pb2, location_pb2_grpc,
    common_pb2
)

app = Flask(__name__)
# Enable CORS to allow your React frontend (running on a different port) to call this API
CORS(app)

# Configuration (Ports must match your services/ files)
USER_ADDR = os.getenv("USER_ADDR", "localhost:50051")
STATION_ADDR = os.getenv("STATION_ADDR", "localhost:50052")
DRIVER_ADDR = os.getenv("DRIVER_ADDR", "localhost:50053")
RIDER_ADDR = os.getenv("RIDER_ADDR", "localhost:50054")
LOCATION_ADDR = os.getenv("LOCATION_ADDR", "localhost:50058")

# --- Helper functions to get gRPC stubs ---
def get_user_stub():
    channel = grpc.insecure_channel(USER_ADDR)
    return user_pb2_grpc.UserServiceStub(channel)

def get_station_stub():
    channel = grpc.insecure_channel(STATION_ADDR)
    return station_pb2_grpc.StationServiceStub(channel)

def get_rider_stub():
    channel = grpc.insecure_channel(RIDER_ADDR)
    return rider_pb2_grpc.RiderServiceStub(channel)

def get_driver_stub():
    channel = grpc.insecure_channel(DRIVER_ADDR)
    return driver_pb2_grpc.DriverServiceStub(channel)

def get_location_stub():
    channel = grpc.insecure_channel(LOCATION_ADDR)
    return location_pb2_grpc.LocationServiceStub(channel)


# --- Routes ---

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

# 1. User Authentication
@app.route('/api/signup', methods=['POST'])
def signup():
    """Creates a new user (Rider or Driver)"""
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    password = data.get('password')
    role_str = data.get('role', 'RIDER').upper()
    
    # Map string role to Enum
    role_enum = getattr(common_pb2, role_str, common_pb2.RIDER)
    
    user = common_pb2.User(name=name, phone=phone, role=role_enum)
    req = user_pb2.CreateUserRequest(user=user, password=password)
    
    stub = get_user_stub()
    try:
        resp = stub.CreateUser(req)
        # MessageToDict converts Protobuf object to standard Python Dict for JSON response
        return jsonify(MessageToDict(resp.user)), 200
    except grpc.RpcError as e:
        return jsonify({"error": e.details()}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates user and returns ID + Role"""
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    req = user_pb2.AuthenticateRequest(phone=phone, password=password)
    stub = get_user_stub()
    try:
        resp = stub.Authenticate(req)
        if resp.user_id:
             # The auth response only has ID, let's fetch full user info to give the frontend the Role
            user_resp = stub.GetUser(user_pb2.GetUserRequest(id=resp.user_id))
            user_dict = MessageToDict(user_resp.user)
            return jsonify({
                "token": resp.jwt, 
                "user": user_dict
            }), 200
        else:
             return jsonify({"error": "Invalid credentials"}), 401
    except grpc.RpcError as e:
        return jsonify({"error": e.details()}), 500


# 2. Stations
@app.route('/api/stations', methods=['GET'])
def list_stations():
    """Returns a list of all available stations"""
    stub = get_station_stub()
    try:
        resp = stub.ListStations(common_pb2.Empty())
        stations = [MessageToDict(s) for s in resp.stations]
        return jsonify(stations), 200
    except grpc.RpcError as e:
        return jsonify({"error": e.details()}), 500


# 3. Rider Operations
@app.route('/api/rider/request', methods=['POST'])
def create_rider_request():
    """Creates a ride request for a specific station"""
    data = request.json
    
    rider_id = data.get('rider_id')
    station_id = data.get('station_id')
    dest_area = data.get('dest_area')
    
    # Calculate ETA Unix Timestamp (current time + minutes)
    mins = int(data.get('eta_minutes', 10))
    eta_unix = int(time.time()) + mins * 60
    
    req_msg = common_pb2.RiderRequest(
        rider_id=rider_id,
        station_id=station_id,
        dest_area=dest_area,
        eta_unix=eta_unix,
        status="PENDING"
    )
    
    stub = get_rider_stub()
    try:
        resp = stub.AddRequest(rider_pb2.AddRequestRequest(request=req_msg))
        return jsonify(MessageToDict(resp.request)), 200
    except grpc.RpcError as e:
         return jsonify({"error": e.details()}), 500

@app.route('/api/rider/requests', methods=['GET'])
def get_rider_requests():
    """
    Optional: Fetch pending requests for a station.
    Useful if you want to show a 'Live Board' on the frontend.
    """
    station_id = request.args.get('station_id')
    if not station_id:
        return jsonify({"error": "station_id required"}), 400
        
    stub = get_rider_stub()
    try:
        now = int(time.time())
        # List requests +/- 30 mins window
        resp = stub.ListPendingAtStation(rider_pb2.ListPendingAtStationRequest(
            station_id=station_id,
            now_unix=now,
            minutes_window=30,
            dest_area="" # Empty matches all
        ))
        requests = [MessageToDict(r) for r in resp.requests]
        return jsonify(requests), 200
    except grpc.RpcError as e:
        return jsonify({"error": e.details()}), 500


# 4. Driver Operations
@app.route('/api/driver/route', methods=['POST'])
def create_driver_route():
    """Registers a driver's route (capacity and stations)"""
    data = request.json
    driver_id = data.get('driver_id')
    dest_area = data.get('dest_area')
    seats_total = int(data.get('seats_total', 3))
    
    # Frontend sends list of station IDs ["MG_ROAD", "INDIRANAGAR"]
    station_ids = data.get('stations', []) 
    
    route_stations = []
    for sid in station_ids:
        # Default match window 5 mins
        route_stations.append(driver_pb2.RouteStation(station_id=sid, minutes_before_eta_match=5))

    route = driver_pb2.DriverRoute(
        driver_id=driver_id,
        dest_area=dest_area,
        seats_total=seats_total,
        seats_free=seats_total,
        stations=route_stations
    )
    
    stub = get_driver_stub()
    try:
        resp = stub.RegisterRoute(driver_pb2.RegisterRouteRequest(route=route))
        return jsonify(MessageToDict(resp.route)), 200
    except grpc.RpcError as e:
        return jsonify({"error": e.details()}), 500

@app.route('/api/driver/location', methods=['POST'])
def update_driver_location():
    """Updates driver location. Expects driver_id, route_id, lat, lon."""
    data = request.json
    driver_id = data.get('driver_id')
    route_id = data.get('route_id')
    lat = float(data.get('lat'))
    lon = float(data.get('lon'))
    
    stub = get_location_stub()
    
    def generate_location():
        loc = location_pb2.DriverLocation(
            driver_id=driver_id,
            route_id=route_id,
            point=common_pb2.LatLng(lat=lat, lon=lon),
            ts_unix=int(time.time())
        )
        yield loc
        
    try:
        # StreamDriverLocation expects an iterator
        stub.StreamDriverLocation(generate_location())
        return jsonify({"status": "updated"}), 200
    except grpc.RpcError as e:
        return jsonify({"error": e.details()}), 500


# ... existing imports ...
from common.db import get_db
from bson import ObjectId

# ... existing code ...

# 5. Notifications
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Fetch notifications for a user"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
        
    db = get_db()
    # Get last 50 notifications, newest first
    notifs = list(db.notifications.find({"user_id": user_id}).sort("timestamp", -1).limit(50))
    
    # Convert ObjectId to string
    for n in notifs:
        n['id'] = str(n.pop('_id'))
        
    return jsonify(notifs), 200

@app.route('/api/notifications/<notif_id>/read', methods=['PUT'])
def mark_notification_read(notif_id):
    """Mark a notification as read"""
    db = get_db()
    try:
        db.notifications.update_one(
            {"_id": ObjectId(notif_id)},
            {"$set": {"read": True}}
        )
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_notifications_read():
    """Mark all notifications as read for a user"""
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
        
    db = get_db()
    db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return jsonify({"status": "ok"}), 200

@app.route('/api/notifications/clear', methods=['DELETE'])
def clear_notifications():
    """Clear all notifications for a user"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
        
    db = get_db()
    db.notifications.delete_many({"user_id": user_id})
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    print("Starting Flask API Gateway on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)