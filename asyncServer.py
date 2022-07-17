import socketio
import pandas as pd
from pandas_datareader import data as wb

server = socketio.AsyncServer(async_mode="asgi")
app = socketio.ASGIApp(server, static_files={
    "/": "./public/"
})

@server.event
async def connect(sid, env):
    print(sid, "connected")

@server.event
async def disconnect(sid):
    print(sid, "disconnected")

@server.event
async def pfInfo(sid, data):
    df = loadPriceHistory(data["tickers"], data["period"], data["norm"])
    await server.emit("pfHistory", df, to=sid)


def loadPriceHistory(tickers, period, norm):
    data = pd.DataFrame()
    #Download data from yahoo
    for ticker in list(tickers.split(",")):
        print(ticker)
        data[ticker] = wb.DataReader(ticker, data_source="yahoo", start='2020-1-1', end="2022-1-1")['Adj Close']
    #Normalize data to 100
    if(norm):
        data = (data/data.iloc[0] * 100)
    return data.to_json()
