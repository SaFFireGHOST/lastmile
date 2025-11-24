import time
import grpc
import os
import sys
from lastmile.v1 import location_pb2, location_pb2_grpc, common_pb2

# Connect to localhost:50058 (requires port-forward)
LOCATION_ADDR = "localhost:50058"

def run():
    print(f"Connecting to {LOCATION_ADDR}...")
    channel = grpc.insecure_channel(LOCATION_ADDR)
    stub = location_pb2_grpc.LocationServiceStub(channel)
    
    driver_id = "6922be78fd50866ae63ea410"
    route_id = "6924ab6fb4bb67f50c26d008"
    
    def generate_location():
        print("Generating location...")
        loc = location_pb2.DriverLocation(
            driver_id=driver_id,
            route_id=route_id,
            point=common_pb2.LatLng(lat=12.9751, lon=77.6071),
            ts_unix=int(time.time())
        )
        yield loc
        print("Location yielded.")
        
    try:
        print("Calling StreamDriverLocation...")
        ack = stub.StreamDriverLocation(generate_location())
        print(f"Success! ACK: {ack}")
    except grpc.RpcError as e:
        print(f"RpcError: {e}")
        print(f"Code: {e.code()}")
        print(f"Details: {e.details()}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    run()
