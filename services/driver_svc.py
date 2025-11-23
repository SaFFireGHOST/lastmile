import asyncio
import grpc
from lastmile.v1 import driver_pb2, driver_pb2_grpc
from common.run import serve

class DriverStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.routes: dict[str, driver_pb2.DriverRoute] = {}

class DriverServer(driver_pb2_grpc.DriverServiceServicer):
    def __init__(self):
        self.store = DriverStore()

    async def RegisterRoute(self, request, context):
        r = request.route
        async with self.store.lock:
            rid = r.id or f"route_{r.driver_id}_{len(self.store.routes)+1}"
            seats_free = r.seats_free or r.seats_total
            nr = driver_pb2.DriverRoute(
                id=rid, driver_id=r.driver_id, dest_area=r.dest_area,
                seats_total=r.seats_total, seats_free=seats_free, stations=list(r.stations)
            )
            self.store.routes[rid] = nr
            return driver_pb2.RegisterRouteResponse(route=nr)

    async def UpdateSeats(self, request, context):
        async with self.store.lock:
            r = self.store.routes.get(request.route_id)
            if not r:
                return driver_pb2.UpdateSeatsResponse()
            # rebuild with updated seats
            r = driver_pb2.DriverRoute(
                id=r.id, driver_id=r.driver_id, dest_area=r.dest_area,
                seats_total=r.seats_total, seats_free=request.seats_free, stations=list(r.stations)
            )
            self.store.routes[r.id] = r
            return driver_pb2.UpdateSeatsResponse(route=r)

    async def GetRoute(self, request, context):
        async with self.store.lock:
            r = self.store.routes.get(request.route_id)
        return driver_pb2.GetRouteResponse(route=r)

def factory():
    server = grpc.aio.server()
    driver_pb2_grpc.add_DriverServiceServicer_to_server(DriverServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50053")
