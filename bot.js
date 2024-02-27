import baileys from '@whiskeysockets/baileys'
import express from 'express'
import P from 'pino'
import qrcode from 'qrcode'
import cron from 'node-cron';
import axios from 'axios';
const fs = require('fs');

var qrwa = null
var PORT = process.env.PORT || 80 || 8080 || 3000
const app = express()
app.enable('trust proxy')
app.set("json spaces", 2)
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
app.all('*', async (req, res) => {
    if (qrwa) return res.type('.jpg').send(qrwa)
    res.send('QRCODE BELUM TERSEDIA. SILAHKAN REFRESH TERUS MENERUS')
})
app.listen(PORT, async () => {
    console.log(`express listen on port ${PORT}`)
})

const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    DisconnectReason
} = baileys

const startSock = async () => {
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState('auth')
    const {
        version,
        isLatest
    } = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger: P({
            level: 'silent'
        }),
        printQRInTerminal: true,
        browser: ["WhatsApp Bot ALVLP", '0.3'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({
                level: "fatal"
            }).child({
                level: "fatal"
            })),
        },
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)

            return msg?.message || ""
        },
    })

    sock.ev.process(
        async (events) => {
            if (events['connection.update']) {
                const update = events['connection.update']
                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update
                if (connection) {
                    console.info(`Connection Status : ${connection}`)
                }
                if (qr) {
                    let qrkode = await qrcode.toDataURL(qr, {
                        scale: 20
                    })
                    qrwa = Buffer.from(qrkode.split`,` [1], 'base64')
                }

                if (connection === 'open') qrwa = null
                if (connection === 'close') {
                    qrwa = null
                    if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                        await startSock()
                    } else {
                        console.log('Device Logged Out, Please Scan Again And Run.')
                        process.exit(1)
                    }
                }
            }

            if (events['presence.update']) {
                await sock.sendPresenceUpdate('unavailable')
            }

            if (events['messages.upsert']) {
                const upsert = events['messages.upsert']
                var type, msgg, body
                for (let msg of upsert.messages) {
                    if (msg.message) {
                        type = Object.entries(msg.message)[0][0]
                        msgg = (type == 'viewOnceMessageV2') ? msg.message[type].message[Object.entries(msg.message[type].message)[0][0]] : msg.message[type]
                        body = (type == 'conversation') ? msgg : (type == 'extendedTextMessage') ? msgg.text : (type == 'imageMessage') && msgg.caption ? msgg.caption : (type == 'videoMessage') && msgg.caption ? msgg.caption : (type == 'templateButtonReplyMessage') && msgg.selectedId ? msgg.selectedId : (type == 'buttonsResponseMessage') && msgg.selectedButtonId ? msgg.selectedButtonId : (type == 'listResponseMessage') && msgg.singleSelectReply.selectedRowId ? msgg.singleSelectReply.selectedRowId : ''
                    }







//Auto Read Status
                    if (msg.key.remoteJid === 'status@broadcast') {
                        if (msg.message?.protocolMessage) return;
                        console.log(`Success ${msg.pushName} ${msg.key.participant.split('@')[0]}\n`);

                        const delayTime = Math.floor(Math.random() * (600000 - 60000 + 1)) + 60000; // Random delay between 1 and 10 minutes (in milliseconds)

                        setTimeout(async () => {
                            await sock.readMessages([msg.key]);
                        }, delayTime);
                    }






//Auto Mengetik / Typing
                    if (msg.key.remoteJid.endsWith('@s.whatsapp.net')) {
                        if (msg.message?.protocolMessage) return
                        console.log(`Pesan baru\nDari : ${msg.pushName}\nNomor : ${msg.key.remoteJid.split('@')[0]}\nPesan: ${body}\n`)
                        sock.sendPresenceUpdate('composing', msg.key.remoteJid)
                        await delay(10)
                        return sock.sendPresenceUpdate('composing', msg.key.remoteJid)
                    }







//Auto Online
                    if (msg.key.remoteJid.endsWith('@s.whatsapp.net')) {
                        if (msg.message?.protocolMessage) return

                        sock.sendPresenceUpdate('available')
                        await delay(10000)
                        return sock.sendPresenceUpdate('available')
                    }

                }




            }


            ////////////////////////////////////////*Auto Status Hadits*//////////////////////////////

            function getRandomNumber(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            function getRandomNameAndNumber() {
                const names = ['abu-daud', 'ahmad', 'darimi', 'ibnu-majah', 'malik', 'muslim', 'nasai', 'tirmidzi'];
                const randomName = names[Math.floor(Math.random() * names.length)];

                let maxNumber;
                switch (randomName) {
                    case 'abu-daud':
                        maxNumber = 4590;
                        break;
                    case 'ahmad':
                        maxNumber = 26363;
                        break;
                    case 'darimi':
                        maxNumber = 3367;
                        break;
                    case 'ibnu-majah':
                        maxNumber = 4331;
                        break;
                    case 'malik':
                        maxNumber = 1594;
                        break;
                    case 'muslim':
                        maxNumber = 5362;
                        break;
                    case 'nasai':
                        maxNumber = 5662;
                        break;
                    case 'tirmidzi':
                        maxNumber = 3891;
                        break;
                }

                const randomNumber = getRandomNumber(1, maxNumber);

                return {
                    name: randomName,
                    number: randomNumber
                };
            }

            async function getData() {
                const {
                    name: bookName,
                    number
                } = getRandomNameAndNumber();
                const apiUrl = `https://api.hadith.gading.dev/books/${bookName}/${number}`;

                try {
                    const response = await axios.get(apiUrl);
                    const {
                        name
                    } = response.data.data;
                    const {
                        arab,
                        id
                    } = response.data.data.contents;

                    return `${name}-${number}\n${id}`;

                } catch (error) {
                    console.error('Error fetching data from API:', error.message);
                    return null;
                }
            }

            fs.readFile('data.json', 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading data.json:', err);
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);
                    const NomorDijinkanMelihatStatus = jsonData.NomorDijinkanMelihatStatus;
                    const backgroundColor = jsonData.backgroundColor;
                    const font = jsonData.font;

                    cron.schedule('0 0 * * *', () => {
                        const storyConfig = {
                            backgroundColor: backgroundColor,
                            font: font
                        };

                        try {
                            const hasil = getData();
                            if (hasil) {
                                sock.sendMessage('status@broadcast', {
                                    text: hasil
                                }, {
                                    ...storyConfig,
                                    statusJidList: NomorDijinkanMelihatStatus
                                });
                                console.log('Berhasil membuat Story Whatsapp');
                            } else {
                                console.log('Gagal membuat Story WhatsApp');
                            }
                        } catch (error) {
                            console.log('Error:', error);
                            console.log('Gagal membuat Story WhatsApp');
                        }
                    });
                } catch (error) {
                    console.error('Error parsing data.json:', error);
                }
            });


            ////////////////////////////////////////*Anti Call*//////////////////////////////
            if (events['call']) {
                async function call(json) {
                    fs.readFile('data.json', 'utf8', async (err, data) => {
                        if (err) {
                            console.error('Error reading data.json:', err);
                            return;
                        }
                        try {
                            const jsonData = JSON.parse(data);
                            const IjinkanPanggilan = jsonData.IjinkanPanggilan;
                            const PesanAntiCall = jsonData.PesanAntiCall;

                            for (const id of json) {
                                if (IjinkanPanggilan.includes(id.from)) {
                                    continue;
                                }

                                if (id.status === "offer") {
                                    await sock.sendMessage(id.from, {
                                        text: PesanAntiCall,
                                        mentions: [id.from],
                                    });
                                    await sock.rejectCall(id.id, id.from);
                                }
                                console.log(`Ada panggilan masuk Dari : ${id.from.split("@")[0]}\n`);
                            }
                        } catch (error) {
                            console.error('Error parsing data.json:', error);
                        }
                    });
                }

                return await call(events['call']);
            }
            
            
            
            
            ///End :)


            if (events['creds.update']) {
                await saveCreds()
            }
        }
    )
    return sock
}
startSock()
process.on('uncaughtException', console.error)