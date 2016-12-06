var loggedIn = false;

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

// on page load, if we have an ID in session storage, confirm that user is in the DB and return the name
function validateUser(oAuthID) {
    $.ajax({
        url: hostname + 'userLookup/',
        type: 'GET',
        data: 'oAuthID=' + oAuthID,
        success: function(data) {
            console.log("Validate User Response. Name : " + data.name);
            loggedIn = true;
            processUserData(data.name);
        },
        error: function(data) {
            console.log("Validate User Error!");
        }
    });
}

// on authentication attempt, check if the user already exists (i.e. session storage has been cleared), otherwise create them
function authUser(oAuthID, oAuthMethod, name, email, oAuthToken, oAuthTokenSecret, screenName) {
    //console.log('oAuthToken : ' + oAuthToken);
    //console.log('oAuthTokenSecret : ' + oAuthTokenSecret);
    localStorage.setItem('oAuthID', oAuthID);

    // do we have a record in the DB? true/false
    $.ajax({
        url: hostname + 'userLookup/',
        type: 'GET',
        data: 'oAuthID=' + oAuthID,
        success: function(data) {
            console.log("User Lookup Response. Name : " + data.name);
            // do nothing
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
