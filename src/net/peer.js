const DefaultPeerConfig = {
    iceServers: [
        {
            urls: "turn:127.0.0.1",
            username: "username",
            credential: "password"
        },
        {
            urls: "stun:127.0.0.1"
        }
    ]
}

export {DefaultPeerConfig}

export class RTCPeer
{
    constructor(webrtc, sendJson, config = DefaultPeerConfig)
    {
        this.sendJson = sendJson;
        this.config = DefaultPeerConfig;
        this.webrtc = webrtc;
        this.peerConnection = new webrtc.RTCPeerConnection(this.config);

        var thiz = this;
        this.channels = {};

        this.peerConnection.onicecandidate = e => {
            console.log("sending candidate...");
            if (e.candidate)
            {
                thiz.sendJson({
                    candidate : e.candidate
                })
            }
        }

        this.peerConnection.onconnectionstatechange = () => {
            console.log("Con state", thiz.peerConnection.connectionState);
        };

        this.peerConnection.ondatachannel = (e) => {
            console.log("Receive data channel");
            thiz.onChannel(e.channel);
        }

        this.peerConnection.onerror = (error) => {
            console.error(error);
        }

        this.peerConnection.onopen = () => {
            console.log("peer open");
        }

        this.peerConnection.onclose = () => {
            console.log("peer close");
        }
    }

    onChannel(channel)
    {
        channel.onopen = ()=>
        {
            console.log("Channel Open");
            channel.send("hello");
        }
        
        channel.onclose = ()=>
        {
            console.log("channel closed");
        }   
        channel.onmessage = msg=> 
        {
            console.log(msg.data);
        } 
    }

    createDataChannel(label, config)
    {
        //console.log("Create channel", label);
        var channel = this.peerConnection.createDataChannel(label, config);
        return channel;
    }

    receiveIceCandidate(candidate)
    {
        const peerConnection = this.peerConnection;
        return peerConnection.addIceCandidate(candidate).catch(console.error)
    }

    receiveOffer(offer)
    {
        console.log("receive offer");

        const peerConnection = this.peerConnection;
        const sendJson = this.sendJson;

        return peerConnection.setRemoteDescription(new this.webrtc.RTCSessionDescription(offer))
            .then(() => peerConnection.createAnswer())
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => sendJson({answer: peerConnection.localDescription}))
            .catch(e => sendJson({error: e}));
    }

    receiveAnswer(answer)
    {
        console.log("receive answer");

        const peerConnection = this.peerConnection;
        return peerConnection.setRemoteDescription(new this.webrtc.RTCSessionDescription(answer));
    }
    
    createOffer()
    {
        const peerConnection = this.peerConnection;
        const sendJson = this.sendJson;

        peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => sendJson({
            offer : peerConnection.localDescription
        }))
        .catch(console.error);
    }

    stop()
    {
        //todo
    }
}

