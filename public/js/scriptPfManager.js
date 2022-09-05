//GLOBAL VAR
var pfData = [];
var userName = "";
var pfDeleteNum = 0;
var pfNum;
var selectedTickers = {};
var selectedType = "nyse";
var tickersList = [];
var tickersDict = {};
var tempTickersDict = {};


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
		let tickersType = Object.keys( tickersList );
		for( var i = 0; i < tickersType.length; i++ )
			tickersDict[tickersType[i]] = Object.assign({}, ...tickersList[tickersType[i]].map((x) => ({[x.s]: [x.n,x.p]})));
		tempTickersDict = $.extend(true, {}, tickersDict);
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
	selectedType = $("#tickerTypeInput").val();
	if( selectedType == "stocks" ){
		let selectedExchange = $("#tickerExchangeInput").val();
		var tickersType = selectedExchange;
		$("#tickerExchangeInput").selectpicker("show");
	}
	else{
		$("#tickerExchangeInput").selectpicker("hide");
		var tickersType = selectedType;
	}
	selectedType = tickersType;

	$("#addPfTickersInput").find("option").remove();
	$("#addPfTickersInput").find("li").remove();
	$("#addPfTickersInput").selectpicker("refresh");

	var tickersDataList = tempTickersDict[tickersType];
	var keys = Object.keys( tickersDataList );
	keys.sort((a, b) => a.localeCompare(b))
	for( var i = 0; i < keys.length; i++ )
		$("#addPfTickersInput").append( `<option onclick="selectTicker();" value="${keys[i]}" data-price="${tickersDataList[keys[i]][1]}" data-subtext="${tickersDataList[keys[i]][0]}" name="${selectedType + ':' + tickersType}">${keys[i]}</option>` );
	
	$("#addPfTickersInput").on("changed.bs.select", selectTicker);
	$("#addPfTickersInput").parent()[0].getElementsByTagName("input")[0].autocomplete = "one-time-code";
	$("#addPfTickersInput").selectpicker( "refresh" );

}

function selectTicker(){	
	$('#addPfTickersInput option:selected').remove();
	$('#addPfTickersInput').selectpicker('refresh');
}

//Function triggered on change of choicesJS tickers select
function changeInputNumShares(event){
	var ticker = $('#addPfTickersInput').val();
	var types = $('#addPfTickersInput option:selected').attr("name").split(":");
	var type = types[0];
	if( type == "stocks" )
		type = 	types[1];
	selectedType = type;
	var price = $('#addPfTickersInput option:selected').attr("data-price");
	var name = $('#addPfTickersInput option:selected').attr("data-subtext");
	addNumShares( ticker, type, name, price );
}


//Remove a number shares input 
function removeNumShares( name ){
	var numSharesTable = document.getElementById("tbody2");
	var numSharesTrs = numSharesTable.getElementsByTagName("tr");
	for( var i=0;i<numSharesTrs.length;i++ ){
		let td = numSharesTrs[i].getElementsByClassName( "symbolTd" )[0];
		let symbol = td.innerText;
		if( symbol == name ){
			numSharesTable.removeChild( numSharesTrs[i] );
			tempTickersDict[selectedType][symbol] = selectedTickers[symbol].slice();
			delete selectedTickers[symbol];
		}
	}
	showTickersInInput();
	if( Object.keys(selectedTickers).length == 0 )
		$("#thead2").css( "opacity", 0.2 );

	calculatePfValue();
}

function getTextWidth(text, font) {
	// re-use canvas object for better performance
	const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
	const context = canvas.getContext("2d");
	context.font = font;
	const metrics = context.measureText(text);
	return metrics.width;
}

function setTitle( elem ) {
    var selectpicker = $(elem);
    selectpicker.selectpicker();
	selectpicker.selectpicker("refresh");
    selectpicker.data('selectpicker').$button.attr('title', 'Set Step');
    //selectpicker.hide().show(0);
	//$(window).trigger('resize');
    //selectpicker.selectpicker("refresh");
}

