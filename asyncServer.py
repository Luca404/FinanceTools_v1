import socketio
import os
import datetime
import time
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
    dfData = pd.DataFrame()
    for ticker in list(data["tickers"].split(",")):
        #Read ticker data from file if exist
        if( os.path.isfile("./json/" + ticker + ".json") ):
            dfData[ticker] = pd.read_json("./json/" + ticker + ".json")
        #Load ticker data from yahoo and save to file
        else:
            dfData[ticker] = loadTickerPrice( ticker )

    #Set Period
    startYear = datetime.datetime.now().year - data["period"]
    date = datetime.datetime.strptime( str(startYear) + '-01-01', '%Y-%m-%d')
    dateTs = time.mktime(date.timetuple()) * 1000
    dfData = dfData.loc[dateTs:]

    #Normalize data to 100
    if(data["norm"]):
        dfData = (dfData/dfData.iloc[0] * 100)

    #Send data to client
    await server.emit("pfHistory", dfData.to_json(), to=sid)



def loadTickerPrice(ticker):
    data = pd.Series()
    data = wb.DataReader(ticker, data_source="yahoo", start='2000-1-1', end="2022-1-1")['Adj Close']
    
    #Save to json
    path = "./json/" + ticker + ".json"
    data.to_json( path )
    
    return data
