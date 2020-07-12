const fs = require('fs');
const kuromoji = require('kuromoji');
const server = require('express')();
const line = require('@line/bot-sdk');

const lineConfig = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

const bot = new line.Client(lineConfig);

const builder = kuromoji.builder({
    dicPath: __dirname + '/node_modules/kuromoji/dict'
});

class Markov {
    constructor() {
        this.data = {};
    }
    add(words) {
        console.log(words);
        for (let i = 0; i <= words.length; i += 1) {
            let now = words[i];
            if (now === undefined) { now = null; }
            let prev = words[i - 1];
            if (prev === undefined) { prev = null; }
            if (this.data[prev] === undefined) {
                this.data[prev] = [];
            }
            this.data[prev].push(now);
        }
    }
    sample(word) {
        let words = this.data[word];
        console.log(words);
        if (words === undefined) { words = []; }
        return words[Math.floor(Math.random() * words.length)];
    }
    make() {
        let sentence = [];
        let word = this.sample(null);
        while (word) {
            sentence.push(word);
            word = this.sample(word);
        }
        return sentence.join('');
    }
}

function myBuilder(text) {
    console.log(text);
    return new Promise((resolve, reject) => {
        const markov = new Markov();
        builder.build((err, tokeneizer) => {
            if (err) reject(err);
            const tokens = tokeneizer.tokenize(text);
            const words = tokens.map((token) => token.surface_form);
            markov.add(words);
            const results = [markov.make(), markov.make(), markov.make()];
            console.log(results);
            resolve(results[0]);
        });
    });
}

server.listen(process.env.PORT || 3000);

server.post('/bot/webhook', line.middleware(lineConfig), (req, res) => {
    res.sendStatus(200);
    req.body.events.forEach((ev) => {
        if (ev.type === 'message' && ev.message.type === 'text') {
            myBuilder(ev.message.text).then((resp) => {
                bot.replyMessage(ev.replyToken, {
                    type: 'text',
                    text: resp
                });
            }).catch((err) => {
                console.error(err);
            });
        }
    });
});