import asyncio
import time
import grpc
from lastmile.v1 import rider_pb2, rider_pb2_grpc, common_pb2
from common.run import serve

class RiderStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.requests: dict[str, common_pb2.RiderRequest] = {}
        self.by_station: dict[str, set[str]] = {}

class RiderServer(rider_pb2_grpc.RiderServiceServicer):
    def __init__(self):
        self.store = RiderStore()

    async def AddRequest(self, request, context):
        r = request.request
        rid = r.id or f"req_{int(time.time_ns())}"
        req = common_pb2.RiderRequest(
            id=rid, rider_id=r.rider_id, station_id=r.station_id,
            eta_unix=r.eta_unix, dest_area=r.dest_area,
            status=(r.status or "PENDING"),
        )
        async with self.store.lock:
            self.store.requests[rid] = req
            self.store.by_station.setdefault(req.station_id, set()).add(rid)
        return rider_pb2.AddRequestResponse(request=req)

    async def ListPendingAtStation(self, request, context):
        now = request.now_unix
        window = request.minutes_window
        lo, hi = now - window*60, now + window*60

        out = []
        async with self.store.lock:
            ids = self.store.by_station.get(request.station_id, set())
            for _id in ids:
                rr = self.store.requests[_id]
                if rr.status == "PENDING" and rr.dest_area == request.dest_area and lo <= rr.eta_unix <= hi:
                    out.append(rr)
        out.sort(key=lambda r: r.eta_unix)
        return rider_pb2.ListPendingAtStationResponse(requests=out)

    async def MarkAssigned(self, request, context):
        n = 0
        async with self.store.lock:
            for rid in request.request_ids:
                rr = self.store.requests.get(rid)
                if rr and rr.status == "PENDING":
                    self.store.requests[rid] = common_pb2.RiderRequest(
                        id=rr.id, rider_id=rr.rider_id, station_id=rr.station_id,
                        eta_unix=rr.eta_unix, dest_area=rr.dest_area, status="ASSIGNED"
                    )
                    n += 1
        return rider_pb2.MarkAssignedResponse(updated=n)

def factory():
    server = grpc.aio.server()
    rider_pb2_grpc.add_RiderServiceServicer_to_server(RiderServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50054")
