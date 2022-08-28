import os
import json
import yfinance as yf
import time


def getPrice( tickers ):
    prices = []
    data = yf.download( tickers=tickers, period="1d" )
    for ticker in data["Adj Close"]:
        prices.append( { ticker: round(data["Adj Close"][ticker][-1], 2) } )
    print( prices )
    return prices



if __name__ == "__main__":
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
