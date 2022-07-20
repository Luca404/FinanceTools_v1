import socketio
import os
import datetime
import time
import pandas as pd
import numpy as np
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
async def getPfData(sid, data):
    dfData = pd.DataFrame()
    dataList = list(data["tickers"].split(","))
    for ticker in dataList:
        #Read ticker data from file if exist
        if( os.path.isfile("./json/" + ticker + ".json") ):
            dfData[ticker] = pd.read_json("./json/" + str(ticker) + ".json" , typ='series')            
            
        #Load ticker data from yahoo and save to file
        else:
            dfData[ticker] = loadTickerPrice( ticker )

    #dfData.set_index([0], inplace=True)
    #Set Period
    startYear = datetime.datetime.now().year - int(data["period"])
    date = datetime.datetime.strptime( str(startYear) + '-01-01', '%Y-%m-%d')
    #dateTs = time.mktime(date.timetuple()) * 1000
    dfData = dfData.loc[date:]

    #Calculate portfolio return
    weights = data["weights"]
    i = 0
    dfData["pfRet"] = 0
    for ticker in dataList:
        dfData["pfRet"] = dfData["pfRet"] + dfData[ticker] * weights[i]
        i+=1

    #Normalize data to 100
    if(data["norm"]):
        for ticker in dataList:
            dfData[ticker] = (dfData[ticker]/dfData[ticker].iloc[0] * 100)

    
    #Send data to client
    await server.emit("pfData", dfData.to_json(), to=sid)


def loadTickerPrice(ticker):
    data = pd.Series()
    data = wb.DataReader(ticker, data_source="yahoo", start='2000-1-1', end="2022-1-1")['Adj Close']
    
    #Save to json
    path = "./json/" + ticker + ".json"
    data.to_json( path )
    
    return data
