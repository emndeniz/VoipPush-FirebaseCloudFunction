
# VoipPushCloudFunction

This Firebase cloud function aim to send Voip push to APNS. Without any server installation you can send voip pushes from one client to other.


# Call Flow

It is vital to understand how you this function allows you to send voip push. This section explains that flow.


App stores devices push tokens in firestore when user launch app.  

![Screen Shot 2021-05-24 at 16 40 34](https://user-images.githubusercontent.com/7477031/119356135-c461b080-bcae-11eb-83c8-d98bf8228853.png)

When UserA decides to call UserB, device will trigger Firebase Cloud Function api. 
Firebase Cloud Function retrieves push token that was previously stored and sends push request to APNS with that token.
At last APNS sends voip push to UserB

![Screen Shot 2021-05-24 at 16 43 20](https://user-images.githubusercontent.com/7477031/119356488-27534780-bcaf-11eb-8605-ca3b1d249b8f.png)



> **Important Note:** I am not an JavaScript nor TypeScript developer. That's why you might see index.js seems ugly.
I am an iOS developer that needs to send Voip push and couldn't find required function code. I like to share tihs with Mobile developers such as me. 
If anyone can suggest better implementation on js part please feel free to contact me.  

## Installation

After clone this repo you need to change a few things.

1. First you should create admin sdk json from firebase. In the link below there is nice article which explains how you can do it.

[https://medium.com/litslink/firebase-admin-sdk-basics-in-examples-ee7e009a1116 ](
https://medium.com/litslink/firebase-admin-sdk-basics-in-examples-ee7e009a1116 )

After you created it place it `./functions/certs/` directory



2. Next you should place voip push certificates to `./functions/certs/` directory.

You can check it out link below how you can obtain voip push certificate.

[https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_certificate-based_connection_to_apns](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_certificate-based_connection_to_apns)

3. You need to place APNS auth key to `./functions/certs/` directory.

You can check it out link below how you can obtain APNS auth key.

[https://developer.clevertap.com/docs/how-to-create-an-ios-apns-auth-key](https://developer.clevertap.com/docs/how-to-create-an-ios-apns-auth-key)


4. Install node dependencies using `npm install` command on project root path.

For more information look at firebase documentation.
[https://firebase.google.com/docs/functions/get-started](https://firebase.google.com/docs/functions/get-started)

5. Change `<Firebase admin SDK json>` with your json file name.

`var serviceAccount = require("./certs/<Firebase admin SDK json>");`

6. Change <Your app name in firebase> with your project id. 

```
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<Your app name in firebase>.firebaseio.com"
});
```
> Push tokens usage will be explained in Usage section
 
For more info please check: [https://firebase.google.com/docs/reference/rest/database](https://firebase.google.com/docs/reference/rest/database)

7. Change tokensPath with where you store device push tokens. 
```
const tokensPath = admin.firestore().doc('<Firestore path where you hold push tokens>').get();
```

8. Change apns credentials with your own.
```
var options = {
        token: {
          key: "./certs/APNsAuthKey_1234567890.p8", //Where you store apns auth key
          keyId: "key-id", // The number which presented last part of apns key, 1234567890.
          teamId: "developer-team-id" // Developer team id in developer.apple.com
        },
        production: false
      };
```

9. Change app bundle id with your own.
```
note.topic = "<Your app bundle id>";
```


#### We are ready now!

## Usage

To be able to send push a device we need to store its push token. Apple documents describes how you can obtain push token in detail.

If you need a good article to check out how you can do it please [check this article](https://medium.com/mindful-engineering/voice-over-internet-protocol-voip-801ee15c3722).

Get push token from function below and [send it to firestore using firebase sdk](https://firebase.google.com/docs/database/ios/read-and-write).
 
```
func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        let deviceToken = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
        print("Voip push token :\(deviceToken)")
}
```


After you [deploy this function to firebase](https://firebase.google.com/docs/functions/manage-functions), we can send push one device to another using rest request.

As described in the [Fireabase document](https://firebase.google.com/docs/functions/http-events) you can use cloud function as rest api. 

You can test it via postman or curl your api is working or not.

Example:
Lets say my project name in firebase is `myDemoProject`
`curl -X POST -H "Content-Type:application/json" -H "X-MyHeader: 123" "https://us-central1-myDemoProject.cloudfunctions.net/callRequest?callee=Customer1" -d '{"callerName":"TestUser"}'`

If it is successfull you can make same request in iOS client using Alamofire or URLSession.



## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
