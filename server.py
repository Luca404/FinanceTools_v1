import socketio
from waitress import serve

server = socketio.Server()
app = socketio.WSGIApp(server, static_files={
    "/": "./public/"
})

@server.event
def connect(sid, env):
    print(sid, "connected")

@server.event
def disconnect(sid):
    print(sid, "disconnected")

serve(app, listen='*:8081')