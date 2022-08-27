from fileinput import filename
import socketio
import os
import datetime
import pandas as pd
import numpy as np
import yfinance as yf
from pandas_datareader import data as wb
import json
import math
import re

server = socketio.AsyncServer(async_mode="asgi")
app = socketio.ASGIApp(server, static_files={
    '/': './public/pfManager.html',
    '/overview':"./public/pfOverview.html",
    '/correlation':"./public/pfCorrelation.html",
    '/risk':"./public/pfRisk.html",
    '/markowitz':"./public/pfMarkowitz.html",
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
async def registerUser( sid, data ):
    with open( "./json/users/users.json", "r" ) as f:
        jsonData = json.load( f )
    jsonData["Users"].append( {"usern":data["username"], "passwd":data["password"]} )
    with open(  "./json/users/users.json", "w" ) as f:
        json.dump( jsonData, f )

@server.event
async def getTickersList(sid):
    files = os.listdir("./json/tickersList/")
    tickersList = {}
    for file in files:
        fileName = file.split( ".json" )[0]
        with open( "./json/tickersList/" + file ) as f:
            jsonData = json.load(f)
        tickersList[fileName] = jsonData["data"]
    return {"data": tickersList}

@server.event
async def getPfList(sid, data):
    pfList = []
    pfList = loadPfList( data["username"] )
    return {"data": pfList}

@server.event
async def savePf(sid, data):
    try:
        pfData = []
        with open("./json/portfolios.json") as f:
            pfData = json.load(f)
        
        k = 0
        for pf in pfData["PortFolios"]:
            if( pf["userID"] == data["user"] ):
                pfData["PortFolios"][k]["pfData"].append( data["data"] )
            k += 1
        
        with open("./json/portfolios.json", "w") as f:
            json.dump( pfData, f, indent=2 )
        
        pfList = loadPfList( data["user"] )
        return {"data": pfList}
    except:
        return 0

@server.event
async def modifyPf(sid, data):
    pfData = []
    with open("./json/portfolios.json") as f:
        pfData = json.load(f)
    
    c = 0
    k = 0
    for pf in pfData["PortFolios"]:
        if( pf["userID"] == data["user"] ):
            print( "Pollo" )
            for i in pf["pfData"]:
                if( k == int(data["pfNum"]) ):
                    pfData["PortFolios"][c]["pfData"][k] = data["data"]
                    break
                k += 1
        c += 1
    
    with open("./json/portfolios.json", "w") as f:
        json.dump( pfData, f, indent=2 )
    
    pfList = loadPfList( data["user"] )
    return {"data": pfList}


@server.event
async def deletePf(sid, data):
    pfData = []
    with open("./json/portfolios.json") as f:
        pfData = json.load(f)

    c = 0
    k = 0
    for pf in pfData["PortFolios"]:
        if( pf["userID"] == data["user"] ):
            for i in pf["pfData"]:
                if( i == data["data"] ):
                    del pfData["PortFolios"][c]["pfData"][k]
                    break
                k += 1
        c += 1

    with open("./json/portfolios.json", "w") as f:
        json.dump( pfData, f, indent=2 )

    pfList = loadPfList( data["user"] )
    return {"data": pfList}

@server.event
async def getSingleAssetData(sid, data):
    dfData = pd.DataFrame()
    dfData = loadPfData( data, True )
    tickers = list(data["tickers"].split(","))
    #Normalize data to 100
    if(data["norm"]):
        for ticker in tickers:
            dfData[ticker] = (dfData[ticker]/dfData[ticker].iloc[0] * 100)

    #Send data to client
    return { "data": dfData.to_json() }

@server.event
async def getSingleAssetInfo(sid, data):
    dfData = pd.DataFrame()
    dfData = loadPfData( data, True )
    weights = calculateWeights( data["weights"], dfData )
    #Get single assets info
    assetInfo = getAssetsInfo( dfData.columns )

    #Send data to client
    return { "weights": weights, "info": assetInfo }

@server.event
async def getPfData(sid, data):
    dfData = pd.DataFrame()
    dfData = loadPfData( data, False )
    pfInfo = {}
    pfInfoYoY = {}
    pfInfo, pfInfoYoY = getPfInfo( dfData["pfRet"] )
    
    #Send data to client
    return { "data": dfData.to_json(), "info": pfInfo, "infoYoY": pfInfoYoY }

@server.event
async def getCorrData( sid, data ):
    dfData = pd.DataFrame()
    pfRet = pd.Series()
    dfData = loadPfData( data, False )
    pfRet = dfData["pfRet"]
    dfData = dfData.loc[:, dfData.columns!='pfRet']
    corrMatrix = dfData.corr()
    corrMatrix = round(corrMatrix, 2)
    pfCorrData = getPfCorr( pfRet )
    return {"assetsCorr": corrMatrix.to_json(), "pfCorr": pfCorrData["ret"].to_json()}

@server.event
async def getRiskData( sid, data ):
    dfData = loadPfData( data, False )
    dfData = dfData.loc[:, dfData.columns!='pfRet']
    weights = np.array( calculateWeights( data["weights"], dfData ) )
    returns = np.log(dfData/dfData.shift(1))

    pfVariance = np.dot( weights.T, np.dot( returns.cov() * 250, weights ) )
    pfVolatility = pfVariance ** 0.5
    diversRisk = pfVariance
    print( pfVariance )
    k = 0
    for weight in weights:
        assetVariance = returns[ returns.columns[k] ].var() * 250
        print( assetVariance )
        diversRisk = diversRisk - ( (weight)**2 * assetVariance )
        k += 1
    nonDiversRisk = pfVariance - diversRisk

    pfVolatility = round( pfVolatility * 100, 2 )
    diversRisk = round( diversRisk * 100, 2 )
    nonDiversRisk = round( nonDiversRisk * 100, 2 ) 
    return { "pfVolatility": pfVolatility, "diversRisk": diversRisk, "nonDiversRisk": nonDiversRisk}




#Server's functions
def loadPfList( usrn ):
    pfData = []
    with open("./json/portfolios.json") as f:
        data = json.load(f)
    for pf in data["PortFolios"]:
        if( pf["userID"] == usrn ):
            pfData.append(pf["pfData"])
    return pfData[0]

def calculateWeights( weights, dfData ):
    means = dfData.mean()
    assetsValue = []
    assetsWeights = []
    totValue = 0
    k = 0
    for i in means:
        assetsValue.append( i * weights[k] )
        totValue = totValue + i * weights[k]
        k += 1
    for i in assetsValue:
        assetsWeights.append( i/totValue )
    
    return assetsWeights

def loadPfData( data, singleAsset ):
    dfData = pd.DataFrame()
    tickers = list(data["tickers"].split(","))
    for ticker in tickers:
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
    if( not(singleAsset) ):
        weights = data["weights"]
        i = 0
        dfData["pfRet"] = 0
        for ticker in tickers:
            dfData["pfRet"] = dfData["pfRet"] + dfData[ticker] * weights[i]
            i+=1

    return dfData

def getPfCorr( pfData ):
    data = pd.DataFrame()
    data["ret"] = pfData
    startIndex = str(data["ret"].index[0]).split( " " )[0]
    
    #Add Gold Data
    goldData = pd.read_json( "./json/tickers/GC=F.json", typ='series' )
    data["gold"] = goldData[startIndex:]

    #Add Inflation Data
    inflationData = pd.Series()
    inflationData = pd.read_csv( "./json/corr/inflation.csv" )
    inflationData = inflationData.set_index( "DATE" )
    inflStartIndex = re.sub(r".$", "1", startIndex)
    inflationData = inflationData[inflStartIndex:]
    inflIndexes = inflationData.index
    indexes = data["ret"].index
    k = 0
    y = 0
    inflData = []
    for i in data["ret"]:
        inflData.append( inflationData["DATA"][k] )
        if( str(indexes[y]).split("-")[1].split("-")[0] != str(inflIndexes[k]).split("-")[1].split("-")[0] ):
            k += 1
        y += 1
    
    data["inflation"] = inflData
    
    #Add US Market Data
    usData = pd.read_json( "./json/tickers/^GSPC.json", typ="series" )
    data["US"] = usData[startIndex:]

    #Add Europe Market Data
    euData = pd.read_json( "./json/tickers/IEUR.json", typ="series" )
    data["EU"] = euData[startIndex:]

    #Add Asia Market Data
    asiaData = pd.read_json( "./json/tickers/AAXJ.json", typ="series" )
    data["Asia"] = asiaData[startIndex:]

    #Calculate Correlation
    corrMatrix = data.corr()
    corrMatrix = round(corrMatrix, 2)

    return corrMatrix

def getPfInfo( pfData ):
    pfInfo = {}
    #portfolio Total return
    pfInfo["TotRet"] = round( ((pfData[-1] / pfData[0]) - 1) * 100, 2 )

    #portfolio Annualized Return
    pfInfo["AnnualRet"] = round( ((pfData/pfData.shift(1)) - 1).mean() * 250 * 100, 2 )

    #portfolio max drawdown
    highwatermarks = pfData.cummax()
    drawdowns = 1 - (1 + pfData) / (1 + highwatermarks)
    pfInfo["MDD"] = round( max(drawdowns) * 100, 2 )

    #portfolio standard deviation
    pfInfo["STD"] = round((pfData.std() * 250) ** 0.5, 2)

    #Calculate year over year info
    dfDataYoY = pd.Series()
    dataYoY = []
    indexes = pfData.index.values.astype(str)
    year = indexes[0].split("-")[0]
    index = year
    values = []
    ind = 0
    for i in pfData:
        values.append(i)
        year = indexes[ind].split("-")[0]
        if( year != index ):
            dfDataYoY[index] = values
            values = []
            index = year
        ind += 1
    if( values != [] ):
        dfDataYoY[index] = values

    pfInfoYoY = {}

    for ind in dfDataYoY.index:
        returnYoY = round( ( (dfDataYoY[ind][-1]/dfDataYoY[ind][0]) - 1 ) * 100, 2 )
        highwatermarks = pd.Series(dfDataYoY[ind]).cummax()
        drawdowns = 1 - (1 + pd.Series(dfDataYoY[ind])) / (1 + highwatermarks)
        MDDYoY = round( max(drawdowns) * 100, 2 )
        STDYoY = round((pd.Series(dfDataYoY[ind]).std() * 250) ** 0.5, 2) 
        pfInfoYoY[ind] = {"return": returnYoY, "MDD": MDDYoY, "STD": STDYoY}

    return pfInfo, pfInfoYoY

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
