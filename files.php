<?php
$files = array();
for ($dir = opendir('./files'); $file = readdir($dir);) {
	if ($file{0} == '.') continue;
	$files[] = "{path: '/wwg/my/files/$file', name: '$file'}";
}
echo '[' . join(',', $files) . ']';
?>
