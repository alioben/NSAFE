<?php
session_start();
$return = array();
$return["success"] = true;
$return["error"] = array();
if(empty($_POST["f"])) {
    $return["error"][] = "No function specified.";
    $return["success"] = false;
    goto printResult;
}
$f = $_POST['f'];
$return = '';
$endpoint = 'http://50.116.48.206:3000/api/';
switch($f){
	case "doSomeML":
	case "nextBus":
	case "trafficData":
		$endpoint = $endpoint.$f;
		unset($_POST['f']);
		$return = json_decode(getURL($endpoint, $_POST));
		break;
}


function getURL($url, $params){
		$fields_string = null;
		//url-ify the data for the POST
		$fields_string = http_build_query($params, $fields_string);
		
		//open connection
		$ch = curl_init();

		
		//set the url, number of POST vars, POST data
		curl_setopt($ch,CURLOPT_URL, $url);
		curl_setopt($ch,CURLOPT_POST, 1);
		curl_setopt($ch,CURLOPT_POSTFIELDS, $fields_string);

		$result = curl_exec($ch);
	    //close connection
		curl_close($ch);
		return $result;
}

printResult:

?>