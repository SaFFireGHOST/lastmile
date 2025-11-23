import asyncio
import grpc
from lastmile.v1 import user_pb2, user_pb2_grpc, common_pb2
from common.run import serve

class UserServer(user_pb2_grpc.UserServiceServicer):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._users: dict[str, common_pb2.User] = {}
        self._pw: dict[str, str] = {}

    async def CreateUser(self, request, context):
        async with self._lock:
            u = request.user
            uid = u.id or f"user_{len(self._users)+1}"
            nu = common_pb2.User(id=uid, role=u.role, name=u.name, phone=u.phone, rating=u.rating)
            self._users[uid] = nu
            self._pw[u.phone] = request.password
            return user_pb2.CreateUserResponse(user=nu)

    async def GetUser(self, request, context):
        async with self._lock:
            u = self._users.get(request.id)
            return user_pb2.GetUserResponse(user=u)

    async def Authenticate(self, request, context):
        async with self._lock:
            if self._pw.get(request.phone) == request.password:
                for u in self._users.values():
                    if u.phone == request.phone:
                        return user_pb2.AuthenticateResponse(user_id=u.id, jwt="demo-jwt")
            return user_pb2.AuthenticateResponse()

def factory():
    server = grpc.aio.server()
    user_pb2_grpc.add_UserServiceServicer_to_server(UserServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50051")
