#!/bin/bash

# Function to generate load
generate_load() {
    echo "Starting load generation..."
    # We need to hit the matching service. 
    # The matching service is called by the Gateway when a driver or rider performs an action?
    # Actually, TryMatch is called by... let's check matching_svc.py again.
    # It seems TryMatch is a gRPC method. Who calls it?
    # I need to find who calls TryMatch.
    # If it's not exposed via Gateway, I might need to port-forward and call it using grpcurl or a python script.
    
    # Let's assume for now we can hit an endpoint that triggers it.
    # If not, I will write a small python script to call the gRPC service directly.
    
    # Placeholder for load generation loop
    while true; do
        # Simulating load...
        # In a real scenario, we would call the gateway or the service directly.
        # Since I need to demonstrate scaling, I need to generate enough CPU load.
        # Just calling the service might not be enough if the service logic is light.
        # But let's try to call it repeatedly.
        sleep 0.1
    done
}

# Check if we need to build images
if [ "$1" == "build" ]; then
    echo "Building images..."
    docker build -t lastmile-backend:latest -f Dockerfile.backend .
    docker build -t lastmile-frontend:latest -f frontend/Dockerfile frontend/
fi

# Apply manifests
echo "Applying manifests..."
kubectl apply -f k8s/

# Wait for pods
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=300s

# Port forward gateway if needed (not needed for internal load gen, but maybe for external access)
# kubectl port-forward svc/gateway 5000:5000 &

echo "Starting monitoring..."
# Watch HPA and Pods in a separate terminal or background
# xterm -e "watch kubectl get hpa,pods" &

echo "To demonstrate scaling, we need to generate load."
echo "Since the matching service logic is simple, we might need a lot of requests."
echo "I will create a separate python script 'load_gen.py' to call the gRPC service directly."

# Create load_gen.py
cat <<EOF > load_gen.py
import grpc
import time
import threading
from lastmile.v1 import matching_pb2, matching_pb2_grpc

def run_load():
    channel = grpc.insecure_channel('localhost:50057')
    stub = matching_pb2_grpc.MatchingServiceStub(channel)
    while True:
        try:
            # Send a dummy request
            stub.TryMatch(matching_pb2.TryMatchRequest(
                driver_id="d1", route_id="r1", station_id="s1", arrival_eta_unix=int(time.time())
            ))
        except:
            pass

threads = []
for i in range(10):
    t = threading.Thread(target=run_load)
    t.start()
    threads.append(t)

for t in threads:
    t.join()
EOF

echo "Please run: kubectl port-forward svc/matching-svc 50057:50057"
echo "Then run: python3 load_gen.py"
echo "Watch: kubectl get hpa -w"

