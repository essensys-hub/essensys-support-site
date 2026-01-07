<?php
/**
 * Essensys Client Collection Script
 * 
 * This script gathers basic information about the client (this RPi)
 * and sends it to the central Essensys server.
 */

// --- Configuration ---
$serverUrl = 'https://essensys.fr/api/serverinfos/index.php'; // Adjust if needed
$user = 'raspberry_pi_client'; // Default user
$key = 'secret_key';           // Default key, should be changed or passed as arg
$version = '1.0.0';            // Client version

// --- Gather Information ---

// Get local IP address (best effort)
$ip = getHostByName(getHostName()); // Basic hostname resolution
// Alternatively, shell_exec("hostname -I | awk '{print $1}'");

// --- Send Data ---

$url = $serverUrl . '?' . http_build_query([
    'user' => $user,
    'key' => $key,
    'version' => $version
]);

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Uncomment if self-signed certs or issues

// Execute the request
$response = curl_exec($ch);

// Check for errors
if (curl_errno($ch)) {
    echo "Error: " . curl_error($ch) . PHP_EOL;
} else {
    // Decode response
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpCode == 200) {
        echo "Success: Server responded with 200 OK." . PHP_EOL;
        echo "Response: " . $response . PHP_EOL;
    } else {
        echo "Warning: Server responded with HTTP Code $httpCode" . PHP_EOL;
        echo "Response: " . $response . PHP_EOL;
    }
}

// Close cURL resource
curl_close($ch);
?>
