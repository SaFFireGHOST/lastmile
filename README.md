# LastMile — Python gRPC Microservices (Demo)

This repo contains 8 gRPC microservices implemented with `grpc.aio` and matching `.proto` files.

## Structure
```
api/proto/lastmile/v1/*.proto   # protobuf APIs
common/                         # helpers
services/                       # microservices (asyncio gRPC)
scripts/                        # protoc + driver demo
```

## Setup
```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
bash scripts/gen_protos.sh
```

## Run (separate terminals)
```
python services/user_svc.py
python services/station_svc.py
python services/driver_svc.py
python services/rider_svc.py
python services/trip_svc.py
python services/notification_svc.py
DRIVER_ADDR=localhost:50053 RIDER_ADDR=localhost:50054 TRIP_ADDR=localhost:50055 NOTIFY_ADDR=localhost:50056 python services/matching_svc.py
MATCH_ADDR=localhost:50057 python services/location_svc.py
```

## Seed and Demo
Use `grpcurl` or your own client to:
- Upsert a station
- Register a driver route (id like `route_D1@MG_ROAD`)
- Add rider requests
- Send a driver location near station via `scripts/driver_ping.py`
