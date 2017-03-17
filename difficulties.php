<?php
    $GLOBALS['difficulties'] = array(
        0 => 1,
        1 => 2,
        2 => 3,
        3 => 5
    );

    function checkDifficulty($d) {
        return $d >=0 && $d < sizeof($GLOBALS['difficulties']);
    }
?>
