import grpc
import time
import threading
import sys
import os

# Add parent directory to path to import generated protos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from lastmile.v1 import matching_pb2, matching_pb2_grpc

def run_load():
    # Connect to localhost:50057 (requires port-forward)
    channel = grpc.insecure_channel('localhost:50057')
    stub = matching_pb2_grpc.MatchingServiceStub(channel)
    
    print("Starting load generation on localhost:50057...")
    while True:
        try:
            # Send a dummy request
            # We use dummy IDs. The service might return empty response or error, 
            # but it will consume CPU to process the request (deserialization, logic, etc.)
            stub.TryMatch(matching_pb2.TryMatchRequest(
                driver_id="d1", 
                route_id="r1", 
                station_id="s1", 
                arrival_eta_unix=int(time.time())
            ))
        except grpc.RpcError as e:
            # Ignore errors, we just want to generate load
            pass
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    threads = []
    # Launch 20 threads to generate enough load
    for i in range(20):
        t = threading.Thread(target=run_load)
        t.daemon = True
        t.start()
        threads.append(t)

    print("Load generator running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping...")
