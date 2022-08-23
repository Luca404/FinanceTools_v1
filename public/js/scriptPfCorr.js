//CONST
var PERIOD = 2;
var portFolios;

//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
    showLoginDiv();
});
 
server.on("disconnect", () => {
    console.log("Disconnected");
});

//Show login div
function showLoginDiv(){
	let usern = checkIfLogged();
    userName = usern;
    let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + usern;
	server.emit("getPfList",{"username":usern}, (data) =>{ 
        pfData = [];
        if( data.length > 0 ){
            pfData = data;
            loadSavedPf();
        }
        else
            console.log("No saved Portfolio for logged user!");
    });
}

//Function to check if still logged
function checkIfLogged(){
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookie = decodedCookie.split(';');
	let cookieName = "username=";
	for(let i = 0; i <cookie.length; i++) {
		let c = cookie[i];
		while (c.charAt(0) == ' ') {
		  c = c.substring(1);
		}
		if (c.indexOf(cookieName) == 0) {
		  return c.substring(cookieName.length, c.length);
		}
	}
	return "";
}

//Fix SideBar
function fixContent(){
    var sideBar = document.getElementById("sidebar");
    var content = document.getElementById("content");
    if( sideBar.classList[0] == "active" )
        content.style.marginLeft = "300px";
    else
        content.style.marginLeft = "20px";
}

function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadCorrelationData();
}

function loadSavedPf(){
    portFolios = pfData;
    var savedPfMenu = document.getElementById('savedPfMenu'); 
    for(var i = 0; i < portFolios.length; i++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.appendChild(document.createTextNode(portFolios[i].pfName + ":  "));
        opt.appendChild(document.createTextNode(" " + portFolios[i].tickers));
        savedPfMenu.appendChild(opt);
    }
    $("#savedPfMenu").selectpicker("refresh");
    $("#savedPfMenu").selectpicker( "val", "0" );
    $("#savedPfMenu").selectpicker("refresh");
    loadCorrelationData(); 
}

function loadCorrelationData(){
    var opt = document.getElementById("savedPfMenu");
    var pfInfo = opt.options[opt.selectedIndex].text;
    var pfName = pfInfo.split(": ")[0];
    var pfTickers = pfInfo.split(": ")[1];
    for(var i = 0; i < portFolios.length; i++) {
        if(portFolios[i].pfName == pfName)
            var weights = portFolios[i].numShares;
    }

    server.emit("getCorrData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights}, (res) =>{
        var corrData = JSON.parse( res["assetsCorr"] );
        var indexes = Object.keys(corrData);
        var corr = [];
        for(var i = 0; i<indexes.length; i++){
            if( i+1 == indexes.length )
                corr.push( corrData[indexes[i]][indexes[0]] );
            else
                corr.push( corrData[indexes[i]][indexes[i+1]] );
        }
        drawCorrTable( corr, indexes );
        var pfCorrData = JSON.parse( res["pfCorr"] );
        drawPfCorrTable( corr, pfCorrData );
    });
}

function drawCorrTable( corr, indexes ){        
    var corrTable = document.getElementById( "corrTable" );
    var tableBody = corrTable.getElementsByTagName( "tbody" )[0];
    $(tableBody).empty();
    for(var i=0;i<indexes.length;i++){
        var tr = document.createElement( "tr" );

        var td1 = document.createElement( "td" );
        td1.appendChild( document.createTextNode( indexes[i] ));
        
        var td2 = document.createElement( "td" );
        if( i+1 != indexes.length )
            td2.appendChild( document.createTextNode( indexes[i+1] ) );
        else
            td2.appendChild( document.createTextNode( indexes[0] ) );
        
        var td3 = document.createElement( "td" );
        td3.appendChild( document.createTextNode( corr[i] ) );
        
        setCorrTdColor( [td3] );
        
        tr.appendChild( td1 );
        tr.appendChild( td2 );
        tr.appendChild( td3 );
        tableBody.appendChild( tr );
    }

}

function drawPfCorrTable( corrData, pfCorrData ){
    console.log( pfCorrData );
    var pfCorrTable = document.getElementById( "pfCorrTable" );
    var tableBody = pfCorrTable.getElementsByTagName( "tbody" )[0];
    $(tableBody).empty();
    var tr = document.createElement( "tr" );

    var td1 = document.createElement( "td" );
    var pfCorr = (( corrData.reduce((a, b) => a + b, 0) ) / corrData.length ) || 0;    
    td1.appendChild( document.createTextNode( pfCorr.toFixed(2) ));
    tr.appendChild( td1 );

    var td2 = document.createElement( "td" ); 
    td2.appendChild( document.createTextNode( pfCorrData["gold"] ));
    tr.appendChild( td2 );

    var td3 = document.createElement( "td" ); 
    td3.appendChild( document.createTextNode( pfCorrData["inflation"] ));
    tr.appendChild( td3 );

    var td4 = document.createElement( "td" ); 
    td4.appendChild( document.createTextNode( pfCorrData["US"] ));
    tr.appendChild( td4 );

    var td5 = document.createElement( "td" ); 
    td5.appendChild( document.createTextNode( pfCorrData["EU"] ));
    tr.appendChild( td5 );

    var td6 = document.createElement( "td" ); 
    td6.appendChild( document.createTextNode( pfCorrData["Asia"] ));
    tr.appendChild( td6 );

    var tds = tr.getElementsByTagName("td");
    setCorrTdColor( tds );

    tableBody.appendChild( tr );
}

function setCorrTdColor( tds ){
    for( var i=0; i<tds.length; i++ ){
        var td = tds[i];
        td.style.backgroundColor = "#33673b";
        if( td.innerText > -0.5 )
            td.style.backgroundColor = "#5FAD56";
        if( td.innerText > 0 )
            td.style.backgroundColor = "#E74C3C";
        if( td.innerText > 0.5 )
            td.style.backgroundColor = "#C0392B";
        
    }
}