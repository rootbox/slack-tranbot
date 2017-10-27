const RtmClient = require('slack-client').RtmClient,
  WebClient = require('slack-client').WebClient,
  RtmEvent = require('slack-client').RTM_EVENTS,
  request = require('request'),
  KEYS = require('./key.json');

const web = new WebClient(KEYS.TOKEN),
  rtm = new RtmClient(KEYS.TOKEN, { logLevel: "error" });

const requestOptions = {
  // url: "https://openapi.naver.com/v1/language/translate",
  url: "https://openapi.naver.com/v1/papago/n2mt",
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Naver-Client-Id": KEYS.CLIENTID,
    "X-Naver-Client-Secret": KEYS.CLIENTSECRET
  }
};

const allowedChannels = [
  "G7PGF1000",
  "C7RS5M6G7"
];

const initialize = () => {
  rtm.start();
  rtm.on(RtmEvent.MESSAGE, function(message) {
    let lang = "ko";

    const channel = message.channel,
      user = message.user,
      text = message.text,
      matched = text && typeof text === "string" && text.match(/^\&lt;(번역|translate)\&gt;\s(.*)?$/i) || null;

    if(!allowedChannels.includes(channel) || !matched || !matched[1] || !matched[2]) return;

    switch(matched[1]) {
      case "번역":
        lang = "ko";
        break;
      case "Translate":
      case "translate":
        lang = "en";
        break;
      default: break;
    }

    getTranslated(lang, matched[2], (source, translated) => {
      web.chat.postMessage(channel, source + "\n => " + translated, { username: "도란스봇" }, function(response, error) {
        console.log(response, error);
      });
    });
  });
};

const getTranslated = (lang, sourceText, callback) => {
  if(sourceText.trim() === "") return;

  requestOptions["form"] = {
    "source": lang,
    "target": (lang === "ko") ? "en" : "ko",
    "text": sourceText.trim()
  };

  request.post(requestOptions, function(error, response, body) {
    if(!response || response.statusCode !== 200 || !body) return;

    const content = JSON.parse(body),
      message = content["message"],
      result = message && message["result"],
      translated = result && result["translatedText"];

    callback(sourceText, translated);
  });
}

initialize();
