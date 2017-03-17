'use strict';

$(document).ready(function() {

    // ------- COLOR -------

    var Color = {
        RED: 0,
        BLUE: 1,
        GREEN: 2,
        YELLOW: 3,

        getString: function(c) {
            switch (c) {
                case this.RED:
                    return 'red';
                case this.BLUE:
                    return 'blue';
                case this.GREEN:
                    return 'green';
                case this.YELLOW:
                    return 'yellow';
            }
        }
    };

    // ------- MANAGER -------

    const BUTTON_INTERVAL = 150;

    var Manager = {
        _clickable: false,
        _difficulty: 0, // Padrão é EASY
        _running: false,
        _sound: false,
        _BUTTON_SHORTCUTS: {
            STARTGAME: '0',
            RED: '4',
            BLUE: '5',
            GREEN: '1',
            YELLOW: '2'
        },

        _request: function(action, value) {
            $.ajax({
                dataType: 'json',
                data: {
                    request: action,
                    value: value
                },
                method: 'POST',
                url: 'genius.php',
                accepts: 'json'
            })
            .fail(function(xhr) {
                Logger.log(xhr.responseText);
            })
            .always(function() {
                Manager.clickable = false;
            })
            .done(function(xhr) {
                xhr = xhr || {};
                xhr.nextAction = xhr.nextAction || 'die';

                switch (xhr.nextAction) {
                    case 'color':
                        var color = Color.getString(xhr.actionObject.color);
                        $('.colorbutton.'+color).addClass('active');

                        setTimeout(function() {
                            $('.colorbutton').removeClass('active');
                            setTimeout(function() {
                                Manager._request('color');
                            }, BUTTON_INTERVAL);
                        }, xhr.actionObject.time - BUTTON_INTERVAL);

                        break;

                    case 'click':
                        Manager.clickable = true;
                        break;

                    case 'die':
                        Manager.die(xhr.actionObject);
                        break;

                    case 'donothing': break;

                    default: // ERRO

                }
            });
        },

        btnClick: function(button) {
            if (this._running && this._clickable) {
                this._request('click', button);

                // Coloca estilo '.active' no botão ativado
                var color = Color.getString(button);

                $(".button.colorbutton."+color).addClass('active');
                setTimeout(function() {
                    $(".button.colorbutton."+color).removeClass('active');
                }, 100);
            }
            else if (!this._running)
                Logger.log('Inicie o jogo antes de clicar!');
        },

        keydown: function(key) {
            var button;
            switch (key) {
                case this._BUTTON_SHORTCUTS.RED:
                    button = Color.RED;
                    break;
                case this._BUTTON_SHORTCUTS.BLUE:
                    button = Color.BLUE;
                    break;
                case this._BUTTON_SHORTCUTS.GREEN:
                    button = Color.GREEN;
                    break;
                case this._BUTTON_SHORTCUTS.YELLOW:
                    button = Color.YELLOW;
                    break;
                case this._BUTTON_SHORTCUTS.STARTGAME:
                    this.startgame();
            }
            if (typeof button == 'number') {
                this.btnClick(button);
            }
        },

        die: function(info) {
            this._running = false;
            Logger.info('Você morreu!');
            Logger.log('Tamanho da sequência: '+info.sequenceSize);
            Logger.log('Sua pontuação: '+info.score);
            this.addCaptions();
        },

        startgame: function() {
            if (!this._running) {
                this._running = true;
                this._request('startgame', this._difficulty);
                $(".button.colorbutton").empty();
                Logger.info("Jogo iniciado. Dificuldade: "+this._difficulty);
            }
            else
                Logger.info("Jogo não pode ser iniciado.");
        },

        addCaptions: function() {
            $(".button.colorbutton.red").html(this._BUTTON_SHORTCUTS.RED);
            $(".button.colorbutton.blue").html(this._BUTTON_SHORTCUTS.BLUE);
            $(".button.colorbutton.green").html(this._BUTTON_SHORTCUTS.GREEN);
            $(".button.colorbutton.yellow").html(this._BUTTON_SHORTCUTS.YELLOW);

            $(".button.startgame").html("start_game ("+this._BUTTON_SHORTCUTS.STARTGAME+")");
        }
    };

    Manager.DIFFICULTY = {
        EASY: 0,
        MEDIUM: 1,
        HARD: 2,
        EXPERT: 3
    };

    Object.defineProperties(Manager, {
        clickable: {
            get: function() {
                return this._clickable;
            },
            set: function(v) {
                if (v == true)
                    $(".colorbutton, .click-informer").addClass("clickable");
                else
                    $(".colorbutton, .click-informer").removeClass("clickable");

                this._clickable = v;
            },
        },
        difficulty: {
            get: function() {
                return this._difficulty;
            },
            set: function(v) {
                if (v >= this.DIFFICULTY.EASY && v <= this.DIFFICULTY.EXPERT)
                    this._difficulty = v;
            }
        },
        sound: {
            get: function() {
                return this._sound;
            },
            set: function(v) {
                if (typeof v === 'boolean') {
                    this._sound = v;
                }
            }
        },
        BUTTON_SHORTCUTS: {
            get: function() {
                return this._BUTTON_SHORTCUTS;
            }
        }
    });

    // ------- LOGGER -------

    var Logger = {
        CLASS: '.container.logger',
        consolelog: false, // se deve ou não exibir no console

        info: function(text) {
            $(this.CLASS).append('<div class="loggertext info">'+text+'</div>');

            if (this.consolelog)
                console.info(text);
        },
        warn: function(text) {
            $(this.CLASS).append('<div class="loggertext warning">'+text+'</div>');

            if (this.consolelog)
                console.warn(text);
        },
        log: function(text) {
            $(this.CLASS).append('<div class="loggertext">'+text+'</div>');

            if (this.consolelog)
                console.log(text);
        },
        clear: function() {
            $(this.CLASS).empty();

            if (this.consolelog)
                console.clear();
        }
    }

    // ------- EVENTOS HTML -------

    $(".colorbutton.red").click(function() {
        Manager.btnClick(Color.RED);
    });
    $(".colorbutton.blue").click(function() {
        Manager.btnClick(Color.BLUE);
    });
    $(".colorbutton.green").click(function() {
        Manager.btnClick(Color.GREEN);
    });
    $(".colorbutton.yellow").click(function() {
        Manager.btnClick(Color.YELLOW);
    });
    $(".button.startgame").click(function() {
        Manager.startgame();
    });

    $(window).keydown(function(e) {
        Manager.keydown(e.key)
    });

    $("#difficulty-selector").on('change', function(e) {
        Manager.difficulty = document.getElementById('difficulty-selector').selectedIndex;
    });

    $("#volume-button").click(function(e) {
        Manager.sound = document.getElementById("volume-button").checked;
    });

    // ------- INICIALIZAÇÃO DO HTML -------
    (function(){
        // Inicializa cores do título
        var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
        $(".header .letter").each(function() {
            let i = Math.floor(Math.random() * colors.length);
            $(this).css('color', colors[i]);
        });

        // Inicializa seletor de dificuldade
        for (var diff in Manager.DIFFICULTY)
            $('#difficulty-selector').append(
                `<option value="${Manager.DIFFICULTY[diff]}">${diff}</option>`
            );
    })();

    Manager.addCaptions();
});
