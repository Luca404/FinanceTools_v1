//CONST
var pfData = [];
var userName = "";
var pfDeleteNum = 0;
var selectedTickers = [];
var tickersList = [];
var punto = false;

var multiSelectOption = {
	removeItemButton: true,
	addItems: true,
	loadingText: 'Loading...',
	noResultsText: 'No results found',
	noChoicesText: 'No choices',
    searchFields: ['label', 'value'],
	shouldSort: false,
	placeholder: true,
    shouldSortItems: false,
	searchResultLimit: 6,
	//itemSelectText: 'Press to select',
};
var multipleSelect = new Choices('#addPfTickersInput', multiSelectOption );


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


//Show user option for disconnect
function showUserOption(){

}

//Get pf list from server
function getPfList( usrn ){
	server.emit("getPfList",{"username":usrn}, (data) => {
		pfData = [];
		if( data.length > 0 ){
			pfData = data;
			loadTable1(data);
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
		showTickersInInput();
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
	var inputTickerType = document.getElementById("tickerTypeInput");
	let selectedType = inputTickerType.options[inputTickerType.selectedIndex].text;	
	var inputExchange = document.getElementById("tickerExchangeInput");
	
	if( selectedType == "Stocks" ){
		let selectedExchange = inputExchange.options[inputExchange.selectedIndex].text;
		var tickersType = selectedExchange.toLowerCase();
		inputExchange.style.display = "inline-block";
	}
	else{
		inputExchange.style.display = "none";
		var tickersType = selectedType.toLowerCase();
	}

	var tickersData = [];
	var tickersDataList = tickersList[tickersType];
	for( var i = 0; i < tickersDataList.length; i++ )
		tickersData[i] = {value: tickersDataList[i].s, label: tickersDataList[i].s, placeholderValue: tickersDataList[i].n };
	
	multipleSelect.setChoices( tickersData, "value", "label", "placeholderValue");

	var els = document.querySelectorAll('.choices__input--cloned');
    els.forEach((el, n) => {
        el.setAttribute('autocomplete', 'one-time-code');
    });
}

function addInputNumShares(event){
	var pfTickerSelect = document.getElementById("addPfTickersInput");
	var pfTickerOptions = pfTickerSelect.getElementsByTagName("option");
	console.log( pfTickerOptions );
	var tickers = []
	for( var i=0; i < pfTickerOptions.length; i++ ){
		tickers.push( pfTickerOptions[i].innerText );
	}
	console.log( tickers );
	if( selectedTickers.length > tickers.length ){
		let diff = tickers.filter(x => !selectedTickers.includes(x)).concat(selectedTickers.filter(x => !tickers.includes(x)));
		removeNumShares( diff );
	}
	else
		addNumShares( tickers.at(-1) );
	
	selectedTickers = tickers;
}

function removeNumShares( name ){
	var numSharesDiv = document.getElementById("pfSharesNumDiv");
	var numSharesDivs = numSharesDiv.getElementsByTagName("div");
	console.log( numSharesDivs );
	for( var i=0;i<numSharesDivs.length;i++ ){
		let numSharesText = numSharesDivs[i].getElementsByTagName("input")[0].label;
		if( numSharesText == name )
			numSharesDiv.removeChild( numSharesDivs[i] );
	}
}

function addNumShares( ticker ){
	var numSharesDiv = document.getElementById("pfSharesNumDiv");

	var newDiv = document.createElement("div");
	newDiv.style.display = "flex";
	newDiv.style.marginLeft = "12%";
	newDiv.style.marginTop = "3%";

	var newH = document.createElement("h6");
	newH.innerText = ticker + ":  ";
	newDiv.appendChild( newH );
	
	var newInput = document.createElement("input");
	newInput.className = "addSharesNumInput";
	$(newInput).on("keypress", ( filterLetters ));
	newInput.label = ticker;
	newInput.id = ticker + "NumShares";
	newInput.name = ticker + "NumShares";
	newInput.autocomplete = "one-time-code";
	newInput.type = "text";

	newDiv.appendChild( newInput );
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
		td1.className = "itemTd"
		td1.appendChild(document.createTextNode(portFolios[i].pfName));
		tr.appendChild(td1);

		var td2 = document.createElement("td");
		td2.className = "itemTd"
		td2.appendChild(document.createTextNode(portFolios[i].tickers));
		tr.appendChild(td2);

		var td3 = document.createElement("td");
		td3.className = "itemTd"
		td3.appendChild(document.createTextNode(portFolios[i].numShares));
		tr.appendChild(td3);

		var td4 = document.createElement("td");
		td4.className = "modifyTd"
		
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

        td4.appendChild(modifyButton);
		td4.appendChild(deleteButton);

		tr.appendChild(td4);

		tbody.insertBefore( tr, tbody.lastElementChild);
	}
}

//Function for modify a portfolio
function modifyPf(item){
	multipleSelect.clearStore();
	$("#pfSharesNumDiv").empty();
	showTickersInInput();
	$("#addModalLabel").text("Modify Portfolio");

	var pfNum = item.id.toString();
	pfNum = pfNum.split("modifyButt")[1];

	$("#addPfNameInput").val(pfData[pfNum].pfName);

	var numSharesDiv = document.getElementById( "pfSharesNumDiv" );
	var numSharesDivs = numSharesDiv.getElementsByTagName( "div" );
	$("#addPfSharesNumInput").val(pfData[pfNum].numShares);

	var inputTickerType = document.getElementById("tickerTypeInput");
	var inputExchange = document.getElementById("tickerExchangeInput");

	selectedTickers = [];
	for( let i = 0; i<pfData[pfNum].tickers.length; i++ ){
		var selectedType = inputTickerType.options[inputTickerType.selectedIndex].value.toLowerCase();
		var selectedExchange = inputExchange.options[inputExchange.selectedIndex].value.toLowerCase();
		var type = pfData[pfNum].type[i].split(":")[0];
		var exch = pfData[pfNum].type[i].split(":")[1];

		if( type == selectedType ){
			if( selectedExchange != exch )
				$("#tickerExchangeInput").val( exch );				
		}
		else
			$("#tickerTypeInput").val( type );
		
	
		showTickersInInput();
		multipleSelect.setChoiceByValue( pfData[pfNum].tickers[i] );

		selectedTickers.push( pfData[pfNum].tickers[i] );
		addNumShares( pfData[pfNum].tickers[i] );
		var numSharesInput = document.getElementById( pfData[pfNum].tickers[i] + "NumShares" );
		$( numSharesInput ).val( pfData[pfNum].numShares[i] );

	}
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
	server.emit( "deletePf", pfData[pfDeleteNum], (result) => {
		if( result ){
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
			server.emit("getPfList",{"username":userName}, (data) =>{ 
				pfData = [];
				if( data.length > 0 ){
					pfData = data;
					loadTable1(data);
				}
				else{
					console.log("Error");
				}
			});
		}
		else{
			alert("Error with the server");
		}
	});
}
 
function addPf(){
	multipleSelect.clearStore();
	$("#addModalLabel").text("Add Portfolio");	
	$("#addPfNameInput").val("");
	$("#pfSharesNumDiv").empty();
	selectedTickers = [];
	showTickersInInput();
}

//Function to add a portFolio
function saveChangesButton(){
	let check = true;
	var pfName = document.getElementById("addPfNameInput");
	var pfTickersOpt = $('#addPfTickersInput option');
	var pfTickers = [];
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
	var choicesDiv = document.getElementsByClassName("choices__inner")[0];
	let choicesInput = choicesDiv.getElementsByTagName("input")[0];
	let tickersNum = $('#addPfTickersInput option').length;
	for( let i = 0; i < tickersNum; i++ ){
		pfTickers.push( pfTickersOpt[i].label );
		pfTypes.push( pfTickersOpt[i].value );
	}
	if( tickersNum == 0 ){
		choicesDiv.style.animation = "0.25s linear 0s 1 normal forwards running error";
		choicesInput.placeholder = "Insert Symbol";
		choicesInput.classList.add("selectCheck");
		setTimeout(() => {
			choicesDiv.style.animation = "";
		}, 250);
		setTimeout(() => {
			choicesInput.classList.remove("selectCheck");
			choicesInput.placeholder = "Select Symbols";
		}, 1500);
		check = false;
	}

	//Check numbers of shares
	let pfSharesDiv = document.getElementById( "pfSharesNumDiv" );
	let pfSharesInputs = pfSharesDiv.getElementsByTagName( "input" );

	for(let i = 0 ; i < pfSharesInputs.length; i++){
		pfShares.push( parseInt( pfSharesInputs[i].value ) );
		if( pfSharesInputs[i].value == "" )
			check = false;
	}
	console.log( pfShares );
	if( pfSharesValue == "" ){
		pfSharesInput.style.animation = "0.25s linear 0s 1 normal forwards running error";
		pfSharesInput.value = "";
		pfSharesInput.placeholder = "Insert Num of Shares";
		setTimeout(() => {
			pfSharesInput.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfSharesInput.placeholder = "";
		}, 1500);
		check = false;
	}
	if( pfSharesNum.length != tickersNum || !done ){
		pfSharesInput.style.animation = "0.25s linear 0s 1 normal forwards running error";
		let text = pfSharesInput.value;
		pfSharesInput.value = "";
		pfSharesInput.placeholder = "Insert a number for symbol";
		setTimeout(() => {
			pfSharesInput.style.animation = "";
		}, 250);
		setTimeout(() => {
			pfSharesInput.placeholder = "";
			pfSharesInput.value = text;
		}, 1500);
		check = false;
	}
	if( check )
		server.emit( "savePf", {userID: userName, pfName: pfNameValue, tickers: pfTickers, type: pfTypes, numShares: pfShares }, (result) => {
			if( result ){
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
				server.emit("getPfList",{"username":userName}, (data) => {
					pfData = [];
					if( data.length > 0 ){
						pfData = data;
						loadTable1(data);
					}
					else{
						console.log("Error!!");
					}
				});
			}
			else{
				alert("Error with server");
			}
		});
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