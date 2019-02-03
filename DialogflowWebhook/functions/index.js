// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// const {OAuth2Client} = require('google-auth-library');
// const http = require('http');
// const url = require('url');
// const opn = require('opn');
// const destroyer = require('server-destroy');


const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');
let XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;


let contactList = {
  'Ali': ['5149163928', 'alishobeiri97@gmail.com'],
  'Matt': ['4036908321', 'matthew.chan@shaw.ca'],
};

// const keys = require('./credentials.json');

// /**
//  * Create a new OAuth2Client, and go through the OAuth2 content
//  * workflow.  Return the full client to the callback.
//  * @return {number} hello
//  */
// function getAuthenticatedClient() {
//   return new Promise((resolve, reject) => {
//     console.log(keys);
//     const oAuth2Client = new OAuth2Client(
//       keys.installed.client_id,
//       keys.installed.client_secret,
//       keys.installed.redirect_uris[0]
//     );

//     // Generate the url that will be used for the consent dialog.
//     const authorizeUrl = oAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: 'https://www.googleapis.com/auth/userinfo.profile',
//     });

//     const server = http.createServer(async (req, res) => {
//         try {
//           if (req.url.indexOf('/oauth2callback') > -1) {
//     // acquire the code from the querystring, and close the web server.
//             const qs = new url.URL(req.url, 'http://localhost:3000')
//               .searchParams;
//             const code = qs.get('code');
//             console.log(`Code is ${code}`);
//  res.end('Authentication successful! Please return to the console.');
//             server.destroy();

//             // Now that we have the code, use that to acquire tokens.
//             const r = await oAuth2Client.getToken(code);
//             // Make sure to set the credentials on the OAuth2 client.
//             oAuth2Client.setCredentials(r.tokens);
//             console.info('Tokens acquired.');
//             resolve(oAuth2Client);
//           }
//         } catch (e) {
//           reject(e);
//         }
//       })
//       .listen(3000, () => {
//         // open the browser to the authorize url to start the workflow
//         opn(authorizeUrl, {wait: false}).then((cp) => cp.unref());
//       });
//     destroyer(server);
//   });
// }

const app = dialogflow({debug: true});

app.intent('SendInteracRequest', async (conv, params) => {
  // https://developers.google.com/actions/reference/nodejs/lib-v1-migration - read params

  let test = conv.contexts['interact_request-followup'];
  console.log('test: ', test);

  console.log('Contexts: ', conv.contexts);

  console.log('Context_Params: ',
              conv.contexts.input['interact_request-followup']['parameters']);

  console.log('Params: ', params);
  // console.log('given_name:', givenName);
  // console.log('given_name:', unitCurrency);
  let messageType = params.messageType;

  let vals = conv.contexts.input['interact_request-followup']['parameters'];

  let givenName = vals.givenName;
  let unitCurrency = vals.unitCurrency[0].amount;

  let contact = contactList[givenName];

  for (let i=0; i < givenName.length; i++) {
    let curName = givenName[i];
    let curContact = contactList[curName];
    if (messageType == 'sms') {
      curContact = curContact[0];
    } else {
      curContact = curContact[1];
    }

    if (vals.unitCurrency.length > 1 && i == 1) {
      console.log('vals.unitCurrency: ', vals.unitCurrency);
      unitCurrency = vals.unitCurrency[1].amount;
    }
    sendInteracRequest(unitCurrency, curName, messageType, curContact);
  }

  console.log('messageType: ', messageType);
  console.log('Contact: ', contact);
  console.log('Contact List: ', contactList);

  // conv.ask(new Confirmation('Are you sure you want to do that?'));
  conv.close('Your Interac e-transfer request has been sent!');
  // Complete your fulfillment logic and
  // send a response when the function is done executing
});


/**
 * @param {number} unitCurrency - Value of currrency
 * @param {string} givenName - Name of recipient
 * @param {string} messageType - Method of request transport
 * @param {string} contact - Contact info for the individual
 * Used to send API requests to Interac API
 * @return {void} does not return smack
 */
function sendInteracRequest(unitCurrency, givenName, messageType, contact) {
  let data = JSON.stringify({
    'amount': unitCurrency,
    'contactName': givenName,
    'messageType': messageType,
    'email': contact,
  });

  console.log('data: ', data);

  // const oAuth2Client = await getAuthenticatedClient();


  // const url = 'https://people.googleapis.com/v1/people/me?personFields=names';
  // const res = await oAuth2Client.request({url});
  // console.log(res.data);

  let xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.addEventListener('readystatechange', function() {
    if (xhr.readyState === 4) {
      console.log(xhr.responseText);
    }
  });

  xhr.open('POST', 'https://qualified-smile-230600.appspot.com/v1/request-money');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('cache-control', 'no-cache');

  xhr.send(data);
}

exports.sendInteracRequest = functions.https.onRequest(app);

