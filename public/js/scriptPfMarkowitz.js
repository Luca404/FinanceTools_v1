//CONST
var pfData;
var selectedPf;
var PERIOD = 2;
var ITERATION = 1000;
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
	let usern = getCookie( "username" );
    userName = usern;
    let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + usern;
	server.emit("getPfList",{"username":usern}, (data) =>{ 
        pfData = [];
        if( data["data"].length > 0 ){
            pfData = data["data"];
            loadSavedPf(portFolios);
        }
        else
            console.log("No saved Portfolio for logged user!");
    });
}

//Save cookies function
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie( cname ){
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookie = decodedCookie.split(';');
	let cookieName = cname + "=";
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

function saveSelectedPf(){
    var opt = document.getElementById("savedPfMenu");
    var pfInfo = opt.options[opt.selectedIndex].text;
    var pfName = pfInfo.split(": ")[0];
    var pfTickers = pfInfo.split(": ")[1];
    var k = 0;
    for(var i = 0; i < portFolios.length; i++) {
        if(portFolios[i].pfName == pfName && portFolios[i].tickers == pfTickers )
            k = i;
    }
    setCookie( "selectedPf", k, 5 );
    selectedPf = k;
}

function loadSelectedPf(){
    saveSelectedPf();
    loadMarkowitzData();
}

function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadMarkowitzData();
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
    if( getCookie( "selectedPf" ) != "" )
        $("#savedPfMenu").selectpicker( "val", getCookie( "selectedPf" ) );
    else{
        $("#savedPfMenu").selectpicker( "val", "0" );
        setCookie( "selectedPf", k, 0 );
    }
    $("#savedPfMenu").selectpicker("refresh");
    loadMarkowitzData(); 
}

function loadMarkowitzData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;
    
    server.emit("getMarkowitzData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights, iter: ITERATION}, (res) =>{
        var pfRetAndVol = JSON.parse( res["data"] );
        var pfWeights = JSON.parse( res["weights"] );
        drawMarkowitzTable( pfRetAndVol, pfWeights );
    })
}

function drawMarkowitzTable( data, weights ){
    var pfReturn = Object.values( data["return"] );
    var pfVol = Object.values( data["volatility"] );
    var pfWeights = Object.values( weights );

    console.log( weights );
    //Canvas creation
    var canvasDiv = document.getElementById("markowitzCanvasDiv");
    if( canvasDiv.children.length > 0 ){
        canvasDiv.removeChild( document.getElementById("singlePerfCanvas") );
    }
    var canvasMarkowitz = document.createElement("canvas");
    canvasMarkowitz.id = "singlePerfCanvas";
    canvasMarkowitz.width = 700;
    canvasMarkowitz.height = 450;
    canvasMarkowitz.setAttribute("style", "display: inline-block");
    canvasDiv.appendChild(canvasMarkowitz);

    var dataList = []
    for( var i = 0; i<pfReturn.length; i++ )
        dataList[i] = {
            x: parseFloat( pfVol[i] ), 
            y: parseFloat( pfReturn[i] )
        };

    console.log( dataList );

    //Markowitz chart Draw
    new Chart(document.getElementById("singlePerfCanvas"), {
        type: 'scatter',
        data: {
            datasets:[{
                label: "Markowitz Efficient Frontier",
                data: dataList,
                fill: false,
                pointBackgroundColor: 'black',       
                showLine: false
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Volatility'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                      display: true,
                      labelString: 'Return'
                    }
                  }]
            }
        }          
    });
}
