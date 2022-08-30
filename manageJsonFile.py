import os
import json
import yfinance as yf
import time


def getPrice( tickers ):
    prices = []
    data = yf.download( tickers=tickers, period="1w", threads=True )
    print( data )
    time.sleep( 10 )
    for ticker in data["Adj Close"]:
        print( ticker )
        price = data["Adj Close"][ticker][-1]
        print( price )
        prices.append( { ticker: round(price, 2) } )
    print( prices )
    time.sleep( 10 )
    return prices

def changeFilesAndAddPrices():
    files = os.listdir("./json/tickersList/")
    tickersList = {}
    tickers = []
    for file in files:
        fileName = file.split( ".json" )[0]
        with open( "./json/tickersList/" + file ) as f:
            jsonData = json.load(f)
        newJsonData = {"data":[]}
        for data in jsonData["data"]:
            tickers.append( data["s"] )
        prices = getPrice( tickers )
        k = 0
        keys = list( prices[k].keys() )
        data = jsonData["data"]
        for data in jsonData["data"]:
            if( k < len(prices) ):
                keys = list( prices[k].keys() )
                if( keys[0] == data["s"] ):
                    values = list(prices[k].values())
                    newJsonData["data"].append( { data['s']:{"n":data['n'], "p":values[0]} } )
                    k += 1
                else:
                    newJsonData["data"].append( { data['s']:{"n":data['n'], "p":"noData"} } )
       
        with open( "./json/tickersList/" + fileName + "1" + ".json", "w" ) as f:
            json.dump( newJsonData, f )
        
        tickersList[fileName] = newJsonData["data"]
    
    print( tickersList )

def addPfPrices( user ):
    pfData = []
    with open("./json/portfolios.json") as f:
        data = json.load(f)
   
    for i in range(0, len(data["PortFolios"]) ):
        if( data["PortFolios"][i]["userID"] == user ):
            for k in range(0, len(data["PortFolios"][i]["pfData"]) ):
                print( data["PortFolios"][i]["pfData"][k] )
                time.sleep(100)

if __name__ == "__main__":
    addPfPrices( "Lika44" )
    
