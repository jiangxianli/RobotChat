$(function () {

    //图灵配置
    var tuLingApi = {
        "key": "e8c63383ee0a4dd2a9e928331aafb82f",
        "url": "http://www.tuling123.com/openapi/api"
    };

    var text2AudioApi = {
        //"url": "http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=2&text="
        "url": "https://ai.baidu.com/aidemo?type=tns2&idx=1&tex=%s&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=5&per=4&vol=5&pit=5"
    };
    //对话容器
    var chatContainer = $('.chat-container');

    var app = {};
    var util = {};
    var localDatabase = {};
    var dateFormat = {
        format: function (format) {
            var date = new Date();
            var format_arr = {
                "Y": date.getFullYear(),
                "m": date.getMonth() + 1,
                "d": date.getDate(),
                "H": date.getHours(),
                "i": date.getMinutes(),
                "s": date.getSeconds(),
            };
            $.each(format_arr, function (i, item) {
                format = format.replace(i, item)
            });
            return format;
        },
    }

    localDatabase = {
        db: {},
        openDatabase: function (db, version, name, size) {
            this.db = openDatabase(db, version, name, size);
        },
        getDatabase: function () {
            return this.db;
        },
        createTable: function (table_name, columns) {
            var db = this.getDatabase();
            if (!db) {
                return;
            }
            var sql = 'create table if not exists ' + table_name + '(';
            var arr = [];
            $.each(columns, function (i, item) {
                arr.push(' ' + item.name + ' ' + item.type + ' ' + item.default);
            });
            sql += arr.join(',');
            sql += ');';
            db.transaction(function (trans) {
                trans.executeSql(sql);
            });
        },
        insertData: function (table_name, columns, values) {
            var db = this.getDatabase();
            if (!db) {
                return;
            }

            var arr = [];
            for (var i = 0; i < columns.length; i++) {
                arr.push('?');
            }
            var sql = 'insert into ' + table_name + '(' + columns.join(',') + ' ) values (' + arr.join(',') + ')';
            db.transaction(function (trans) {
                trans.executeSql(sql, values);
            });
        },
        getData: function (table_name, callback) {
            var db = this.getDatabase();
            if (!db) {
                return;
            }

            var sql = 'select * from ' + table_name;
            db.transaction(function (trans) {
                trans.executeSql(sql, [], callback);
            });
        }
    };

    util = {
        sprintf: function () {
            var arg = arguments,
                str = arg[0] || '',
                i, n;
            for (i = 1, n = arg.length; i < n; i++) {
                str = str.replace(/%s/, arg[i]);
            }
            return str;
        }
    };

    var tuLingChat = {
        showChat: function (response) {
            if (response.code == 200000) {
                this.linkChat(response);
            } else if (response.code == 302000) {
                this.newsChat(response);
            }
        },
        linkChat: function (response) {
            var content = '<a href="' + response.url + '">点击链接查看哦~ </a>';
            app.rendChatTemplate(content, 'robot', false, true);
        },
        newsChat: function (response) {
            var content = '<ul>';
            $.each(response.list, function (i, item) {
                content += '<li><a href="' + item.detailurl + '">【' + item.source + '】' + item.article + '</a> </li>'
            });
            content += '</ul>';
            app.rendChatTemplate(content, 'robot', false, true);
        }

    };

    app = {
        init: function () {
            //初始化数据库
            this.initDatabase();
            //聊天窗口自适应高度
            this.windowAutoHeight();
            //
            this.sendChatContentClickFun();
            //历史消息
            this.historyChatMsg();
            //每日一语
            this.dailySentence();
        },
        initDatabase: function () {
            localDatabase.openDatabase('chat', 'v1', '陪聊', 1024 * 1024);
            localDatabase.createTable('chat_section', [
                {"name": "chatter", "type": "text", "default": "null"},
                {"name": "content", "type": "text", "default": "null"},
                {"name": "time", "type": "text", "default": "null"},
                {"name": "face", "type": "text", "default": "null"},
            ]);
        },
        saveChatMsg: function (columns, values) {
            localDatabase.insertData('chat_section', columns, values);
        },
        historyChatMsg: function () {
            var _this = this;
            localDatabase.getData('chat_section', function (ts, data) {
                $.each(data.rows, function (i, item) {
                    _this.rendChatTemplate(item.content, item.chatter, false, false);
                });
            });
        },
        dailySentence: function () {
            var _this = this;
           setTimeout(function(){
               var key = 'daily_sentence_' + dateFormat.format('Ymd');
               if (localStorage.getItem(key)) {
                   return;
               }
               var sentence = [
                   "我们来聊聊吧!说出你的故事",
                   "好的开始,好的结束!",
                   "我们要做永远的好朋友!",
                   "谈个心交个朋友吧!",
                   "来日方长,后会有期!",
                   "隐约感觉到你的剑气!",
                   "来无影去无踪,哈哈就是我!"
               ];
               var week = new Date().getDay();
               _this.rendChatTemplate(sentence[week], 'robot', true, true);
               localStorage.setItem(key, sentence[week]);
           },1500)

        },
        //聊天窗口自适应高度
        windowAutoHeight: function () {
            var autoHeight = function () {
                var windowHeight = $(window).height();
                var height = windowHeight - $('.head-title').height() - $('.chat-input').height();
                $('.chat-container').css({'height': height + 'px'});
            };
            autoHeight();
            //当浏览器大小变化时
            $(window).resize(function () {
                autoHeight();
            });
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
            var face = (chatter == "robot" ? "./img/hacker.png" : "./img/customer.png");
            return face;
        },
        rendChatTemplate: function (content, chatter, text2audio, savedb) {
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
            if (savedb == true) {
                this.saveChatMsg(['chatter', 'content', 'time', 'face'], [chatter, content, dateFormat.format('YmdHis'), face])
            }
        },
        tuLingChat: function (content, type) {
            var _this = this;
            $.ajax({
                url: tuLingApi.url,
                method: "POST",
                data: {key: tuLingApi.key, info: content, user_id: this.getUserId()},
                success: function (response) {
                    _this.rendChatTemplate(response.text, 'robot', true, true);
                    tuLingChat.showChat(response);
                }
            })
        },
        text2AudioSound: function (text) {
            var url = util.sprintf(text2AudioApi.url, encodeURI(text));
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
                _this.rendChatTemplate(content, 'chat_user', true, true)
                _this.tuLingChat(content, 'chat_user');
                $('input#chat-input').val("")
            });
            $('input#chat-input').keydown(function (e) {
                var e = e || event, keycode = e.which || e.keyCode;
                if (keycode == 13) {
                    $('.send-chat-btn').trigger("click");
                }
            });
        }


    };

    app.init();
});