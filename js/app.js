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

    var app = {
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

        },
        getFaceUrl: function (chatter) {
            return "http://user.service.gushi.com/face/99e2c6bec85380d86a0e0d40c69fe6cf.jpg";
            var face = chatter == "robot" ? "" : "";
            return face;
        },
        rendChatTemplate: function (content, chatter) {
            var robot = chatter == "robot" ? 1 : 0;
            var face = this.getFaceUrl(chatter);
            var html = '<div class="chat-section ' + (robot == 1 ? '' : ' chat-right') + '">\
                    <img src="' + face + '"/>\
                    <div class="chat-content">' + content + '</div>\
               </div>';
            chatContainer.append(html);
            if (robot == 1) {
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
                    _this.rendChatTemplate(response.text, 'robot');
                }
            })
        },
        text2AudioSound: function (text) {
            var url = text2AudioApi.url + encodeURI(text);
            var audio = new Audio(url);
            audio.currentTime = 0;
            audio.play();
        },
        sendChatContentClickFun: function () {
            var _this = this;
            $('.send-chat-btn').on('click', function () {
                var content = $('input#chat-input').val();
                if (content == "") {
                    return;
                }
                _this.rendChatTemplate(content, 'chat_user')
                _this.tuLingChat(content, 'chat_user');
                $('input#chat-input').val("")
            })
        }


    };

    app.init();
});