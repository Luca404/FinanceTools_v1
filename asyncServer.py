import socketio
import os
import datetime
import pandas as pd
import yfinance as yf
from pandas_datareader import data as wb
import json
import math

server = socketio.AsyncServer(async_mode="asgi")
app = socketio.ASGIApp(server, static_files={
    '/': './public/pfManager.html',
    "/static": "./public/",
})
 
@server.event
async def connect(sid, env):
    print(sid, "connected")

@server.event
async def disconnect(sid):
    print(sid, "disconnected")

@server.event
async def login(sid, data):
    username = data["username"]
    password = data["password"]
    with open("./json/users/users.json") as f:
        data = json.load(f)
    accountExist = False
    logged = False
    for user in data["Users"]:
        if( user["usern"] == username ):
            accountExist = True
            if( int(user["passwd"]) == int(password) ):
                logged = True

    if( accountExist and not(logged) ):
        text = "Wrong Password"
    elif( not(accountExist) and not(logged) ):
        text = "Account does not exist"
    else:
        text = username
    await server.emit("loginResult", {"status":logged,"text":text}, to=sid)

@server.event
async def getTickersList(sid, data):
    tickerType = str(data["type"]).lower()
    exchange = str(data["exchange"]).lower()
    with open( "./json/tickersList/" + tickerType + "/" + exchange + ".json" ) as f:
        jsonData = json.load(f)
    tickersList = jsonData["data"]
    return {"data": tickersList, "type":tickerType, "exchange":exchange}

@server.event
async def getPfList(sid, data):
    pfData = []
    username = data["username"]
    with open("./json/portfolios.json") as f:
        data = json.load(f)
    for pf in data["PortFolios"]:
        if( pf["userID"] == username ):
            pfData.append(pf)
    
    return pfData  

@server.event
async def savePf(sid, data):
    try:
        pfData = []
        with open("./json/portfolios.json") as f:
            pfData = json.load(f)
        pfData["PortFolios"].append( data )
        with open("./json/portfolios.json", "w") as f:
            json.dump( pfData, f, indent=2 )
        return 1
    except:
        return 0

@server.event
async def deletePf(sid, data):
    try:
        pfData = []
        with open("./json/portfolios.json") as f:
            pfData = json.load(f)
        k = 0
        for i in pfData["PortFolios"]:
            if( i == data ):
                del pfData["PortFolios"][k]
            k += 1
        with open("./json/portfolios.json", "w") as f:
            json.dump( pfData, f, indent=2 )
        return 1
    except:
        return 0

@server.event
async def getSingleAssetData(sid, data):
    dfData = pd.DataFrame()
    dataList = list(data["tickers"].split(","))
    for ticker in dataList:
        #Read ticker data from file if exist
        if( os.path.isfile("./json/tickers/" + ticker + ".json") ):
            dfData[ticker] = pd.read_json("./json/tickers/" + str(ticker) + ".json" , typ='series')            
            
        #Load ticker data from yahoo and save to file
        else:
            dfData[ticker] = loadTickerPrice( ticker )
        

    #dfData.set_index([0], inplace=True)
    #Set Period
    startYear = datetime.datetime.now().year - int(data["period"])
    date = datetime.datetime.strptime( str(startYear) + '-01-01', '%Y-%m-%d')
    #dateTs = time.mktime(date.timetuple()) * 1000
    dfData = dfData.loc[date:]

    #Normalize data to 100
    if(data["norm"]):
        for ticker in dataList:
            dfData[ticker] = (dfData[ticker]/dfData[ticker].iloc[0] * 100)
    
    #Get single assets info
    assetInfo = {}
    assetInfo = getAssetsInfo( dfData.columns )

    #Send data to client
    return { "data": dfData.to_json(), "info": assetInfo }

@server.event
async def getPfData(sid, data):
    dfData = pd.DataFrame()
    dataList = list(data["tickers"].split(","))
    for ticker in dataList:
        #Read ticker data from file if exist
        if( os.path.isfile("./json/tickers/" + ticker + ".json") ):
            dfData[ticker] = pd.read_json("./json/tickers/" + str(ticker) + ".json" , typ='series')            
            
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

    pfInfo = {}
    pfInfo["TotRet"] = round( ((dfData["pfRet"][-1] / dfData["pfRet"][0]) - 1) * 100, 2 )
    pfInfo["AnnualRet"] = round( ((dfData["pfRet"]/dfData["pfRet"].shift(1)) - 1).mean() * 250 * 100, 2 )

    #calculate portfolio max drawdown
    highwatermarks = dfData["pfRet"].cummax()
    drawdowns = 1 - (1 + dfData["pfRet"]) / (1 + highwatermarks)
    pfInfo["MDD"] = round( max(drawdowns) * 100, 2 )

    pfInfo["STD"] = round((dfData["pfRet"].std() * 250) ** 0.5, 2)

    #Send data to client
    return { "data": dfData.to_json(), "info": pfInfo }


def getAssetsInfo( tickers ):
    assetInfo = {}
    assetData = []
    infoData = []
    with open("./json/assetInfo/assetInfo.json") as f:
        fileData = json.load(f)
    for t in tickers:        
        assetInfo = {}
        found = False
        for k in fileData["info"]:
            if( k["Symbol"] == t ):
                assetInfo = k
                found = True
        if( not(found) ):
            assetData = yf.Ticker( t ).info
            assetInfo["Symbol"] = t
            assetInfo["Name"] = assetData["longName"]
            assetInfo["Type"] = assetData["quoteType"]
            assetInfo["Sector"] = assetData["sector"]
            assetInfo["Industry"] = assetData["industry"]
            assetInfo["Country"] = assetData["country"]

            fileData["info"].append( assetInfo )
            with open("./json/assetInfo/assetInfo.json", "w") as f:
                json.dump(fileData, f, indent=4)
            
        infoData.append(assetInfo)
    
    return infoData


def loadTickerPrice(ticker):
    data = pd.Series()
    data = wb.DataReader(ticker, data_source="yahoo", start='2000-1-1', end="2022-1-1")['Adj Close']
    
    #Save to json
    path = "./json/tickers/" + ticker + ".json"
    data.to_json( path )
    
    return data