//Add a number shares input 
function addNumShares( ticker, type, name, price ){
	var tbody = document.getElementById("tbody2");
	var tr = document.createElement("tr");

	var td1 = document.createElement("td");
	td1.className = "itemTd";
	var nameP = document.createElement("p");
	const nameSize = getTextWidth(name, getCanvasFont(nameP));
	nameP.style.marginTop = "14px";
	nameP.style.width = nameSize + "px";
	nameP.innerText = name;
	nameP.style.marginLeft = "0px";
	nameP.style.paddingLeft = "0px";
	nameP.style.textAlign = "left";
	
	if( nameSize > 115 ){
		var cssAnimation = document.createElement('style');
		cssAnimation.type = 'text/css';
		var marginLeft = nameSize-110;
		if( marginLeft > 0 )
			marginLeft = -(marginLeft);
		var rules = document.createTextNode('@-webkit-keyframes scroll' + ticker.toString() + ' {'+
			'from { margin-left:0px; }'+
			'20% { margin-left:0px; }'+
			'50% { margin-left:'+ marginLeft.toString() + 'px; }'+
			'80% { margin-left:0px; }'+
			'to { margin-left:0px; }'+
		'}');
		cssAnimation.appendChild(rules);
		document.getElementsByTagName("head")[0].appendChild(cssAnimation);
		if( nameSize > 200 )
			nameP.style.animation = 'scroll' + ticker.toString() + ' 20s linear infinite';
		else
			nameP.style.animation = 'scroll' + ticker.toString() + ' 10s linear infinite';
	}

	var nameDiv = document.createElement( "div" );
	nameDiv.style.whiteSpace = "nowrap";
	nameDiv.className = "nameDiv";
	nameDiv.appendChild( nameP );
	td1.appendChild(nameDiv);
	tr.appendChild(td1);

	var td2 = document.createElement("td");
	td2.classList.add( "itemTd", "symbolTd" );
	td2.appendChild(document.createTextNode(ticker));
	tr.appendChild(td2);

	var td3 = document.createElement("td");
	td3.classList.add( "itemTd", "priceTd" );
	td3.appendChild(document.createTextNode(parseFloat(price).toFixed(2) + "$"));
	tr.appendChild(td3);

	var td4 = document.createElement("td");
	td4.classList.add( "itemTd", "sharesTd" );
	var sharesInput = document.createElement("input");
	sharesInput.type = "number";
	sharesInput.value = "1";
	sharesInput.step = "1";
	sharesInput.min = "1";
	sharesInput.max = "1000";
	sharesInput.style.outline = "none";
	sharesInput.style.caretColor = "transparent";
	sharesInput.style.userSelect = "none";
	sharesInput.autocomplete = "one-time-code";
	sharesInput.classList.add( "addSharesNumInput", "inputCheck" );
	sharesInput.id = ticker + "sharesInput";
	$(sharesInput).on("keydown", ( (evt) => { evt.preventDefault(); } ));
	$(sharesInput).on("input", ( calculatePfValue ));
	var stepSelect = document.createElement("select");
	stepSelect.className = "selectpicker";
	stepSelect.id = ticker + "stepSelect";
	var opt1 = document.createElement( "option" );
	opt1.value = "1";
	opt1.innerText = "1";
	stepSelect.appendChild( opt1 );
	var opt2 = document.createElement( "option" );
	opt2.value = "5";
	opt2.innerText = "5";
	stepSelect.appendChild( opt2 );
	var opt3 = document.createElement( "option" );
	opt3.value = "10";
	opt3.innerText = "10";
	stepSelect.appendChild( opt3 );
	$(stepSelect).on("change", (changeStepValue) );

	td4.appendChild(sharesInput);
	td4.appendChild(stepSelect);

	setTitle( stepSelect );
	tr.appendChild(td4);

	var td5 = document.createElement("td");
	td5.classList.add( "itemTd", "deleteTd" );
	var deleteButt = document.createElement("button");
	//deleteButt.className = "btn btn-primary";
	deleteButt.id = ticker;
	deleteButt.onclick = function() { removeNumShares(this.id); };
	var deleteImg = document.createElement("img");
	deleteImg.id = "deleteImg";
	deleteImg.src = "static/img/remove-icon.png";
	deleteImg.style.width = "30px";
	deleteImg.style.height = "30px";
	deleteButt.append(deleteImg);
	td5.appendChild( deleteButt );
	tr.appendChild( td5 );
	tbody.appendChild( tr );

	selectedTickers[ticker] = tempTickersDict[type][ticker];
	delete tempTickersDict[type][ticker];
	$("#thead2").css( "opacity", 1 );
	calculatePfValue();
}

