import asyncio
import grpc
from lastmile.v1 import trip_pb2, trip_pb2_grpc, common_pb2
from common.run import serve

class TripStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.trips: dict[str, common_pb2.Trip] = {}
        self._seq = 0

class TripServer(trip_pb2_grpc.TripServiceServicer):
    def __init__(self):
        self.store = TripStore()

    async def CreateTrip(self, request, context):
        async with self.store.lock:
            self.store._seq += 1
            tid = f"trip_{self.store._seq}"
            t = common_pb2.Trip(
                id=tid, driver_id=request.driver_id, rider_ids=list(request.rider_ids),
                route_id=request.route_id, station_id=request.station_id, status="SCHEDULED"
            )
            self.store.trips[tid] = t
            return trip_pb2.CreateTripResponse(trip=t)

    async def UpdateTripStatus(self, request, context):
        async with self.store.lock:
            t = self.store.trips.get(request.trip_id)
            if not t:
                return trip_pb2.UpdateTripStatusResponse()
            t = common_pb2.Trip(
                id=t.id, driver_id=t.driver_id, rider_ids=list(t.rider_ids),
                route_id=t.route_id, station_id=t.station_id, status=request.status
            )
            self.store.trips[t.id] = t
            return trip_pb2.UpdateTripStatusResponse(trip=t)

def factory():
    server = grpc.aio.server()
    trip_pb2_grpc.add_TripServiceServicer_to_server(TripServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50055")
