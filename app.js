const server = require('express')();
const line = require('@line/bot-sdk');

const lineConfig = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

const bot = new line.Client(lineConfig);

server.listen(process.env.PORT || 3000);

server.post('/bot/webhook', line.middleware(lineConfig), (req, res) => {
    res.sendStatus(200);
    req.body.events.forEach((ev) => {
        if (ev.type === 'message' && ev.message.type === 'text') {
            if (ev.message.text.indexOf('今何時') !== -1) {
                const dt = new Date();
                const now = (dt.getHours() + 9) + ':' + dt.getMinutes();
                bot.replyMessage(ev.replyToken, {
                    type: 'text',
                    text: now
                });
            } else {
                bot.replyMessage(ev.replyToken, {
                    type: 'text',
                    text: ev.message.text
                });
            }
        }
    });
});