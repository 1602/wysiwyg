<?php

if ($_FILES) {
	move_uploaded_file($_FILES["picture"]["tmp_name"], "./files/" . $_FILES["picture"]["name"]);
	echo "/wwg/my/files/" . $_FILES["picture"]["name"];
}

?>
