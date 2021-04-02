import {RTCPeer} from "./peer.js"

export class RTCSignalClient
{
    constructor(url = 'ws:localhost:8080')
    {
        this.ws = new WebSocket(url);
        var thiz = this;
        var ws = this.ws;

        var sendJson = (data) =>
        {
            ws && ws.send(JSON.stringify(data));
        }

        this.rtc = new RTCPeer(window, sendJson);
        
        const peer = {
            rtc : this.rtc,
            ws : this.ws,
            data : null
        };

        ws.addEventListener('open', function(event) {
            thiz.onPeer(peer);
        });

        ws.addEventListener('message', function(event){
            var data = JSON.parse(event.data);

            if (data.answer)
            {
                console.log("receive answer");
                thiz.rtc.receiveAnswer(data.answer);
            }

            if (data.offer)
            {
                console.log("receive offer");
                thiz.rtc.receiveOffer(data.offer);
            }

            if (data.candidate)
            {
                console.log("receive candidate");
                thiz.rtc.receiveIceCandidate(data.candidate);
            }
        })
    }

    onPeer(peer)
    {

    }
}

