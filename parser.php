<?php
header('Content-Type: application/json');

// Get input
if (isset($_FILES['logfile'])) {
    $raw = file_get_contents($_FILES['logfile']['tmp_name']);
} elseif (isset($_POST['logs'])) {
    $raw = $_POST['logs'];
} else {
    echo json_encode(['error' => 'No logs received.']);
    exit;
}

// Get mode (sql or wallet)
$mode = $_POST['mode'] ?? 'sql';

$lines = explode("\n", $raw);
$results = [];

if ($mode === 'wallet') {
    // ========== DIGIPEP WALLET PARSER ==========
    foreach ($lines as $line) {
        if (stripos($line, 'CREATE DIGIPEP WALLET') === false) {
            continue;
        }

        // Extract timestamp [2025-11-10 11:20:30]
        $timestamp = '';
        if (preg_match("/\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]/", $line, $tsMatch)) {
            $timestamp = $tsMatch[1];
        }

        // Extract contact number from the log line (09888881316)
        $contactFromLog = '';
        if (preg_match("/\((\d{11})/", $line, $contactMatch)) {
            $contactFromLog = $contactMatch[1];
        }

        // Manual extraction using regex (works even with huge base64 data)
        $fields = [];
        
        if (preg_match('/"wallet_contact_number":"([^"]+)"/', $line, $m)) {
            $fields['ContactNumber'] = $m[1];
        }
        if (preg_match('/"wallet_first_name":"([^"]+)"/', $line, $m)) {
            $fields['FirstName'] = $m[1];
        }
        if (preg_match('/"wallet_last_name":"([^"]+)"/', $line, $m)) {
            $fields['LastName'] = $m[1];
        }
        if (preg_match('/"wallet_birthday":"([^"]+)"/', $line, $m)) {
            $fields['Birthday'] = $m[1];
        }
        if (preg_match('/"wallet_birth_place":"([^"]+)"/', $line, $m)) {
            $fields['BirthPlace'] = $m[1];
        }
        if (preg_match('/"gender":"?([^",}]+)"?/', $line, $m)) {
            $fields['Gender'] = $m[1];
        }
        if (preg_match('/"wallet_nationality":(\d+)/', $line, $m)) {
            $fields['Nationality'] = $m[1];
        }
        if (preg_match('/"wallet_present_address_details":"([^"]+)"/', $line, $m)) {
            $fields['Address'] = $m[1];
        }

        if (!empty($fields)) {
            $results[] = [
                'Timestamp' => $timestamp,
                'ContactNumber' => $fields['ContactNumber'] ?? $contactFromLog,
                'FirstName' => $fields['FirstName'] ?? '',
                'LastName' => $fields['LastName'] ?? '',
                'Birthday' => $fields['Birthday'] ?? '',
                'BirthPlace' => $fields['BirthPlace'] ?? '',
                'Gender' => $fields['Gender'] ?? '',
                'Nationality' => $fields['Nationality'] ?? '',
                'Address' => $fields['Address'] ?? ''
            ];
        }
    }
} else {
    // ========== SQL LOGS PARSER ==========
    foreach ($lines as $line) {
        if (preg_match("/CALL sp_instapayInwardTransactionMerchant/", $line)) {
            // Extract date
            preg_match("/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\s*(?:AM|PM))?)/", $line, $date);
            
            // Determine status
            preg_match("/Deadlock|operation failed|Accepted/i", $line, $status);

            $statusText = isset($status[0]) ? ucfirst(strtolower($status[0])) : 'Unknown';
            $statusColor = match (true) {
                stripos($statusText, 'Accepted') !== false => 'green',
                stripos($statusText, 'Deadlock') !== false => 'orange',
                stripos($statusText, 'failed') !== false => 'red',
                default => 'gray'
            };

            // Extract JSON data
            if (preg_match("/'(\{[^}]+\})'/", $line, $jsonMatch)) {
                $jsonStr = $jsonMatch[1];
                $data = json_decode($jsonStr, true);
                
                if ($data) {
                    $results[] = [
                        'Date' => $date[1] ?? '',
                        'Status' => $statusText,
                        'Color' => $statusColor,
                        'InstrId' => $data['InstrId'] ?? '',
                        'TxId' => $data['TxId'] ?? '',
                        'CdtrAcctId' => $data['CdtrAcctId'] ?? '',
                        'DbtrNm' => $data['DbtrNm'] ?? '',
                        'DbtrAcctId' => $data['DbtrAcctId'] ?? '',
                        'TxSts' => $data['TxSts'] ?? '',
                        'Rsn' => $data['Rsn'] ?? '',
                        'MrchntCtgyCd' => $data['MrchntCtgyCd'] ?? ''
                    ];
                    continue;
                }
            }
            
            // Fallback for non-JSON format
            preg_match("/'InstrId':\\s*'([^']+)'/", $line, $instr);
            preg_match("/'TxId':\\s*'([^']+)'/", $line, $txid);
            preg_match("/'CdtrAcctId':\\s*'([^']+)'/", $line, $cdtrAcct);
            preg_match("/'DbtrNm':\\s*'([^']+)'/", $line, $dbtrNm);
            preg_match("/'DbtrAcctId':\\s*'([^']+)'/", $line, $dbtrAcct);
            preg_match("/'TxSts':\\s*'([^']+)'/", $line, $txsts);
            preg_match("/'Rsn':\\s*'([^']+)'/", $line, $rsn);
            preg_match("/'MrchntCtgyCd':\\s*'([^']+)'/", $line, $mcc);

            $results[] = [
                'Date' => $date[1] ?? '',
                'Status' => $statusText,
                'Color' => $statusColor,
                'InstrId' => $instr[1] ?? '',
                'TxId' => $txid[1] ?? '',
                'CdtrAcctId' => $cdtrAcct[1] ?? '',
                'DbtrNm' => $dbtrNm[1] ?? '',
                'DbtrAcctId' => $dbtrAcct[1] ?? '',
                'TxSts' => $txsts[1] ?? '',
                'Rsn' => $rsn[1] ?? '',
                'MrchntCtgyCd' => $mcc[1] ?? ''
            ];
        }
    }
}

echo json_encode($results);
?>