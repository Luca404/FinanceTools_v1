//CONST
var pfData = [];
var userName = "";
var pfDeleteNum = 0;
var pfNum;
var selectedTickers = [];
var tickersList = [];
var punto = false;


//Connection to server
const server = io();
server.on("connect", () => {
    console.log("Connected");
	showLoginModal();
});
 
server.on("disconnect", () => {
    console.log("Disconnected");
});

server.on("loginResult", (data) => {
	if( data["status"] ){
		successLogin( data["text"] );
		drawProfileDiv( data["text"] );
	}
	else
		failedLogin( data["text"] );
});

function fixContent(){
    var sideBar = document.getElementById("sidebar");
    var content = document.getElementById("content");
    if( sideBar.classList[0] == "active" )
        content.style.marginLeft = "300px";
    else
        content.style.marginLeft = "20px";
}

//Show user option for disconnect
function showUserOption(){

}

//Get pf list from server
function getPfList( usrn ){
	server.emit("getPfList",{"username":usrn}, (data) => {
		pfData = [];
		if( data["data"].length > 0 ){
			pfData = data["data"];
			loadTable1(pfData);
		}
		else{
			console.log("No saved Portfolio for logged user!");
		}
	});
}

//Get Tickers list from server
function getTickersList(){
	server.emit( "getTickersList", (result) => {
		tickersList = result["data"];
	});
}


//Draw profile div
function drawProfileDiv( username ){
	let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + username;
	getPfList( username );
	getTickersList();
}

//Show modal for login
function showLoginModal(){
	let usern = checkIfLogged()
	userName = usern;
	if( usern == "" ){
		$("#content").css("filter", "blur(5px)");
		$('#loginModal').modal({backdrop: 'static', keyboard: false, show: true});
		$("#registrationModal").modal("hide");
		$('#registrationModal').data('bs.modal',null);
	}
	else{
		drawProfileDiv(usern);
	}
}

//Show dropdown menu with the tickers list from the server
function showTickersInInput(){
	let selectedType = $("#tickerTypeInput").val();
	if( selectedType == "stocks" ){
		let selectedExchange = $("#tickerExchangeInput").val();
		var tickersType = selectedExchange;
		$("#tickerExchangeInput").selectpicker("show");
	}
	else{
		$("#tickerExchangeInput").selectpicker("hide");
		var tickersType = selectedType;
	}

    $("#addPfTickersInput").find('option').remove();
    $("#addPfTickersInput").find('li').remove();
    $("#addPfTickersInput").selectpicker('refresh');

	var tickersDataList = tickersList[tickersType];
	for( var i = 0; i < tickersDataList.length; i++ )
		$("#addPfTickersInput").append( `<option onclick="selectTicker();" value="${tickersDataList[i].s}" data-subtext="${tickersDataList[i].n}" name="${selectedType + ':' + tickersType}">${tickersDataList[i].s}</option>` );
	

	$("#addPfTickersInput").on("changed.bs.select", selectTicker)
	$("#addPfTickersInput").selectpicker( "refresh" );

}

function selectTicker(){	
	$('#addPfTickersInput option:selected').remove();
	$('#addPfTickersInput').selectpicker('refresh');
}

//Function triggered on change of choicesJS tickers select
function changeInputNumShares(event){
	var ticker = $('#addPfTickersInput').val();
	var type = $('#addPfTickersInput option:selected').attr("name");
	var name = $('#addPfTickersInput option:selected').attr("data-subtext");
	addNumShares( ticker, type, name );
	selectedTickers.push( ticker );
}

function removeTicker(elem){
	removeNumShares( elem.id );
}

//Remove a number shares input 
function removeNumShares( name ){
	var numSharesDiv = document.getElementById("pfSharesNumDiv");
	var numSharesDivs = numSharesDiv.getElementsByTagName("div");
	for( var i=0;i<numSharesDivs.length;i++ ){
		let numSharesText = numSharesDivs[i].getElementsByTagName("input")[0].label;
		if( numSharesText == name ){
			numSharesDiv.removeChild( numSharesDivs[i] );
			let index = selectedTickers.indexOf( numSharesText );
			selectedTickers.splice( index, 1 );
		}
	}
}

