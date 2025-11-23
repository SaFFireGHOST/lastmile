import asyncio, time, grpc
from lastmile.v1 import location_pb2, location_pb2_grpc, common_pb2

async def main():
    ch = grpc.aio.insecure_channel("localhost:50058")
    stub = location_pb2_grpc.LocationServiceStub(ch)
    async def gen():
        yield location_pb2.DriverLocation(
            driver_id="driver_1",
            point=common_pb2.LatLng(lat=12.9751, lon=77.6071),  # current location 
            ts_unix=int(time.time()),           # current time 
            route_id="route_D1@MG_ROAD"
        )
        await asyncio.sleep(0.1)
    ack = await stub.StreamDriverLocation(gen())
    print("ACK:", ack)

if __name__ == "__main__":
    asyncio.run(main())
