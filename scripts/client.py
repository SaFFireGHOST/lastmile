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
    common_pb2,
)

# Default addresses (override with env vars if needed)
RIDER_ADDR   = os.getenv("RIDER_ADDR",   "localhost:50054")
DRIVER_ADDR  = os.getenv("DRIVER_ADDR",  "localhost:50053")
STATION_ADDR = os.getenv("STATION_ADDR", "localhost:50052")


async def create_rider_request(rider_stub: rider_pb2_grpc.RiderServiceStub):
    print("\n== New Rider Request ==")
    rider_id = input("Rider ID (e.g., rider_1): ").strip() or "rider_1"
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
            rider_id=rider_id,
            station_id=station_id,
            eta_unix=eta_unix,
            dest_area=dest_area,
            status=status,
        )
    )
    resp = await rider_stub.AddRequest(req)
    print("\n[RiderService] Added request:")
    print(resp)


async def register_driver_route(driver_stub: driver_pb2_grpc.DriverServiceStub):
    print("\n== Register Driver Route ==")
    driver_id = input("Driver ID (e.g., driver_1): ").strip() or "driver_1"
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
        driver_id=driver_id,
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


async def main():
    # Channels
    rider_ch = grpc.aio.insecure_channel(RIDER_ADDR)
    driver_ch = grpc.aio.insecure_channel(DRIVER_ADDR)
    station_ch = grpc.aio.insecure_channel(STATION_ADDR)

    # Stubs
    rider_stub = rider_pb2_grpc.RiderServiceStub(rider_ch)
    driver_stub = driver_pb2_grpc.DriverServiceStub(driver_ch)
    station_stub = station_pb2_grpc.StationServiceStub(station_ch)

    print("LastMile Interactive Client")
    print("---------------------------")
    print(f"RiderService   -> {RIDER_ADDR}")
    print(f"DriverService  -> {DRIVER_ADDR}")
    print(f"StationService -> {STATION_ADDR}\n")

    while True:
        print("\nMenu:")
        print("  1) Rider  - Create a rider request")
        print("  2) Driver - Register a driver route")
        print("  3) Station - Upsert station metadata")
        print("  0) Exit")
        choice = input("Select: ").strip()

        if choice == "1":
            try:
                await create_rider_request(rider_stub)
            except Exception as e:
                print(f"[error] Rider request failed: {e}")
        elif choice == "2":
            try:
                await register_driver_route(driver_stub)
            except Exception as e:
                print(f"[error] Register route failed: {e}")
        elif choice == "3":
            try:
                await upsert_station(station_stub)
            except Exception as e:
                print(f"[error] Upsert station failed: {e}")
        elif choice == "0" or choice.lower() in ("q", "quit", "exit"):
            break
        else:
            print("Invalid option.")

    # Close channels cleanly
    await rider_ch.close()
    await driver_ch.close()
    await station_ch.close()


if __name__ == "__main__":
    asyncio.run(main())
