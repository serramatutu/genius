<?php
    define("MAX_INACTIVE", 300); // Máximo de 5 minutos de inatividade
    session_start();

    if (isset($_SESSION['LAST_ACTIVITY']) && time() - $_SESSION['LAST_ACTIVITY'] > MAX_INACTIVE) {
        session_unset();
        session_destroy();
        session_start();
    }

    require_once('difficulties.php');
    require_once('error.php');

    define("BUTTON_TIME", 500);

    $validRequest = false;
    $ret = array();
    if (isset($_POST['request'])) {
        switch($_POST['request']) {
            case 'color':
                $validRequest = true;

                // O click não foi dado, então não pode exibir as cores
                if (!isset($_SESSION['colorgiver'])) {
                    $ret['nextAction'] = 'click';
                    break;
                }

                // Remove o 'colorgiver' se terminarem as cores a serem enviadas
                if ($_SESSION['colorgiver']['index'] >= sizeof($_SESSION['colors'])) {
                    $ret['nextAction'] = 'click';
                    unset($_SESSION['colorgiver']);
                    break;
                }

                $ret['nextAction'] = 'color';

                $ret['actionObject'] = array(
                    'color' => $_SESSION['colors'][ $_SESSION['colorgiver']['index'] ],
                    'time' => BUTTON_TIME
                );
                $_SESSION['colorgiver']['index']++;

                $_SESSION['colorgiver']['lastrequest'] = time();
                break;

            case 'click':
                $validRequest = true;

                // Se o jogo não está rodando
                if (!isset($_SESSION['gamerunning']) || $_SESSION['gamerunning'] == false) {
                    $ret['nextAction'] = 'donothing';
                    break;
                }

                // Se está exibindo as cores
                if (isset($_SESSION['colorgiver'])) {
                    $ret['nextAction'] = 'donothing';
                    break;
                }

                // Se a cor atribuída ao botão for inválida
                if ($_POST['value'] < 0 || $_POST['value'] > 3) {
                    $ret = error('Cor inválida.');
                    break;
                }

                // Finalmente se o click é válido:
                if (!isset($_SESSION['clickindex']))
                    $_SESSION['clickindex'] = 0;

                // Se é o resultado errado
                if ($_POST['value'] != $_SESSION['colors'][$_SESSION['clickindex']]) {
                    $ret['nextAction'] = 'die';
                    $ret['actionObject'] = array(
                        'sequenceSize' => sizeof($_SESSION['colors']),
                        'score' => $_SESSION['points'],
                        'difficulty' => $_SESSION['difficulty']
                    );
                    $_SESSION['gamerunning'] = false;
                    unset($_SESSION['clickindex']);
                    break;
                }

                $_SESSION['clickindex']++;
                if ($_SESSION['clickindex'] >= sizeof($_SESSION['colors'])) {
                    unset($_SESSION['clickindex']);
                    $_SESSION['points']++;

                    $_SESSION['colorgiver'] = array('index' => 1,
                                                    'lastrequest' => time());
                    $ret['nextAction'] = 'color';
                    $ret['actionObject'] = array(
                        'color' => $_SESSION['colors'][0],
                        'time' => BUTTON_TIME
                    );
                    for ($i = 0; $i < $GLOBALS['difficulties'][$_SESSION['difficulty']]; $i++) {
                        array_push($_SESSION['colors'], rand(0, 3));
                    }
                }
                else
                    $ret['nextAction'] = 'click';

                break;

            case 'startgame':
                $validRequest = true;

                if (checkDifficulty($_POST['value'])) {
                    unset($_SESSION['colorgiver']);
                    unset($_SESSION['clickindex']);
                    $_SESSION['difficulty'] = $_POST['value'];
                    $_SESSION['gamerunning'] = true;
                    $_SESSION['points'] = 0;

                    $_SESSION['colors'] = array();
                    for ($i = 0; $i < $GLOBALS['difficulties'][$_SESSION['difficulty']]; $i++)
                        array_push($_SESSION['colors'], rand(0, 3));

                    $ret['actionObject'] = array(
                        'color' => $_SESSION['colors'][0],
                        'time' => BUTTON_TIME
                    );

                    $_SESSION['colorgiver'] = array('index' => 1,
                        'lastrequest' => time()
                    );

                    $ret['nextAction'] = 'color';
                }
                else
                    $ret = error('Dificuldade inválida');
        }
    }

    if ($validRequest) {
        $_SESSION['LAST_ACTIVITY'] = time();
        header('Content-Type: application/json');
        echo json_encode($ret);
    }
    else {
        include_once('bait.html');
    }

    // REQUESTS: color, click, startgame
    // AÇÕES: color, click, error, donothing, die
?>
