var defConfig = {
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

export class RTCPeer
{
    constructor(webrtc, sendIce, config = defConfig)
    {
        this.sendIce = sendIce;
        this.config = config;
        this.webrtc = webrtc;
        this.peerConnection = new webrtc.RTCPeerConnection(config);
        var thiz = this;

        this.peerConnection.onicecandidate = e => {
            if (e.candidate)
            {
                thiz.sendIceCandidate(e.candidate);
            }
        }

        this.peerConnection.onconnectionstatechange = () => {
            console.log("Con state", thiz.peerConnection.connectionState);
        };

        this.peerConnection.ondatachannel = (e) => {
            console.log("Receive data channel");
            thiz.setupChanel(e.channel);
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

    setupChanel(channel)
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

    createDataChannel(label)
    {
        console.log("Create channel", label);
        var channel = this.peerConnection.createDataChannel(label);
        this.setupChanel(channel);
    }

    sendIceCandidate(candidate)
    {
        this.sendIce(candidate);
    }

    receiveIceCandidate(candidate)
    {
        const peerConnection = this.peerConnection;
        return peerConnection.addIceCandidate(candidate)
    }

    receiveOffer(offer, sendAnswer, sendError)
    {
        const peerConnection = this.peerConnection;
        const webrtc = this.webrtc;

        peerConnection.setRemoteDescription(new webrtc.RTCSessionDescription(offer))
            .then(() => peerConnection.createAnswer())
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => sendAnswer(peerConnection.localDescription))
            .catch(sendError)
    }

    receiveAnswer(answer)
    {
        const peerConnection = this.peerConnection;
        return peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
    
    createOffer()
    {
        const peerConnection = this.peerConnection;

        return peerConnection.createOffer()
            .then(offer => {

                return new Promise((resolve, reject) =>
                {
                    peerConnection.setLocalDescription(offer)
                        .then(() => resolve(offer))
                        .catch((err) => reject(err));
                })
            })
    }

    stop()
    {
        //todo
    }
}

