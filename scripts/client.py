# scripts/interactive_client.py
import asyncio
import os
import time
import grpc

# Adjust imports to match where you generated stubs:
from lastmile.v1 import (
    rider_pb2, rider_pb2_grpc,
    driver_pb2, driver_pb2_grpc,
    station_pb2, station_pb2_grpc,
    user_pb2, user_pb2_grpc,
    common_pb2,
)

# Default addresses (override with env vars if needed)
RIDER_ADDR   = os.getenv("RIDER_ADDR",   "localhost:50054")
DRIVER_ADDR  = os.getenv("DRIVER_ADDR",  "localhost:50053")
STATION_ADDR = os.getenv("STATION_ADDR", "localhost:50052")
USER_ADDR    = os.getenv("USER_ADDR",    "localhost:50051")


async def create_rider_request(rider_stub: rider_pb2_grpc.RiderServiceStub, user_id: str):
    print("\n== New Rider Request ==")
    # Rider ID is the authenticated user ID
    station_id = input("Station ID (e.g., MG_ROAD): ").strip() or "MG_ROAD"
    dest_area = input("Destination area (e.g., Indiranagar): ").strip() or "Indiranagar"

    # MINUTES-ONLY ETA
    mins_str = input("ETA in minutes from now [10]: ").strip()
    try:
        mins = int(mins_str) if mins_str else 10
    except ValueError:
        print("Invalid number, using 10.")
        mins = 10
    eta_unix = int(time.time()) + mins * 60

    status = "PENDING"

    req = rider_pb2.AddRequestRequest(
        request=common_pb2.RiderRequest(
            rider_id=user_id,
            station_id=station_id,
            eta_unix=eta_unix,
            dest_area=dest_area,
            status=status,
        )
    )
    resp = await rider_stub.AddRequest(req)
    print("\n[RiderService] Added request:")
    print(resp)


async def register_driver_route(driver_stub: driver_pb2_grpc.DriverServiceStub, user_id: str):
    print("\n== Register Driver Route ==")
    # Driver ID is the authenticated user ID
    route_id = input("Route ID (blank to auto; tip: route_D1@MG_ROAD): ").strip()
    dest_area = input("Destination area (e.g., Indiranagar): ").strip() or "Indiranagar"

    def _int(prompt, default):
        s = input(f"{prompt} [{default}]: ").strip()
        if not s:
            return default
        try:
            return int(s)
        except ValueError:
            return default

    seats_total = _int("Seats total", 3)
    seats_free = _int("Seats free (<= total)", seats_total)

    # stations along route
    print("\nAdd stations in the route (comma separated StationIDs).")
    print("Example: MG_ROAD,TRINITY (leave blank to default MG_ROAD)")
    stations_line = input("Stations: ").strip()
    if not stations_line:
        station_ids = ["MG_ROAD"]
    else:
        station_ids = [s.strip() for s in stations_line.split(",") if s.strip()]

    minutes_before_eta_match = _int("Minutes before ETA to consider matching", 5)
    stations = [
        driver_pb2.RouteStation(station_id=sid, minutes_before_eta_match=minutes_before_eta_match)
        for sid in station_ids
    ]

    route = driver_pb2.DriverRoute(
        id=route_id,
        driver_id=user_id,
        dest_area=dest_area,
        seats_total=seats_total,
        seats_free=seats_free,
        stations=stations,
    )
    resp = await driver_stub.RegisterRoute(driver_pb2.RegisterRouteRequest(route=route))
    print("\n[DriverService] Registered route:")
    print(resp)


async def upsert_station(station_stub: station_pb2_grpc.StationServiceStub):
    print("\n== Upsert Station ==")
    sid = input("Station ID (e.g., MG_ROAD): ").strip() or "MG_ROAD"
    name = input("Station name (e.g., MG Road): ").strip() or "MG Road"

    def _float(prompt, default):
        s = input(f"{prompt} [{default}]: ").strip()
        if not s:
            return default
        try:
            return float(s)
        except ValueError:
            return default

    lat = _float("Latitude", 12.975)
    lon = _float("Longitude", 77.607)

    nearby = input("Nearby areas (comma separated; default: Indiranagar,Ulsoor): ").strip()
    if not nearby:
        nearby_areas = ["Indiranagar", "Ulsoor"]
    else:
        nearby_areas = [x.strip() for x in nearby.split(",") if x.strip()]

    station = common_pb2.Station(
        id=sid,
        name=name,
        location=common_pb2.LatLng(lat=lat, lon=lon),
        nearby_areas=nearby_areas,
    )
    resp = await station_stub.UpsertStation(station_pb2.UpsertStationRequest(station=station))
    print("\n[StationService] Upserted station:")
    print(resp)


