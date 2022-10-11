//CONST
var pfData;
var selectedPf;
var PERIOD = 2;
var ITERATION = 50;
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
    loadMontecarloData();
}

function setPeriod(){
    var opt = document.getElementById("setPeriod");
    var pfPeriod = opt.options[opt.selectedIndex].text;
    PERIOD = pfPeriod.split("Y")[0];
    loadMontecarloData();
}

function changeIterations(){
    var iter = $("#iterationsInput").val();
    if( iter != ITERATION ){
        $("#iterationButton").css( "opacity", 1 );
        $("#iterationButton").prop( "disabled", false );
    }
    else{
        $("#iterationButton").css( "opacity", 0.2 );
        $("#iterationButton").prop( "disabled", true );
    }
}


function setIterations(){
    var iter = $("#iterationsInput").val();
    ITERATION = parseInt(iter);
    loadMontecarloData();
    changeIterations();
}

function resizeInput() {
    this.style.width = this.value.length - 5 + "ch";
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
        setCookie( "selectedPf", 0 );
    }
    $("#savedPfMenu").selectpicker("refresh");
    $("#iterationsInput").on("keypress", ( filterLetters ));
    $("#iterationsInput").val( ITERATION );
    loadMontecarloData();
}

function loadMontecarloData(){
    selectedPf = getCookie( "selectedPf" );
    if( selectedPf == "" )
        selectedPf = 0;
    var pfName = portFolios[selectedPf].pfName;
    var pfTickers = portFolios[selectedPf].tickers;
    var weights = portFolios[selectedPf].numShares;    

    //Remove canvas
    var canvasDiv = document.getElementById("montecarloCanvasDiv");
    if( canvasDiv.children.length > 0 )
        canvasDiv.removeChild( document.getElementById("montecarloCanvas") );
    
    $("#montecarloCanvasCont").addClass( "ph-item" );
    $("#montecarloCanvasDiv").addClass( "ph-picture" );

    server.emit("getMontecarloData", {name: pfName, tickers: pfTickers, period: PERIOD, weights: weights, iter: ITERATION}, (res) =>{
        drawMontecarloChart( res["data"], res["lastDate"] );
    })
}

function drawMontecarloChart( data, lastDate ){
    $("#montecarloCanvasCont").removeAttr( "class" );
    $("#montecarloCanvasDiv").removeAttr( "class" );

    //Canvas creation
    var canvasDiv = document.getElementById("montecarloCanvasDiv");
    var canvasMontecarlo = document.createElement("canvas");
    canvasMontecarlo.id = "montecarloCanvas";
    canvasDiv.appendChild(canvasMontecarlo);

    var dataset = [];
    var dateList = [];
    var k = 0;
    date = new Date(lastDate);
    for(var i = 0; i < data[k].length; i++){
        dataset.push( {} );
        for( var a = 0; a < data.length; a++ ){
            if( k == 0 ){
                dateList[a] = date.toLocaleDateString();;
                date.setDate(date.getDate() + 1);
                while( date.getDay() > 5 ){
                    date.setDate(date.getDate() + 1);
                }
            }
            dataset[k][a] = data[a][i];
        }
        k += 1;
    }
    const randomNum = () => Math.floor(Math.random() * (235 - 52 + 1) + 52);
    const randomRGB = () => `rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;
    var dset = [];
    for( var i = 0; i < dataset.length; i++ ){
        dset[i] = {
            data: Object.values(dataset[i]),
            borderColor: randomRGB(),
            fill: false
        }
    }
    
    //Montecarlo chart Draw
    new Chart(document.getElementById("montecarloCanvas"), {
        type: 'line',
        data: {
            labels: dateList,
            datasets: dset
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                   label: function(tooltipItem) {
                          return tooltipItem.yLabel;
                   }
                }
            },
            elements: {
                point:{
                    radius: 0
                }
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                      display: true,
                      labelString: 'Price'
                    }
                  }]
            }
        }          
    });
}

function filterLetters(evt){
	var hold = String.fromCharCode(evt.which);  
	if( !(/[0-9]/.test(hold)) )
		evt.preventDefault();
}