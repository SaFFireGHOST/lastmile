import asyncio
import grpc
from lastmile.v1 import trip_pb2, trip_pb2_grpc, common_pb2
from common.run import serve
from common.db import get_db

class TripStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.trips: dict[str, common_pb2.Trip] = {}
        self._seq = 0

class TripServer(trip_pb2_grpc.TripServiceServicer):
    def __init__(self):
        self.db = get_db()
        self.trips = self.db.trips

    async def CreateTrip(self, request, context):
        print(f"[trip] CreateTrip request={request}")
        
        trip_doc = {
            "driver_id": request.driver_id,
            "rider_ids": list(request.rider_ids),
            "route_id": request.route_id,
            "station_id": request.station_id,
            "status": "SCHEDULED"
        }
        res = self.trips.insert_one(trip_doc)
        tid = str(res.inserted_id)
        
        t = common_pb2.Trip(
            id=tid, driver_id=request.driver_id, rider_ids=list(request.rider_ids),
            route_id=request.route_id, station_id=request.station_id, status="SCHEDULED"
        )
        return trip_pb2.CreateTripResponse(trip=t)

    async def UpdateTripStatus(self, request, context):
        print(f"[trip] UpdateTripStatus request={request}")
        from bson.objectid import ObjectId
        try:
            oid = ObjectId(request.trip_id)
            res = self.trips.find_one_and_update(
                {"_id": oid},
                {"$set": {"status": request.status}},
                return_document=True
            )
        except:
            res = None
            
        if not res:
            return trip_pb2.UpdateTripStatusResponse()
            
        t = common_pb2.Trip(
            id=str(res["_id"]),
            driver_id=res["driver_id"],
            rider_ids=res["rider_ids"],
            route_id=res["route_id"],
            station_id=res["station_id"],
            status=res["status"]
        )
        return trip_pb2.UpdateTripStatusResponse(trip=t)

def factory():
    server = grpc.aio.server()
    trip_pb2_grpc.add_TripServiceServicer_to_server(TripServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50055")
