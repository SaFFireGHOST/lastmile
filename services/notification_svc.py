import grpc
from lastmile.v1 import notification_pb2, notification_pb2_grpc
from common.run import serve

class NotificationServer(notification_pb2_grpc.NotificationServiceServicer):
    async def Push(self, request, context):
        print(f"[notification] Push request={request}")
        for t in request.targets:
            print(f"[notify] to={t.user_id} via={t.channel} title='{request.title}' body='{request.body}' data={request.data_json}")
        return notification_pb2.PushResponse(attempted=len(request.targets), success=len(request.targets))

def factory():
    server = grpc.aio.server()
    notification_pb2_grpc.add_NotificationServiceServicer_to_server(NotificationServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50056")
