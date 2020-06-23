'use strict';
const PAGE_ACCESS_TOKEN ="EAAKgqfnzF6MBAN1iU92kR1Di1WJWOTeJSPWNmZAQe6uhZAay9792fPmPEjwKUvOE5gACbM0oyZA8xCxkVbuZBmggLr7Q9UmpZBHXKNu1hcwPBr362ujFcOdiTkhL7oU8cOwJMFHTdd6j0JApNEJ2AH2sRPEDYfyRZBQk6UTsz2yoD7ZAr45XhtP";
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  fetch = require('node-fetch'),
  app = express().use(bodyParser.json()); // creates express http server

  // Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

//Mongo connection
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:goodadmin@cluster0-ctvvi.mongodb.net/db1?retryWrites=true&w=majority";

let tasks = [

  ["Task 1: Go out for run for 1 hour", "https://images.unsplash.com/photo-1528543606781-2f6e6857f318?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=701&q=80", "Go out for run for 1 hour. Then send a photograph of where you run for proof."],
  ["Task 2: Feed stray animals", "https://images.unsplash.com/photo-1500384066616-8a8d547abfc9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80", "Go out and feed a stray animal or a bird. Then send a picture as a proof."],
  ["Task 3: Help an underprivileged", "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80", "Go out and help a person in need. Then send a photograph as a proof"],
  ["Task 4: Social Media Detox", "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=667&q=80", "Delete/Disable/Logout from all of your social media apps for a day. Then send a screenshot of the menu for proof."],
  ["Task 5: Phone a friend", "https://images.unsplash.com/photo-1522010405997-1b0d70605f78?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80", "Call 3 old friends of yours whom you have not been in touch from a long time. Then send a screenshot of your call as a proof."]

];

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
		console.log(body)
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];

        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);
        const client = new MongoClient(uri, { useNewUrlParser: true });

        client.connect((err, client) => {
          if (err) {
            console.log('mongodb client Failed to connect')
          } else {
            let collection = client.db("db1").collection("user_data");
            var query = {user_id: sender_psid};
            collection.find(query).toArray()
            .then(result => {
              console.log('result: ', result);
              if (result.length == 0) {
                const client2 = new MongoClient(uri, { useNewUrlParser: true });
                client2.connect((err, client) => {
                  if (err) console.log('failed to connect');
                  else {
                    let collection2 = client.db("db1").collection("user_data");
                    collection2.insertOne({ user_id: sender_psid, tasks: 0 })
                  }
                });
              }
            })
            .catch(err => console.error(`Failed to find documents: ${err}`))
          }	
        
          // perform actions on the collection object
          client.close();
        });
        
        if (webhook_event.message) {
          if (webhook_event.message.text=='hi') {
            greetingMessage(sender_psid);
          } else if (webhook_event.message.attachments) {
            console.log("Attachment Received");
            handleMessage(sender_psid, webhook_event.message);
          } else if (webhook_event.message.quick_reply) {
            // to handle postback of quick reply
            handlePostback(sender_psid, webhook_event.message.quick_reply)
          } else if (webhook_event.message.text) {
            console.log('178766 else if branch: webhook_event.message.text: ', webhook_event.message.text);
            let response;
            response = {
              "text": "We have some tasks that can help cheer you up.",
              "quick_replies": [
                {
                  "content_type": "text",
                  "title": "Let's Start",
                  "payload": "tasks_start",
                },
                {
                  "content_type": "text",
                  "title": "Not Now",
                  "payload": "tasks_later",
                },
				{
                  "content_type": "text",
                  "title": "View All",
                  "payload": "view_all",
                }
              ]
            }
            callSendAPI(sender_psid, response);
        }} else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        }
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
            "title": "We have received your assignment. Is the submitted image same that you submitted?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
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
  if (payload === 'GET_STARTED_PAYLOAD') {
      response = {"text": "Hello"}
      callSendAPI(sender_psid, response).then(() => {
        greetingMessage(sender_psid);
      });
    // callSendAPI(sender_psid, response);
  } else if (payload === 'happy') {
    response = { "text": "Glad to know that! Would you like to share with us the reason?" }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === 'sad') {
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "How long have you been sad?",
            "subtitle": "Tap a button to answer.",
            "buttons": [
              {
                "type": "postback",
                "title": "Today!",
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
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === 'today' || payload === '15days'){
    response = {"text": "Would you like to share with us the reason behind your sadness?"}
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === '1month') {
	response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Please choose something from the below mentioned options.",
            "subtitle": "Tap a button to answer.",
            "buttons": [
              {
                "type": "postback",
                "title": "Consult a trained professional",
                "payload": "consultProfessional",
              },
              {
                "type": "postback",
                "title": "Tasks to cheer up",
                "payload": "tasks_start",
              }
            ],
          }]
        }
      }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === 'consultProfessional') {
	response = {"text": "Soon we will share you the details but right now please focus on the tasks."}
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === 'tasks_start') {
    let t = 0; //fetch t from tasks completed by the user_id (call from mongodb)
	  response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": tasks[t/8][0],
			      "image_url": tasks[t/8][1],
            "subtitle": tasks[t/8][2],
            "buttons": [
              {
                "type": "postback",
                "title": "Submit proof",
                "payload": "proof",
              }
            ],
          }]
        }
      }
    }
  	callSendAPI(sender_psid, response);
  } else if (payload === 'tasks_later') {
    response = {
      "text": "Ok, come back later"
    }  
    callSendAPI(sender_psid, response);    

  } else if (payload === 'proof') {
	  response = {"text": "Please submit the image of yours doing today's task. Our team will verify it later."}
	  callSendAPI(sender_psid, response);
  } else if (payload === 'yes') {
	  const client3 = new MongoClient(uri, { useNewUrlParser: true });

      client3.connect((err, client) => {
          if (err) {
            console.log('mongodb client Failed to connect')
          } else {
            let collection = client.db("db1").collection("user_data");
			console.log('abc')
            collection.update({ user_id: sender_psid }, { $inc: { tasks: 1 } });
		  }	
        
          // perform actions on the collection object
          client3.close();
        });
	  const client4 = new MongoClient(uri, { useNewUrlParser: true });
	  var query = {user_id: sender_psid};
            collection.find(query).toArray()
            .then(result => {
              console.log('result: ', result);
            })
	//Check in the Mongo and accordingly send the next task
  } else if (payload ==='no') {
	  response = {"text": "Please share the attachment again."}
	  callSendAPI(sender_psid, response);
  }
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
  const qs = 'access_token=' + encodeURIComponent(PAGE_ACCESS_TOKEN); // Here you'll need to add your PAGE TOKEN from Facebook
      return fetch('https://graph.facebook.com/v2.6/me/messages?' + qs, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(request_body),
    });
}