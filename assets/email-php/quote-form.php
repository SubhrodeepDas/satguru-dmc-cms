<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$fname       = trim($_POST['first_name']   ?? '');
$lname       = trim($_POST['last_name']    ?? '');
$phone       = trim($_POST['phone']        ?? '');
$email       = trim($_POST['email']        ?? '');
$country     = trim($_POST['country']      ?? '');
$region      = trim($_POST['region']       ?? '');
$date_from   = trim($_POST['date_from']    ?? '');
$date_to     = trim($_POST['date_to']      ?? '');
$adults      = trim($_POST['adults']       ?? '');
$children    = trim($_POST['children']     ?? '');
$holiday     = trim($_POST['holiday_pref'] ?? '');
$comments    = trim($_POST['comments']     ?? '');

if (!$fname || !$lname || !$phone || !$email || !$country) {
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields.']);
    exit;
}

$mail = new PHPMailer(true);
try {
    $mail->SMTPDebug  = 0;
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'pixel.hosted@gmail.com';
    $mail->Password   = getenv('SMTP_PASS') ?: 'SET_SMTP_APP_PASSWORD';
    $mail->SMTPSecure = 'ssl';
    $mail->Port       = 465;

    $mail->setFrom('pixel.hosted@gmail.com', 'Satguru DMC Russia');
    $mail->addAddress('inbound.russia@satgurutravel.com');
    $mail->isHTML(true);
    $mail->Subject = 'Satguru DMC | Quote Request from ' . $fname . ' ' . $lname;
    $mail->Body = '
        <h2 style="color:#114349;">Satguru DMC Russia — Quote Request</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">First Name</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($fname) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Last Name</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($lname) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($phone) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($email) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Country</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($country) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Region To Visit</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($region) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Travel From</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($date_from) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Travel To</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($date_to) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Adults</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($adults) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Children</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($children) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Holiday Preference</td><td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($holiday) . '</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Comments</td><td style="padding:8px;border:1px solid #ddd;">' . nl2br(htmlspecialchars($comments)) . '</td></tr>
        </table>
    ';

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Message could not be sent. Please try again.']);
}
