const functions = require('firebase-functions')
const admin = require("firebase-admin");
const apn = require('apn');

var serviceAccount = require("./certs/app-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<Your app name in firebase>.firebaseio.com"
});

const LOG_TAG = 'VoipCall-Log'

exports.callRequest = functions.https.onRequest((request, response) => {

    const callee = request.query.callee;
    console.log(LOG_TAG + "callee: " + callee)
    const callerName = request.body.callerName
    const roomName = request.body.roomName
    console.log(LOG_TAG + "payload: " + callerName)
    // PushTokens/Bank1 is the path where I hold the tokens. 
    // You should change it your firestore path where you hold tokens.
    const tokensPath = admin.firestore().doc('PushTokens/Bank1').get();
    const promise = tokensPath.then(snapshot => {
        const data = snapshot.data();
        console.log(LOG_TAG + " data: ", data)
        const calleeToken = data[callee]['callToken']
        const targetDeviceOS = data[callee]['deviceOS']
        console.log(LOG_TAG + " calleeToken: ", calleeToken)
        response.status(200);
        response.send("Push Sent to APNS") // TODO: May need to inform client in case of fail
        if(targetDeviceOS == "iOS"){
          sendVoipPushToApns(calleeToken,callerName,roomName)
        }else if (targetDeviceOS == "Android"){
          sendPushToFirebase(calleeToken,callerName,roomName)
        }else {
          // Invalid targetDeviceOS
          console.error("Invalid targetDeviceOS received, targetDeviceOS : ", targetDeviceOS)
        }

    });
    promise.catch(error => {
       // Need to have better error management
        console.error(error);
        response.status(500).send;
    });

})


/**
 * Sends push to APNS for VOIP Call
 * @param {String} deviceToken 
 * @param {String} callerName 
 * @param {String} roomName 
 */
function sendVoipPushToApns(deviceToken,callerName,roomName) {
  console.log(LOG_TAG + "sendVoipPushToApns, deviceToken:" + deviceToken + ", callerName:" + callerName + ", roomName:" + roomName);
    var options = {
        token: {
          key: "./certs/APNsAuthKey_XXXXXXXXXX.p8",
          keyId: "key-id",
          teamId: "developer-team-id"
        },
        production: false
      };
      
      var apnProvider = new apn.Provider(options);
    
      var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "You have a new call";
    note.payload = {'callerName': callerName,"roomName":roomName};
    note.topic = "<Your app bundle id>";
x
    apnProvider.send(note, deviceToken).then( (result) => {
      console.log(LOG_TAG + " Push send result: " + result)
    });
}

/**
 * Sends push to Firebase for Call notification
 * @param {String} deviceToken 
 * @param {String} callerName 
 * @param {String} roomName 
 */
function sendPushToFirebase(deviceToken,callerName,roomName){
  console.log(LOG_TAG + "sendPushToFirebase, deviceToken:" + deviceToken + ", callerName:" + callerName + ", roomName:" + roomName);
  const payload = {
    data: {
      "callerName":callerName,
      "roomName":roomName
    }
  };

  const options = {
    priority: "high",
    timeToLive: 60  //60 sec
};

  admin.messaging().sendToDevice(deviceToken,payload,options).then((result) => {
    if(result.results[0].messageId){
      console.log(LOG_TAG + " Push send success , messageId: " + result.results[0].messageId)
    }else {
      console.error(LOG_TAG + " Push send fail , error: " + result.results[0].error.message)
    }
    
  });
}


// For regular push case function below can be use.
function sendPushToApns(deviceToken) {
    var options = {
        token: {
          key: "./certs/APNsAuthKey_XXXXXXXXXX.p8",
          keyId: "key-id",
          teamId: "developer-team-id"
        },
        production: false
      };
      
      var apnProvider = new apn.Provider(options);
    
      var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = {'messageFrom': 'John Appleseed'};
    note.topic = "<Your app bundle id>";

    apnProvider.send(note, deviceToken).then( (result) => {
      console.log(LOG_TAG + " Push send result: " + result)
    });
}