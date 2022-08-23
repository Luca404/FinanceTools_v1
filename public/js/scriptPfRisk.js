//CONST
var pfData;
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

function loadSelectedPf(){
    loadRiskData();
}

function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadRiskData();
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
    loadRiskData(); 
}

function loadRiskData(){
    var opt = document.getElementById("savedPfMenu");
    var pfInfo = opt.options[opt.selectedIndex].text;
    var pfName = pfInfo.split(": ")[0];
    var pfTickers = pfInfo.split(": ")[1];
    for(var i = 0; i < portFolios.length; i++) {
        if(portFolios[i].pfName == pfName)
            var weights = portFolios[i].numShares;
    }

    server.emit("getRiskData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights}, (res) =>{
        drawRiskTable( res )
    });
}

function drawRiskTable( data ){
    var pfCorrTable = document.getElementById( "pfRiskTable" );
    var tableBody = pfCorrTable.getElementsByTagName( "tbody" )[0];
    $(tableBody).empty();

    var tr = document.createElement( "tr" );

    var td1 = document.createElement( "td" ); 
    td1.appendChild( document.createTextNode( data["pfVolatility"]+"%" ));
    tr.appendChild( td1 );

    var td2 = document.createElement( "td" ); 
    td2.appendChild( document.createTextNode( data["diversRisk"]+"%" ));
    tr.appendChild( td2 );

    var td3 = document.createElement( "td" ); 
    td3.appendChild( document.createTextNode( data["nonDiversRisk"]+"%" ));
    tr.appendChild( td3 );

    tableBody.appendChild( tr );
}