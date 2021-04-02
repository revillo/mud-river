import {DefaultPeerConfig, RTCPeer} from "./peer.js"


let DefaultConfig = {
    port : 8080,
    peerConfig : DefaultPeerConfig
}

export class RTCSignal
{
    constructor(websocket, webrtc, config = DefaultConfig)
    {
        this.WebSocket = websocket;
        this.config = config;

        this.WebRTC = webrtc;
    }

    start()
    {
        var port = this.config.port || 8080;

        this.wss = new this.WebSocket.Server({
            port: port
        });

        console.log("Signal on port ", port)
        
        this.wss.on('connection', this.handleConnection.bind(this));
    }

    onPeer(peer)
    {

    }

    onClose(peer)
    {

    }

    handleConnection(ws)
    {
        var sendJson = (data) =>
        {
            ws && ws.send(JSON.stringify(data));
        }

        var rtcPeer = new RTCPeer(this.WebRTC, sendJson, this.config.peerConfig);

        ws.on('message', (message) => {
            var data = JSON.parse(message);

            if (data.offer)
            {
                console.log("receive offer");
                rtcPeer.receiveOffer(data.offer);
            }

            if (data.candidate)
            {
                console.log("Receive candidate", data.candidate);
                rtcPeer.receiveIceCandidate(data.candidate);
            }

            if (data.answer)
            {
                console.log("receive answer");
                rtcPeer.receiveAnswer(data.answer);
            }
        });

        let thiz = this;

        let peer = {
            rtc: rtcPeer,
            ws : ws,
            data : null
        };

        ws.on('close', () => {
            console.log("Websocket Closed");

            thiz.onClose(peer);
            //rtcPeer.close();
            rtcPeer = null;
            ws = null;
        })


        this.onPeer(peer);
    }
}