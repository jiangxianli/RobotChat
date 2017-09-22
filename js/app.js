$(function () {

    //图灵配置
    var tuLingApi = {
        "key": "e8c63383ee0a4dd2a9e928331aafb82f",
        "url": "http://www.tuling123.com/openapi/api"
    };

    var text2AudioApi = {
        "url": "http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=2&text="
    };
    //对话容器
    var chatContainer = $('.chat-container');

    var app = {};

    var tuLingChat = {
        showChat: function (response) {
            if (response.code == 200000) {
                this.linkChat(response);
            } else if (response.code == 302000) {
                this.newsChat(response);
            }
        },
        linkChat: function (response) {
            var content = '<a href="' + response.url + '">' + response.url + '</a>';
            app.rendChatTemplate(content, 'robot', false);
        },
        newsChat: function (response) {
            var content = '<ul>';
            $.each(response.list, function (i, item) {
                content += '<li><a href="' + item.detailurl + '">【' + item.source + '】' + item.article + '</a> </li>'
            });
            content += '</ul>';
            app.rendChatTemplate(content, 'robot', false);
        }

    };

    app = {
        init: function () {
            //聊天窗口自适应高度
            this.windowAutoHeight();
            //
            this.sendChatContentClickFun();
        },
        //聊天窗口自适应高度
        windowAutoHeight: function () {
            var windowHeight = $(window).height();
            var height = windowHeight - $('.head-title').height();
            $('.chat-container').css({'height': height + 'px'});
        },
        getUserId: function () {
            var uuid = localStorage.getItem("uuid");
            if (uuid) {
                return uuid;
            }
            uuid = Math.uuid();
            localStorage.setItem("uuid", uuid);
            return uuid;
        },
        getFaceUrl: function (chatter) {
            return "http://user.service.gushi.com/face/99e2c6bec85380d86a0e0d40c69fe6cf.jpg";
            var face = chatter == "robot" ? "" : "";
            return face;
        },
        rendChatTemplate: function (content, chatter, text2audio) {
            var robot = chatter == "robot" ? 1 : 0;
            var face = this.getFaceUrl(chatter);
            var html = '<div class="chat-section ' + (robot == 1 ? '' : ' chat-right') + '">\
                    <img src="' + face + '"/>\
                    <div class="chat-content">' + content + '</div>\
               </div>';
            chatContainer.append(html).scrollTop(chatContainer.get(0).scrollHeight);
            if (robot == 1 && text2audio == true) {
                this.text2AudioSound(content);
            }
        },
        tuLingChat: function (content, type) {
            var _this = this;
            $.ajax({
                url: tuLingApi.url,
                method: "POST",
                data: {key: tuLingApi.key, info: content, user_id: this.getUserId()},
                success: function (response) {
                    _this.rendChatTemplate(response.text, 'robot', true);
                    tuLingChat.showChat(response);
                }
            })
        },
        text2AudioSound: function (text) {
            var url = text2AudioApi.url + encodeURI(text);
            var audio = new Audio(url);
            audio.currentTime = 0;
            audio.play();
            var play = function () {
                audio.play();
                document.removeEventListener("touchstart", play, false);
            };
            document.addEventListener("WeixinJSBridgeReady", function () {
                play();
            }, false);
            document.addEventListener("touchstart", play, false);
        },
        sendChatContentClickFun: function () {
            var _this = this;
            $('.send-chat-btn').on('click', function () {
                var content = $('input#chat-input').val();
                if (content == "") {
                    return;
                }
                _this.rendChatTemplate(content, 'chat_user', true)
                _this.tuLingChat(content, 'chat_user');
                $('input#chat-input').val("")
            })
        }


    };

    app.init();
});