//Add a number shares input 
function addNumShares( ticker, type, name ){
	var numSharesDiv = document.getElementById("pfSharesNumDiv");

	var newDiv = document.createElement("div");
	newDiv.style.display = "flex";
	newDiv.style.marginTop = "2%";
	newDiv.style.marginBottom = "5%";

	var newH = document.createElement("h6");
	newH.style.fontSize = "13px";
	newH.innerText = name + "  (" + ticker + ")";
	newDiv.appendChild( newH );
	
	var newInput = document.createElement("input");
	newInput.className = "addSharesNumInput inputCheck";
	$(newInput).on("keypress", ( filterLetters ));
	newInput.label = ticker;
	newInput.id = ticker + "NumShares";
	newInput.name = type;
	newInput.autocomplete = "one-time-code";
	newInput.type = "text";
	newDiv.appendChild( newInput );

	var newButt = document.createElement("button");
	newButt.onclick = function() { removeTicker(this); };
	newButt.className = "btn btn-primary";
	newButt.id = ticker;
	newButt.style.marginTop = "-6.5px";
	newButt.style.marginLeft = "7px";
	newButt.style.fontSize = "15px";
	newButt.innerText = "X";
	newDiv.appendChild( newButt );

	numSharesDiv.appendChild( newDiv );
}

//Load table with portfolios
function loadTable1(data){
	var portFolios = data;
	var tbody = document.getElementById("tbody1");
	$("#tbody1 tr").remove( ".itemTabella" );
	for(var i = 0; i < portFolios.length; i++) {
		var tr = document.createElement("tr");
		tr.className = "itemTabella";

		var td1 = document.createElement("td");
		td1.className = "itemTd";
		td1.appendChild(document.createTextNode(portFolios[i].pfName));
		tr.appendChild(td1);

		var td2 = document.createElement("td");
		td2.className = "itemTd";
		td2.appendChild(document.createTextNode(portFolios[i].tickers));
		tr.appendChild(td2);

		var td3 = document.createElement("td");
		td3.className = "itemTd";
		td3.appendChild(document.createTextNode(portFolios[i].numShares));
		tr.appendChild(td3);

		var pfValue = 0;
		for( var k = 0; k < portFolios[i].prices.length; k++ )
			pfValue = pfValue + ( portFolios[i].prices[k] * portFolios[i].numShares[k] );
		
		var td4 = document.createElement("td");
		td4.className = "itemTd";
		td4.appendChild(document.createTextNode( parseInt(pfValue).toString() + "$" ));
		tr.appendChild(td4);

		var td5 = document.createElement("td");
		td5.className = "modifyTd"
		
		//Add modify button
		var modifyButton = document.createElement("button");
		modifyButton.id = "modifyButt" + i;
        modifyButton.className = "btn btn-dark modifyPf";
        modifyButton.type = "button";
		modifyButton.dataset.toggle = "modal";
		modifyButton.dataset.target = "#addModal";
		modifyButton.onclick = function() { modifyPf(this); };
		var modifyImg = document.createElement("img");
		modifyImg.id = "modifyImg";
		modifyImg.src = "static/img/modify-icon.jpg";
		modifyButton.append(modifyImg);

		//Add delete button
		var deleteButton = document.createElement("button");
		//button.appendChild(document.createTextNode("Modify"));
		deleteButton.id = "deleteButt" + i;
        deleteButton.className = "btn btn-dark deletePf";
        deleteButton.type = "button";
		deleteButton.dataset.toggle = "modal";
		deleteButton.dataset.target = "#deleteModal";
		deleteButton.onclick = function() { deletePf(this); };
		var deleteImg = document.createElement("img");
		deleteImg.id = "deleteImg";
		deleteImg.src = "static/img/delete-icon-1.png";
		deleteButton.append(deleteImg);

        td5.appendChild(modifyButton);
		td5.appendChild(deleteButton);

		tr.appendChild(td5);

		tbody.insertBefore( tr, tbody.lastElementChild);
	}
}

