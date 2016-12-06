var loggedIn = false;
var oAuthID_memory;

function authTwitter() {
    //Using popup
    OAuth.popup('twitter').done(function(result) {
        var oAuthToken = result.oauth_token;
        var oAuthTokenSecret = result.oauth_token_secret;
        //use result.access_token in your API request

        //or use result.get|post|put|del|patch|me methods (see below)
        result.get('/1.1/account/verify_credentials.json?include_email=true').done(function(data) {
            processUserData(data.name);
            // FIXME email is blank, why!? working on it, support query with twitter & oauth.io
            authUser(data.id, "T", data.name, data.email, oAuthToken, oAuthTokenSecret, data.screen_name);
        })
    })
    .fail(function (err) {
        console.error("ERROR : " + err);
    });
}

function authFacebook() {
    OAuth.popup('facebook').done(function(result) {
        var oAuthToken = result.oauth_token;
        var oAuthTokenSecret = result.oauth_token_secret;
        result.me().done(function(data) {
            processUserData(data.name);
            authUser(data.id, "F", data.name, data.email, oAuthToken, oAuthTokenSecret);
        })
    })
}

function authGoogle() {
    OAuth.popup('google').done(function(result) {
        var oAuthToken = result.access_token; // not clear what id_token is!?
        var oAuthTokenSecret = oAuthToken;// FIXME - we don't have this for google and probably dont need it! result.oauth_token_secret;
        result.me().done(function(data) {
            processUserData(data.name);
            authUser(data.id, "G", data.name, data.email, oAuthToken, oAuthTokenSecret);
        })
    })
}

function validateUser(oAuthToken) {
    $.ajax({
        url: hostname + 'userLookup/',
        type: 'GET',
        data: 'oAuthToken=' + oAuthToken,
        success: function(data) {
            console.log("Validate User Response. Name : " + data.name);
            loggedIn = true;
            oAuthID_memory = data.oAuthID;
            processUserData(data.name);
        },
        error: function(data) {
            console.log("Validate User Error!");
        }
    });
}

function authUser(oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName) {
    oAuthID_memory = oAuthID;
    //console.log('oAuthToken : ' + oAuthToken);
    //console.log('oAuthTokenSecret : ' + oAuthTokenSecret);
    localStorage.setItem('oAuthToken', oAuthToken);
    localStorage.setItem('oAuthTokenSecret', oAuthTokenSecret);

    // do we have a record in the DB? true/false
    $.ajax({
        url: hostname + 'userLookup/',
        type: 'GET',
        data: 'oAuthToken=' + oAuthToken,
        success: function(data) {
            console.log("User Lookup Response. Name : " + data.name);
            // do nothing
            newUser(oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName);
        },
        error: function(data) {
            console.log("User Lookup - nothing found!");
            newUser(oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName);
        }
    });

    loggedIn = true;
}

function newUser(oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName) {
    // doesnt exist in our database, create
    console.log("Creating new user! Name: " + name + " Email: " + email);
    $.ajax({
        url: hostname + 'writeUser/',
        type: 'POST',
        data: 'oAuthID=' + oAuthID + "&oAuthMethod=" + oAuthMethod + "&name=" + name + "&email=" + email + "&oAuthToken=" + oAuthToken + "&oAuthTokenSecret=" + oAuthTokenSecret + "&screenName=" + screenName,
        success: function(data) {
            console.log("Write User Response : " + data);
        }
    });
}
