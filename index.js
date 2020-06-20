'use strict';
const PAGE_ACCESS_TOKEN ="EAAKgqfnzF6MBAN1iU92kR1Di1WJWOTeJSPWNmZAQe6uhZAay9792fPmPEjwKUvOE5gACbM0oyZA8xCxkVbuZBmggLr7Q9UmpZBHXKNu1hcwPBr362ujFcOdiTkhL7oU8cOwJMFHTdd6j0JApNEJ2AH2sRPEDYfyRZBQk6UTsz2yoD7ZAr45XhtP";
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server
const request = require('request');
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);
		
		// Get the sender PSID
		let sender_psid = webhook_event.sender.id;
		console.log('Sender PSID: ' + sender_psid);
		
		// Check if the event is a message or postback and
		// pass the event to the appropriate handler function
		//if (webhook_event.message.text == 'Happy' || 'Excited'){
		//	let response;
		//	response = {
		//		"text": `Great to hear that! Would you like to share with us the reason?`
		//	}
		//	callSendAPI(sender_psid, response);
		//}
		if (webhook_event.message){
		if (webhook_event.message.text=='hi') {
			greetingMessage(sender_psid);
		} else if (webhook_event.postback) {
			handlePostback(sender_psid, webhook_event.postback);
		}}
      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }

  });

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
});

function greetingMessage(sender_psid){
	let response;
	response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Greetings! How's your mood?",
            "subtitle": "Tap a button to answer.",
            "buttons": [
              {
                "type": "postback",
                "title": "Happy!",
                "payload": "happy",
              },
              {
                "type": "postback",
                "title": "Sad!",
                "payload": "sad",
              }
            ]
          }]
        }
      }
    }
	
	callSendAPI(sender_psid, response);
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent this message: "${received_message.text}". Now send me an attachment!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Happy!",
                "payload": "happy",
              },
              {
                "type": "postback",
                "title": "Sad!",
                "payload": "sad",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Send the response message
  callSendAPI(sender_psid, response);    
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;
  console.log("166", payload)
  // Set the response based on the postback payload
  if (payload === 'happy') {
    response = { "text": "Glad to know that! Would you like to share with us the reason?" }
  } else if (payload === 'sad') {
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "How long have you been sad?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Today",
                "payload": "today",
              },
              {
                "type": "postback",
                "title": "15 Days!",
                "payload": "15days",
              },
              {
                "type": "postback",
                "title": "1 Month!",
                "payload": "1month",
              }
            ],
          }]
        }
      }
    }
  } else if (payload === 'today' || '15days'){
    response = {"text": "Would you like to share with us the reason behind your sadness?"}
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}


// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}