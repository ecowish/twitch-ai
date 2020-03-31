import TwitchBot from 'twitch-bot';
import fc from 'fetch';
const fetch = fc.fetchUrl;

const Bot = new TwitchBot({
    username: process.env.TWITCH_USERNAME,
    oauth: process.env.TWITCH_OAUTH,
    channels: [process.env.TWITCH_CHANNEL]
});

Bot.on('join', channel => {
    console.log(`Joined channel: ${channel}`)
})

Bot.on('error', err => {
    console.log(err)
})

Bot.on('message', chatter => {
    fetch(process.env.LUIS_URI + encodeURI(chatter.message), (error, meta, body) => {
        var res = JSON.parse(body);
        if(res.error) {
            Bot.say("아앗 문제가 발생했어요. 잠시 후 다시 시도해주세요!");
            console.log(res);
            return;
        }
        var i = -1;
        var data = {
            product: null,
            part: null,
            trashType: null
        }
        for(var i in res.entities) {
            var entity = res.entities[i];
            switch(entity.type) {
                case "Product":
                    data.product = entity.entity.replace(/ /g, "");
                    break;
                case "Part":
                    data.part = entity.entity.replace(/ /g, "");
                    break;
                case "TrashType":
                    data.trashType = entity.entity.replace(/ /g, "");
                    break;
            }
        }
        switch(res.topScoringIntent.intent) {
            case "HowToRecycle":
                if(i == -1) {
                    Bot.say("어떤 제품인지 모르겠네요 ㅠㅠ");
                    break;
                }
                var str = ((data.product == null)?"":(data.product + ((data.part == null && data.trashType == null)?"":"의 ")))
                    + ((data.part == null)?"":(data.part + ((data.trashType == null)?"":"의 ")))
                    + ((data.trashType == null)?"":data.trashType) + "의 분리배출 방법을 알려드릴게요~!";
                Bot.say(str);
                console.log(res.topScoringIntent.intent + " > " + res.query + "\t" + str);
                break;
            case "ConfirmHowTo":
                var str = "";
                if((data.product || data.part) && data.trashType) str += ((data.product == null)?"":(data.product + ((data.part == null)?"":"의 ")))
                    + ((data.part == null)?"":data.part) + "은(는) " + data.trashType + "에 버리는 게 맞을까요?";
                else if(data.product && data.part) str += data.product + "은(는) " + data.part + "을(를) 분리해서 버려야 할까요?";
                else if(data.product) str += data.product + "은(는) 분리배출해야 할까요?";
                Bot.say(str);
                console.log(res.topScoringIntent.intent + " > " + res.query + "\t" + str);
                break;
            case "RecycleInfo":
                var str = (data.trashType == null)?"":data.trashType + "은(는) 어떻게 버리는 게 맞을까요?";
                Bot.say(str);
                console.log(res.topScoringIntent.intent + " > " + res.query + "\t" + str);
                break;
            default:
                Bot.say("무슨 말씀이신가요? 이해하지 못했어요 ㅠㅠ");
                console.log(res.topScoringIntent.intent + " > " + res.query + "\t무슨 말씀이신가요? 이해하지 못했어요 ㅠㅠ");
        }
    })
});