import asyncio
import time
import grpc
import os
import sys
from lastmile.v1 import location_pb2, location_pb2_grpc, common_pb2

LOCATION_ADDR = os.getenv("LOCATION_ADDR", "localhost:50058")

async def ping_location(driver_id: str, route_id: str, lat: float = 12.9751, lon: float = 77.6071, interval: int = 5, count: int = 10):
    """
    Stream driver location updates to the location service.
    
    Args:
        driver_id: The authenticated driver's user ID
        route_id: The route ID returned when registering the route
        lat: Starting latitude
        lon: Starting longitude
        interval: Seconds between updates
        count: Number of updates to send
    """
    ch = grpc.aio.insecure_channel(LOCATION_ADDR)
    stub = location_pb2_grpc.LocationServiceStub(ch)
    
    print(f"Starting location stream for driver={driver_id}, route={route_id}")
    print(f"Will send {count} updates every {interval} seconds")
    
    async def generate_locations():
        for i in range(count):
            # Simulate slight movement (you can make this more realistic)
            current_lat = lat + (i * 0.001)
            current_lon = lon + (i * 0.001)
            
            loc = location_pb2.DriverLocation(
                driver_id=driver_id,
                route_id=route_id,
                point=common_pb2.LatLng(lat=current_lat, lon=current_lon),
                ts_unix=int(time.time())
            )
            
            print(f"[{i+1}/{count}] Sending location: lat={current_lat:.4f}, lon={current_lon:.4f}")
            yield loc
            
            if i < count - 1:  # Don't sleep after the last one
                await asyncio.sleep(interval)
    
    try:
        ack = await stub.StreamDriverLocation(generate_locations())
        print(f"\nStream completed. ACK: {ack}")
    except Exception as e:
        print(f"\nError streaming location: {e}")
    finally:
        await ch.close()

async def main():
    print("=== Driver Location Ping Tool ===\n")
    
    # Get driver_id
    driver_id = input("Driver ID (from signup): ").strip()
    if not driver_id:
        print("Error: Driver ID is required")
        sys.exit(1)
    
    # Get route_id
    route_id = input("Route ID (from registration): ").strip()
    if not route_id:
        print("Error: Route ID is required")
        sys.exit(1)
    
    # Get optional parameters with defaults
    lat_input = input("Starting Latitude [12.9751]: ").strip()
    lat = float(lat_input) if lat_input else 12.9751
    
    lon_input = input("Starting Longitude [77.6071]: ").strip()
    lon = float(lon_input) if lon_input else 77.6071
    
    interval_input = input("Interval between updates in seconds [5]: ").strip()
    interval = int(interval_input) if interval_input else 5
    
    count_input = input("Number of location updates to send [10]: ").strip()
    count = int(count_input) if count_input else 10
    
    print()  # Empty line for readability
    await ping_location(driver_id, route_id, lat, lon, interval, count)

if __name__ == "__main__":
    asyncio.run(main())