//Function for modify a portfolio
function modifyPf(item){
	$("#addModalLabel").text("Modify Portfolio");
	$("#pfSharesNumDiv").empty();

	pfNum = item.id.toString();
	pfNum = pfNum.split("modifyButt")[1];

	$("#addPfNameInput").val(pfData[pfNum].pfName);

	selectedTickers = [];
	for( let i = 0; i<pfData[pfNum].tickers.length; i++ ){
		let selectedType = $("#tickerTypeInput").val();		
		let selectedExchange = $("#tickerExchangeInput").val();
		let type = pfData[pfNum].type[i].split(":")[0];
		let exch = pfData[pfNum].type[i].split(":")[1];
		if( type == selectedType ){
			if( selectedExchange != exch )
				$("#tickerExchangeInput").val( exch );				
		}
		else
			$("#tickerTypeInput").val( type );
		
		//showTickersInInput();
		if( type == "stocks" )
			var tickerType = exch;
		else
			var tickerType = type;

		selectedTickers.push( pfData[pfNum].tickers[i] );
		console.log( tickersList );
		addNumShares( pfData[pfNum].tickers[i], pfData[pfNum].type[i] );
		let numSharesInput = document.getElementById( pfData[pfNum].tickers[i] + "NumShares" );
		$( numSharesInput ).val( pfData[pfNum].numShares[i] );
	}
	$("#addPfTickersInput").selectpicker( "refresh" );
	$("#addPfTickersInput").selectpicker( "val", pfData[pfNum].tickers );
	$("#addPfTickersInput").selectpicker( "refresh" );
}

//Function for show modal to delete a portfolio
function deletePf(item){
	var pfNum = item.id.toString();
	pfDeleteNum = pfNum.split("deleteButt")[1];
	var h5 = document.getElementById("deletePfText");
	var text = "Are you sure you want to delete '" + pfData[pfDeleteNum].pfName + "' ?";
	h5.innerText = text;
}
 
//Function for delete a portfolio
function deletePfButt(){
	server.emit( "deletePf", {"data": pfData[pfDeleteNum], "user":userName }, (result) => {
		if( result != 0 ){
			let delModal = document.getElementById("deleteModal");
			let content = delModal.getElementsByClassName("modal-content")[0];
			content.style = "filter: blur(10px)";
			var divSuccess = document.createElement("div");
			divSuccess.appendChild(document.createTextNode("Portfolio deleted successfully"));
			divSuccess.id = "successDeleteDiv";
			delModal.appendChild(divSuccess);
			content.style.pointerEvents = "none";
			delModal.style.userSelect = "none";
			delModal.style.flexWrap = "wrap";
			setTimeout(() => {
				$("#deleteModal").modal("hide");
				$("#successDeleteDiv").remove();
				content.style = "filter: blur(0px)";
			}, 1500);
			pfData = result["data"];
			loadTable1(pfData);
		}
		else{
			alert("Error with the server");
		}
	});
}
 
function addPf(){
	showTickersInInput();
	$("#addModalLabel").text("Add Portfolio");	
	$("#addPfNameInput").val("");
	$("#pfSharesNumDiv").empty();
	selectedTickers = [];
}