async def signup(user_stub: user_pb2_grpc.UserServiceStub):
    print("\n== Signup ==")
    # ID is auto-generated
    role_str = input("Role (RIDER/DRIVER) [RIDER]: ").strip().upper() or "RIDER"
    try:
        role_enum = getattr(common_pb2, role_str)
    except AttributeError:
        role_enum = common_pb2.RIDER

    name = input("Name: ").strip() or "Test User"
    phone = input("Phone: ").strip() or "1234567890"
    rating = float(input("Rating [5.0]: ").strip() or "5.0")
    password = input("Password [secret]: ").strip() or "secret"

    user = common_pb2.User(role=role_enum, name=name, phone=phone, rating=rating)
    resp = await user_stub.CreateUser(user_pb2.CreateUserRequest(user=user, password=password))
    print("\n[UserService] Created user:")
    print(resp)
    return resp.user.id, resp.user.role

async def login(user_stub: user_pb2_grpc.UserServiceStub):
    print("\n== Login ==")
    phone = input("Phone: ").strip() or "1234567890"
    password = input("Password [secret]: ").strip() or "secret"

    resp = await user_stub.Authenticate(user_pb2.AuthenticateRequest(phone=phone, password=password))
    if resp.user_id:
        print("\n[UserService] Authenticated successfully.")
        # Need to fetch user to get role, as Authenticate only returns ID and JWT
        # But wait, Authenticate response in proto only has user_id and jwt.
        # So we need to call GetUser to get the role.
        user_resp = await user_stub.GetUser(user_pb2.GetUserRequest(id=resp.user_id))
        return resp.user_id, user_resp.user.role
    else:
        print("\n[UserService] Authentication failed.")
        return None, None

async def main():
    # Channels
    rider_ch = grpc.aio.insecure_channel(RIDER_ADDR)
    driver_ch = grpc.aio.insecure_channel(DRIVER_ADDR)
    station_ch = grpc.aio.insecure_channel(STATION_ADDR)
    user_ch = grpc.aio.insecure_channel(USER_ADDR)

    # Stubs
    rider_stub = rider_pb2_grpc.RiderServiceStub(rider_ch)
    driver_stub = driver_pb2_grpc.DriverServiceStub(driver_ch)
    station_stub = station_pb2_grpc.StationServiceStub(station_ch)
    user_stub = user_pb2_grpc.UserServiceStub(user_ch)

    print("LastMile Interactive Client")
    print("---------------------------")
    print(f"RiderService   -> {RIDER_ADDR}")
    print(f"DriverService  -> {DRIVER_ADDR}")
    print(f"StationService -> {STATION_ADDR}")
    print(f"UserService    -> {USER_ADDR}\n")

    current_user_id = None
    current_role = None

    while True:
        if not current_user_id:
            print("\nAuth Menu:")
            print("  1) Signup")
            print("  2) Login")
            print("  3) Station - Upsert station metadata (Admin)")
            print("  0) Exit")
            choice = input("Select: ").strip()

            if choice == "1":
                try:
                    uid, role = await signup(user_stub)
                    # Auto login after signup? Or just return to menu.
                    # Let's return to menu to force login or just let them login.
                    # Actually, signup returns ID and Role, so we can just set it.
                    if uid:
                        current_user_id = uid
                        current_role = role
                        role_name = common_pb2.Role.Name(current_role)
                        print(f"Logged in as {role_name} ({current_user_id})")
                except Exception as e:
                    print(f"[error] Signup failed: {e}")
            elif choice == "2":
                try:
                    uid, role = await login(user_stub)
                    if uid:
                        current_user_id = uid
                        current_role = role
                        role_name = common_pb2.Role.Name(current_role)
                        print(f"Logged in as {role_name} ({current_user_id})")
                except Exception as e:
                    print(f"[error] Login failed: {e}")
            elif choice == "3":
                try:
                    await upsert_station(station_stub)
                except Exception as e:
                    print(f"[error] Upsert station failed: {e}")
            elif choice == "0" or choice.lower() in ("q", "quit", "exit"):
                break
            else:
                print("Invalid option.")
        else:
            role_name = common_pb2.Role.Name(current_role)
            print(f"\nMain Menu ({role_name}):")
            if current_role == common_pb2.RIDER:
                print("  1) Create a rider request")
            elif current_role == common_pb2.DRIVER:
                print("  1) Register a driver route")
            
            print("  9) Logout")
            print("  0) Exit")
            choice = input("Select: ").strip()

            if choice == "1":
                if current_role == common_pb2.RIDER:
                    try:
                        await create_rider_request(rider_stub, current_user_id)
                    except Exception as e:
                        print(f"[error] Rider request failed: {e}")
                elif current_role == common_pb2.DRIVER:
                    try:
                        await register_driver_route(driver_stub, current_user_id)
                    except Exception as e:
                        print(f"[error] Register route failed: {e}")
            elif choice == "9":
                current_user_id = None
                current_role = None
                print("Logged out.")
            elif choice == "0" or choice.lower() in ("q", "quit", "exit"):
                break
            else:
                print("Invalid option.")

    # Close channels cleanly
    await rider_ch.close()
    await driver_ch.close()
    await station_ch.close()
    await user_ch.close()


if __name__ == "__main__":
    asyncio.run(main())
