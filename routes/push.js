var express = require('express');
var router = express.Router();
var login = require('./login').router

//https://thecodebarbarian.com/sending-web-push-notifications-from-node-js.html

const webpush = require('web-push');
const { PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY } = require('../util/DB.js');

// Replace with your email
webpush.setVapidDetails('mailto:efcu93@gmail.com', PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);

router.post('/subscribe', login.validarSesion, (req, res, next) => {
    const subscription = req.body;
    res.status(201).json({});
    const payload = JSON.stringify({ title: 'test' });
  
    console.log(subscription);
  
    webpush.sendNotification(subscription, payload).catch(error => {
        console.error(error.stack);
    });
});

module.exports = router;