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
    constructor(data = {}) {
        this.data = data;
    }
    add(words) {
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
    return new Promise((resolve, reject) => {
        const dataFile = fs.readFileSync(__dirname + '/data.json', 'utf-8');
        const data = JSON.parse(dataFile.toString()) || {};
        console.log(data);
        const markov = new Markov(data);
        builder.build((err, tokeneizer) => {
            if (err) reject(err);
            const tokens = tokeneizer.tokenize(text);
            const words = tokens.map((token) => token.surface_form);
            markov.add(words);
            fs.writeFileSync(__dirname + '/data.json', JSON.stringify(markov.data));
            resolve(markov.make());
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