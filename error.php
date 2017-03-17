<?php
function error($msg) {
    session_unset();
    session_destroy();
    return array('nextAction' => 'error',
                 'errorMessage' => $msg);
}
?>
