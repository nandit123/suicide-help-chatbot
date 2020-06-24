'use strict';
const PAGE_ACCESS_TOKEN = "EAAKgqfnzF6MBAN1iU92kR1Di1WJWOTeJSPWNmZAQe6uhZAay9792fPmPEjwKUvOE5gACbM0oyZA8xCxkVbuZBmggLr7Q9UmpZBHXKNu1hcwPBr362ujFcOdiTkhL7oU8cOwJMFHTdd6j0JApNEJ2AH2sRPEDYfyRZBQk6UTsz2yoD7ZAr45XhtP";
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

  ["Task 1: Go out for run for 1 hour", "https://images.unsplash.com/photo-1559166631-ef208440c75a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80", "Go out for run for 1 hour. Then send a photograph of where you run for proof."],
  ["Task 2: Feed stray animals", "https://images.unsplash.com/photo-1532598187460-98fe8826d1e2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=80", "Go out and feed a stray animal or a bird. Then send a picture as a proof."],
  ["Task 3: Help an underprivileged", "https://images.unsplash.com/photo-1547496614-54ff387d650a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80", "Go out and help a person in need. Then send a photograph as a proof"],
  ["Task 4: Social Media Detox", "https://dailyillini.com/wp-content/uploads/2017/10/DI-Phone-Graphic-01-900x900.png", "Delete/Disable/Logout from all of your social media apps for a day. Then send a screenshot of the menu for proof."],
  ["Task 5: Phone a friend", "https://images.unsplash.com/photo-1522108133167-a96f36e623e7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80", "Call 3 old friends of yours whom you have not been in touch from a long time. Then send a screenshot of your call as a proof."]

];

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

  let body = req.body;
  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log('webhook event: ', webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      const client = new MongoClient(uri, { useNewUrlParser: true });

      client.connect((err, client) => {
        if (err) {
          console.log('mongodb client Failed to connect')
        } else {
          let collection = client.db("db1").collection("user_data");
          var query = { user_id: sender_psid };
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
        if (webhook_event.message.text == 'hi') {
          greetingMessage(sender_psid);
        } else if (webhook_event.message.attachments) {
          console.log("Attachment Received");
          handleMessage(sender_psid, webhook_event.message);
        } else if (webhook_event.message.quick_reply) {
          // to handle postback of quick reply
          handlePostback(sender_psid, webhook_event.message.quick_reply)
        } else if (webhook_event.message.text) {
          console.log('178766 else if branch: webhook_event.message.text: ', webhook_event.message.text);
          let t = 0; //fetch t from tasks completed by the user_id (call from mongodb)
          const client = new MongoClient(uri, { useNewUrlParser: true });
          client.connect((err, client) => {
            if (err) {
              console.log('mongodb client Failed to connect')
            } else {
              let collection = client.db("db1").collection("user_data");
              var query = { user_id: sender_psid };
              collection.find(query).toArray()
                .then(result => {
                  console.log('result1: ', result[0]['tasks']);
                  // get value of t (number of tasks done) from mongodb
                  t = result[0]['tasks'];
                  console.log('Tasks:', t);
                  let response;
                  response = {
                    "text": "We have some tasks that will cheer you up and freshen your mind. Currently, you have completed " + t + " tasks. Time to do the next task !!",
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
                        "title": "View all tasks",
                        "payload": "view_all",
                      },
                      {
                        "content_type": "text",
                        "title": "Reset Progress",
                        "payload": "reset_progress",
                      }
                    ]
                  }
                  callSendAPI(sender_psid, response);
                })
            }
          })
        }
      } else if (webhook_event.postback) {
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

function greetingMessage(sender_psid) {
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
    console.log('the attachment url: ', attachment_url);
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "We have received your task proof. Do you want to confirm this?",
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
    response = { "text": "Hello" }
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
  } else if (payload === 'today' || payload === '15days') {
    response = { "text": "Would you like to share with us the reason behind your sadness?" }
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
                "title": "Consult a professional",
                "payload": "consultProfessional",
              },
              {
                "type": "postback",
                "title": "Tasks to cheer up",
                "payload": "view_all",
              }
            ],
          }]
        }
      }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === 'consultProfessional') {
    response = {
		  "object": "page",
		  "entry": [
			{
			  "messaging": [
				{
				  "message": {
					"quick_reply": {
					  "payload": "phoneCall"
					},
					"text": "1234"
				  }
				}
			  ]
			}
		  ]
		}
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  } else if (payload === 'tasks_start') {
    let t = 0; //fetch t from tasks completed by the user_id (call from mongodb)
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((err, client) => {
      if (err) {
        console.log('mongodb client Failed to connect')
      } else {
        let collection = client.db("db1").collection("user_data");
        var query = { user_id: sender_psid };
        collection.find(query).toArray()
          .then(result => {
            console.log('result1: ', result[0]['tasks']);
            // get value of t (number of tasks done) from mongodb
            t = result[0]['tasks'];
            if (t < tasks.length) {
              response = {
                "attachment": {
                  "type": "template",
                  "payload": {
                    "template_type": "generic",
                    "elements": [{
                      "title": tasks[t][0],
                      "image_url": tasks[t][1],
                      "subtitle": tasks[t][2],
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
            } else {
              response = {
                "text": "Hey, you have completed all tasks available. Check back later for new tasks",
                "quick_replies": [
                  {
                    "content_type": "text",
                    "title": "Reset Progress",
                    "payload": "reset_progress",
                  },
                  {
                    "content_type": "text",
                    "title": "Not Now",
                    "payload": "tasks_later",
                  },
                  {
                    "content_type": "text",
                    "title": "View all tasks",
                    "payload": "view_all",
                  }
                ]
              }
              callSendAPI(sender_psid, response);
              response = {
                "attachment": {
                  "type": "template",
                  "payload": {
                    "template_type": "one_time_notif_req",
                    "title": "Get Notified: When new tasks are available for you to complete!",
                    "payload": "new_tasks_one_time_notif"
                  }
                }
              }
              callSendAPI(sender_psid, response);
            }
          })
          .catch(err => console.error(`Failed to find documents: ${err}`))
      }

      // perform actions on the collection object
      client.close();
    });

  } else if (payload === 'tasks_later') {
    response = {
      "text": "Ok, come back later"
    }
    callSendAPI(sender_psid, response);

  } else if (payload === 'proof') {
    response = { "text": "Please submit the image of yours doing today's task. This is for you to keep a record of all the awesome tasks you have started doing." }
    callSendAPI(sender_psid, response);
  } else if (payload === 'yes') {
    let t = 0; //fetch t from tasks completed by the user_id (call from mongodb)
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((err, client) => {
      if (err) {
        console.log('mongodb client Failed to connect')
      } else {
        let collection = client.db("db1").collection("user_data");
        collection.update({ user_id: sender_psid }, { $inc: { tasks: 1 } });
        var query = { user_id: sender_psid };
        collection.find(query).toArray()
          .then(result => {
            console.log('result1: ', result[0]['tasks']);
            t = result[0]['tasks'];
            let remainingTasks = 5 - t;
            let text = "Congratulations, you have completed this task. Remaining tasks: " + remainingTasks;
            response = {
              "text": text,
              "quick_replies": [
                {
                  "content_type": "text",
                  "title": "Next Task",
                  "payload": "tasks_start",
                },
                {
                  "content_type": "text",
                  "title": "Not Now",
                  "payload": "tasks_later",
                },
                {
                  "content_type": "text",
                  "title": "View all tasks",
                  "payload": "view_all",
                },
                {
                  "content_type": "text",
                  "title": "Reset Progress",
                  "payload": "reset_progress",
                }
              ]
            }
            callSendAPI(sender_psid, response);
          })
          .catch(err => console.error(`Failed to find documents: ${err}`))
      }

      // perform actions on the collection object
      client.close();
    });

    //Check in the Mongo and accordingly send the next task
  } else if (payload === 'no') {
    response = { "text": "Please share the attachment again." }
    callSendAPI(sender_psid, response);
  } else if (payload === 'view_all') {
    let t = 0; //fetch t from tasks completed by the user_id (call from mongodb)
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((err, client) => {
      if (err) {
        console.log('mongodb client Failed to connect')
      } else {
        let collection = client.db("db1").collection("user_data");
        var query = { user_id: sender_psid };
        collection.find(query).toArray()
          .then(result => {
            console.log('result1: ', result[0]['tasks']);
            t = result[0]['tasks'];
            response = {
              "attachment": {
                "type": "template",
                "payload": {
                  "template_type": "generic",
                  "elements": [{
                    "title": "Task 1: Go out for run for 1 hour",
                    "image_url": "https://images.unsplash.com/photo-1559166631-ef208440c75a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80",
                    "subtitle": "Go out for run for 1 hour. Then send a photograph of where you run for proof.",
                  },
                  {
                    "title": "Task 2: Feed stray animals",
                    "image_url": "https://images.unsplash.com/photo-1532598187460-98fe8826d1e2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=80",
                    "subtitle": "Go out and feed a stray animal or a bird. Then send a picture as a proof.",
                  },
                  {
                    "title": "Task 3: Help an underprivileged",
                    "image_url": "https://images.unsplash.com/photo-1547496614-54ff387d650a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80",
                    "subtitle": "Go out and help a person in need. Then send a photograph as a proof.",
                  },
                  {
                    "title": "Task 4: Social Media Detox",
                    "image_url": "https://dailyillini.com/wp-content/uploads/2017/10/DI-Phone-Graphic-01-900x900.png",
                    "subtitle": "Delete/Disable/Logout from all of your social media apps for a day. Then send a screenshot of the menu for proof.",
                  },
                  {
                    "title": "Task 5: Phone a friend",
                    "image_url": "https://images.unsplash.com/photo-1522108133167-a96f36e623e7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=750&q=80",
                    "subtitle": "Call 3 old friends of yours whom you have not been in touch from a long time. Then send a screenshot of your call as a proof.",
                  },
                  ]

                }
              },

              "quick_replies": [
                {
                  "content_type": "text",
                  "title": "Complete next task",
                  "payload": "tasks_start",
                },
                {
                  "content_type": "text",
                  "title": "Not Now",
                  "payload": "tasks_later",
                },
                {
                  "content_type": "text",
                  "title": "Reset Progress",
                  "payload": "reset_progress",
                }
              ]
            }
            for (var i = 0; i < t; i++) {
              response['attachment']['payload']['elements'][i]['title'] = '(Completed) '.concat(response['attachment']['payload']['elements'][i]['title'])
            }
            console.log(response)
            callSendAPI(sender_psid, response);
          })
          .catch(err => console.error(`Failed to find documents: ${err}`))
      }

      // perform actions on the collection object
      client.close();
    });


  } else if (payload === 'reset_progress') {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((err, client) => {
      if (err) {
        console.log('mongodb client Failed to connect')
      } else {
        let collection = client.db("db1").collection("user_data");
        collection.update({ user_id: sender_psid }, { $set: { tasks: 0 } });
        let response;
        response = {
          "text": "All your progress has been reset, you can start again with the first task. ",
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
              "title": "View all tasks",
              "payload": "view_all",
            }
          ]
        }
        callSendAPI(sender_psid, response);
      }
    });
  } else if (payload === 'new_tasks_one_time_notif') {
    let response;
    response = {
      "text": "Ok, we will notify you as soon as a new task arrives. Stay Happy and Stay Safe. You can reset progress to do the tasks again.",
      "quick_replies": [
        {
          "content_type": "text",
          "title": "Reset Progress",
          "payload": "reset_progress",
        },
        {
          "content_type": "text",
          "title": "Not Now",
          "payload": "tasks_later",
        },
        {
          "content_type": "text",
          "title": "View all tasks",
          "payload": "view_all",
        }
      ]
    }
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request_body),
  });
}