//Function to add a portFolio
function saveChangesButton(){
	let check = true;
	var pfName = document.getElementById("addPfNameInput");
	var pfTickers = selectedTickers;
	var pfTypes = [];
	var pfShares = [];

	//Check PF Name
	let pfNameValue = pfName.value.replace(/\s+/g, '');
	if( pfNameValue == "" ){
		pfName.style.animation = "0.25s linear 0s 1 normal forwards running error";
		pfName.value = "";
		pfName.placeholder = "Insert Portfolio Name";
		setTimeout(() => {
			pfName.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfName.placeholder = "";
		}, 1500);
		check = false;
	}

	//Check Pf tickers
	//Check numbers of shares
	let pfSharesDiv = document.getElementById( "pfSharesNumDiv" );
	let pfSharesInputs = pfSharesDiv.getElementsByTagName( "input" );
	console.log( pfSharesInputs.length );
	if( pfSharesInputs.length == 0 ){
		console.log( "Error" );
		var title = document.getElementsByClassName( "filter-option-inner-inner" )[2];
		title.innerText = 'Insert Ticker';
		title.style.color = "red";
		setTimeout(() => {	
			title.innerText = "Select Ticker";
			title.style.color = "grey";
		}, 1500);
		check = false;
	}
	else{
		for(let i = 0 ; i < pfSharesInputs.length; i++){
			pfShares.push( parseInt( pfSharesInputs[i].value ) );
			pfTypes.push( pfSharesInputs[i].name )
			if( pfSharesInputs[i].value == "" ){
				pfSharesInputs[i].style.animation = "0.25s linear 0s 1 normal forwards running error";
				pfSharesInputs[i].value = "";
				pfSharesInputs[i].color = "red";
				pfSharesInputs[i].placeholder = "Error";
				setTimeout(() => {
					pfSharesInputs[i].style.animation = "";
				}, 250);
				setTimeout(() => {
					pfSharesInputs[i].placeholder = "";
				}, 1500);
				check = false;
			}
		}
	}
	if( check ){
		var modalName = document.getElementById( "addModalLabel" ).innerText.split(" ")[0];
		if( modalName == "Add" ){
			server.emit( "savePf", { "data": { pfName: pfNameValue, tickers: pfTickers, type: pfTypes, numShares: pfShares }, "user": userName }, (result) => {
				if( result != 0 ){
					let addModal = document.getElementById("addModal");
					let content = addModal.getElementsByClassName("modal-content")[0];
					content.style = "filter: blur(10px)";
					var divSuccess = document.createElement("div");
					divSuccess.appendChild(document.createTextNode("Portfolio added successfully"));
					divSuccess.id = "successSavedDiv";
					addModal.appendChild(divSuccess);
					content.style.pointerEvents = "none";
					addModal.style.userSelect = "none";
					setTimeout(() => {
						$("#addModal").modal("hide");
						$("#successSavedDiv").remove();
						content.style = "filter: blur(0px)";
					}, 1500);
					pfData = result["data"];
					loadTable1( pfData );
				}
				else{
					alert("Error with server");
				}
			});
		}
		else if( modalName == "Modify" ){
			var data = { pfName: pfNameValue, tickers: pfTickers, type: pfTypes, numShares: pfShares };
			if( JSON.stringify(pfData[pfNum]) === JSON.stringify(data) ){
				let addModal = document.getElementById("addModal");
				let content = addModal.getElementsByClassName("modal-content")[0];
				content.style = "filter: blur(10px)";
				var divError = document.createElement("div");
				divError.appendChild(document.createTextNode("No Changes"));
				divError.id = "errorSavedDiv";
				addModal.appendChild(divError);
				content.style.pointerEvents = "none";
				addModal.style.userSelect = "none";
				setTimeout(() => {
					$("#errorSavedDiv").remove();
					content.style = "filter: blur(0px)";
				}, 2000);
			}
			else{
				server.emit( "modifyPf", { "data": data, "pfNum": pfNum, "user": userName }, (result) => {
					console.log( result );
					if( result != 0 ){
						let addModal = document.getElementById("addModal");
						let content = addModal.getElementsByClassName("modal-content")[0];
						content.style = "filter: blur(10px)";
						var divSuccess = document.createElement("div");
						divSuccess.appendChild(document.createTextNode("Portfolio modified successfully"));
						divSuccess.id = "successSavedDiv";
						addModal.appendChild(divSuccess);
						content.style.pointerEvents = "none";
						addModal.style.userSelect = "none";
						setTimeout(() => {
							$("#addModal").modal("hide");
							$("#successSavedDiv").remove();
							content.style = "filter: blur(0px)";
						}, 1500);
						pfData = result["data"];
						loadTable1( pfData );
					}
					else{
						alert("Error with server");
					}
				});
			}
		}
	}
}

