import asyncio
import grpc
from lastmile.v1 import station_pb2, station_pb2_grpc, common_pb2
from common.run import serve

class StationServer(station_pb2_grpc.StationServiceServicer):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._stations: dict[str, common_pb2.Station] = {}

    async def UpsertStation(self, request, context):
        s = request.station
        sid = s.id or f"st_{s.name}"
        ns = common_pb2.Station(
            id=sid, name=s.name, location=s.location, nearby_areas=list(s.nearby_areas)
        )
        async with self._lock:
            self._stations[sid] = ns
        return station_pb2.UpsertStationResponse(station=ns)

    async def GetStation(self, request, context):
        async with self._lock:
            st = self._stations.get(request.id)
        return station_pb2.GetStationResponse(station=st)

    async def ListStations(self, request, context):
        async with self._lock:
            return station_pb2.ListStationsResponse(stations=list(self._stations.values()))

    async def NearbyAreas(self, request, context):
        async with self._lock:
            st = self._stations.get(request.id)
        return station_pb2.NearbyAreasResponse(nearby_areas=(st.nearby_areas if st else []))

def factory():
    server = grpc.aio.server()
    station_pb2_grpc.add_StationServiceServicer_to_server(StationServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50052")
