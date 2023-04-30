
const server = io();

async function connectToServer(){
	//Connection to server
	server.on("connect", () => {
		console.log("Connected");
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
}



//Login functions

//Show login div
async function showLoginDiv(){
	let usern = getCookie( "username" );
    userName = usern;
    let profileDiv = document.getElementById("profileDiv");
	let profileP = profileDiv.getElementsByTagName("p")[0];
	profileP.innerText = "User:    " + usern;
	return new Promise(function(resolve, reject) {
		server.emit("getPfList",{"username":usern}, (data) =>{ 
			var pfData = [];
			if( data["data"].length > 0 ){
				pfData = data["data"];
				console.log( pfData );
				resolve( pfData );
			}
			else
				resolve( false );
		});
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

//Show modal for login
function showLoginModal(){
	let usern = checkIfLogged()
	userName = usern;
	if( usern == "" ){
		$("#content").css("filter", "blur(5px)");
		$('#loginModal').modal({backdrop: 'static', keyboard: false, show: true});
		$("#registrationModal").modal("hide");
		$('#registrationModal').data('bs.modal',null);
		return false
	}
	else{
		let profileDiv = document.getElementById("profileDiv");
		let profileP = profileDiv.getElementsByTagName("p")[0];
		profileP.innerText = "User:    " + userName;
		return userName;
	}
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
		//var hashPass = hash(passwd.value);
		server.emit("login",{"username":usrn.value, "password":passwd.value});
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
		//var hashPass = hash(passwd.value);
		server.emit("registerUser",{"username":usrn.value, "password":passwd.value});
	}
}

function hash(e){for(var r=0,i=0;i<e.length;i++)r=(r<<5)-r+e.charCodeAt(i),r&=r;return r};

