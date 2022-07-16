import socketio

server = socketio.Server()
app = socketio.WSGIApp(server)

@server.event
def connect(sid, env):
    print(sid, "connected")

@server.event
def disconnect(sid):
    print(sid, "disconnected")