function filterLetters(evt){
	var hold = String.fromCharCode(evt.which);  
	if( (/[a-z A-Z*!@#$%^&*()_/[\]}=+><{?",:;'"|]/.test(hold)))
		evt.preventDefault();	  
	if( hold == "." && evt.target.value.indexOf(".") != -1 )
		evt.preventDefault();
	if( (hold == "." || hold == "0") && evt.target.value=="" )
		evt.preventDefault();
	var afterPunto = evt.target.value.split(".")
	if( afterPunto[1] )
		if( afterPunto[1].length > 1 )
			evt.preventDefault();
}


//Login Functions Section

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

//Show modal for registration
function showRegisterModal(){
	$('#registrationModal').modal({backdrop: 'static', keyboard: false, show: true});
	$("#loginModal").modal("hide");	
	$('#loginModal').data('bs.modal',null);
}

//Call server and check if login is ok
function checkLogin(){
	var usrn = document.getElementById("usernInput");
	var passwd = document.getElementById("passwdInput");
	if(usrn.value == ""){
		usrn.style.animation = "0.25s linear 0s 1 normal forwards running error";
		usrn.placeholder = "Insert username";
		setTimeout(() => {
			usrn.style.animation = "";
		}, 250);
		setTimeout(() => {
			usrn.placeholder = "";
		}, 1500);
	}
	if(passwd.value == ""){
		passwd.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwd.placeholder = "Insert password";
		setTimeout(() => {
			passwd.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwd.placeholder = "";
		}, 1500);
	}
	
	if( usrn.value != "" && passwd.value != "" ){		
		var hashPass = hash(passwd.value);
		server.emit("login",{"username":usrn.value, "password":hashPass});
	}
}

//If login is successful
function successLogin( usern ){
	var loginModal = document.getElementById("loginModal");
	var content = loginModal.getElementsByClassName("modal-content")[0];
	content.style = "filter: blur(10px)";
	var divSuccess = document.createElement("div");
	divSuccess.appendChild(document.createTextNode("Successfully logged in!"));
	divSuccess.id = "successLoginDiv";
	loginModal.appendChild(divSuccess);
	content.style.pointerEvents = "none";
	loginModal.style.userSelect = "none";
	setTimeout(() => {
		$("#loginModal").modal("hide");
		$("#content").css("filter", "");
	}, 1500);
	setCookie("username",usern,5);
}

//Save cookies function
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

//If login is unsuccessful
function failedLogin( error ){
	var usrn = document.getElementById("usernInput");
	var passwd = document.getElementById("passwdInput");
	if( error == "Wrong Password" ){
		passwd.value = "";
		passwd.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwd.placeholder = "Wrong password";
		setTimeout(() => {
			passwd.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwd.placeholder = "";
		}, 2000);
	}
	else{
		usrn.value = "";
		passwd.value = "";
		usrn.style.animation = "0.25s linear 0s 1 normal forwards running error";
		usrn.placeholder = "Account doesnt exist";
		setTimeout(() => {
			usrn.style.animation = "";
		}, 250);
		setTimeout(() => {
			usrn.placeholder = "";
		}, 2000);
	}
}

//function for register a user
function registerUser(){
	var usrn = document.getElementById("usernInputReg");
	var passwd = document.getElementById("passwdInputReg");
	var passwdConf = document.getElementById("passwdInputConf");
	if(usrn.value == ""){
		usrn.style.animation = "0.25s linear 0s 1 normal forwards running error";
		usrn.placeholder = "Insert username";
		setTimeout(() => {
			usrn.style.animation = "";
		}, 250);
		setTimeout(() => {
			usrn.placeholder = "";
		}, 1500);
	}
	if(passwd.value == ""){
		passwd.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwd.placeholder = "Insert password";
		setTimeout(() => {
			passwd.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwd.placeholder = "";
		}, 1500);
	}
	if(passwdConf.value == ""){
		passwdConf.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwdConf.placeholder = "Confirm password";
		setTimeout(() => {
			passwdConf.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwdConf.placeholder = "";
		}, 1500);
	}
	if(passwd.value != passwdConf.value){
		passwdConf.style.animation = "0.25s linear 0s 1 normal forwards running error";
		passwdConf.value = "";
		passwdConf.placeholder = "Passwords dont match";
		setTimeout(() => {
			passwdConf.style.animation = ""
		}, 250);
		setTimeout(() => {
			passwdConf.placeholder = "";
		}, 1500);
	}

	if( usrn.value != "" && passwd.value != "" && passwd.value == passwdConf.value ){		
		var hashPass = hash(passwd.value);
		server.emit("registerUser",{"username":usrn.value, "password":hashPass});
	}
}

function hash(e){for(var r=0,i=0;i<e.length;i++)r=(r<<5)-r+e.charCodeAt(i),r&=r;return r};