//Change step of sharesInput
function changeStepValue(evt){
	var ticker = evt.target.id.split( "stepSelect" )[0];
	var inputs = $("#tbody2 tr td input");
	for( var i = 0; i < inputs.length; i++ ){
		let id = inputs[i].id.split( "sharesInput" )[0];
		console.log( id );
		if( id == ticker ){
			inputs[i].step = evt.target.value;
			console.log( $(evt.target).parent()[0].getElementsByTagName("button")[0].title );
			//$(evt.target).selectpicker("refresh");
			setTitle( evt.target );
			//$(evt.target).parent()[0].getElementsByTagName("button")[0].title = 'Set Step';
			//$(evt.target).selectpicker('render');
			//$(evt.target).selectpicker("refresh");
			console.log( $(evt.target).parent()[0].getElementsByTagName("button")[0].title );
		}
	}
	
	//$(evt.target).selectpicker();
	//document.fireEvent("onchange");
}

//calculatePfValue
function calculatePfValue(){
	var tableElems = $("#tbody2 tr");
	var pfValue = 0;
	for( var i = 0; i<tableElems.length; i++ ){
		let price = tableElems[i].getElementsByClassName("priceTd")[0].innerText;
		let nShares = tableElems[i].getElementsByClassName("addSharesNumInput")[0];
		var value = nShares.value;
		var pfValue = pfValue + ( parseFloat( price.split("$")[0] ) * value );
	}
	$("#pfValueInput").val( pfValue.toFixed(2) + "$" );
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
		modifyButton.style.padding = "initial";
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
		deleteButton.style.padding = "initial";
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
	$("#sharesNumTable tbody").empty();

	pfNum = item.id.toString();
	pfNum = pfNum.split("modifyButt")[1];

	$("#addPfNameInput").val(pfData[pfNum].pfName);

	selectedTickers = [];
	for( let i = 0; i<pfData[pfNum].tickers.length; i++ ){
		var type = pfData[pfNum].type[i].split(":")[0];
		var exch = pfData[pfNum].type[i].split(":")[1];
		$("#tickerTypeInput").val( type );
		$("#tickerTypeInput").selectpicker( "refresh" );
		if( type == "stocks" ){
			type = exch;
			$("#tickerExchangeInput").val( type );
			$("#tickerExchangeInput").selectpicker( "refresh" );
		}		
	
		addNumShares( pfData[pfNum].tickers[i], type, tickersDict[type][pfData[pfNum].tickers[i]][0], pfData[pfNum].prices[i] );
		
		var numSharesInputs = $(".addSharesNumInput");
		$( numSharesInputs[i] ).val( pfData[pfNum].numShares[i] );
	}
	showTickersInInput();
	calculatePfValue();
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
	tempTickersDict = $.extend(true, {}, tickersDict);
	showTickersInInput();
	$("#addModalLabel").text("Add Portfolio");	
	$("#addPfNameInput").val("");
	$("#sharesNumTable tbody").empty();
	$("#thead2").css( "opacity", 0.2 );
	$("#pfValueInput").val( "0.00$" );
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


//Onload Functions
function bindScroll( elem ) {
	var el = $( elem );
	if( el.width()-10 > el.parent().width() ){
		setTimeout(function(){
			$(el).addClass( "scrollText" );
		}, 3000);  
	}
	else{
		$(el).css( { marginLeft: "20%" } );
		$(el).removeClass( "scrollText" );
	}
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';
  
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}