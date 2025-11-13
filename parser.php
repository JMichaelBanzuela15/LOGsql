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

$results = [];

if ($mode === 'wallet') {
    // ========== DIGIPEP WALLET PARSER ==========
    $lines = explode("\n", $raw);
    
    foreach ($lines as $line) {
        if (stripos($line, 'CREATE DIGIPEP WALLET') === false) {
            continue;
        }

        $timestamp = '';
        if (preg_match("/\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]/", $line, $tsMatch)) {
            $timestamp = $tsMatch[1];
        }

        $contactFromLog = '';
        if (preg_match("/\((\d{11})/", $line, $contactMatch)) {
            $contactFromLog = $contactMatch[1];
        }

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
    // ========== SQL LOGS PARSER - PARSE ALL LOG TYPES ==========
    
    // Split by >>>>> markers to get individual log entries
    $entries = preg_split('/(?=>{5}\s+\d{4}-\d{2}-\d{2})/', $raw, -1, PREG_SPLIT_NO_EMPTY);
    
    foreach ($entries as $entry) {
        if (trim($entry) === '' || trim($entry) === '--') continue;
        
        // Extract timestamp
        $timestamp = '';
        if (preg_match('/>{5}\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\s*(?:AM|PM))?)/', $entry, $dateMatch)) {
            $timestamp = $dateMatch[1];
        }
        
        // Extract log type and module
        $logType = 'Unknown';
        if (preg_match('/\|\s+([^\s]+(?:\s+>\s+[^\s]+)*)\s+---\s+WARNING/', $entry, $typeMatch)) {
            $logType = $typeMatch[1];
        }
        
        // Determine base status
        $statusText = 'Info';
        $statusColor = 'blue';
        
        if (stripos($entry, 'Deadlock') !== false) {
            $statusText = 'Deadlock';
            $statusColor = 'orange';
        } elseif (stripos($entry, 'operation failed') !== false || stripos($entry, 'ERROR') !== false) {
            $statusText = 'Failed';
            $statusColor = 'red';
        } elseif (stripos($entry, 'Accepted') !== false || stripos($entry, 'Success') !== false || stripos($entry, 'successful') !== false) {
            $statusText = 'Accepted';
            $statusColor = 'green';
        }
        
        // TYPE 1: SQL CALL Transactions
        if (stripos($entry, 'CALL sp_instapayInwardTransactionMerchant') !== false) {
            if (preg_match("/'(\{[^}]+\})'/", $entry, $jsonMatch)) {
                $jsonStr = $jsonMatch[1];
                $jsonStr = str_replace('\"', '"', $jsonStr);
                $data = json_decode($jsonStr, true);
                
                if ($data) {
                    $results[] = [
                        'Date' => $timestamp,
                        'Status' => $statusText,
                        'Color' => $statusColor,
                        'InstrId' => $data['InstrId'] ?? '',
                        'TxId' => $data['TxId'] ?? '',
                        'Amount' => $data['IntrBkSttlmAmt'] ?? '',
                        'CdtrNm' => $data['CdtrNm'] ?? '',
                        'CdtrAcctId' => $data['CdtrAcctId'] ?? '',
                        'DbtrNm' => $data['DbtrNm'] ?? '',
                        'DbtrAcctId' => $data['DbtrAcctId'] ?? '',
                        'TxSts' => $data['TxSts'] ?? '',
                        'Rsn' => $data['Rsn'] ?? '',
                        'MrchntCtgyCd' => $data['MrchntCtgyCd'] ?? '',
                        'MsgId' => $data['MsgId'] ?? ''
                    ];
                    continue;
                }
            }
        }
        
        // TYPE 2: API Inward XML Data
        if (stripos($entry, 'APILog: Inward XML Data:') !== false) {
            if (preg_match("/APILog: Inward XML Data:\s*\{(.+?)\}/s", $entry, $dataMatch)) {
                $dictStr = '{' . $dataMatch[1] . '}';
                
                $fields = [];
                if (preg_match("/'InstrId':\s*'([^']+)'/", $dictStr, $m)) $fields['InstrId'] = $m[1];
                if (preg_match("/'TxId':\s*'([^']+)'/", $dictStr, $m)) $fields['TxId'] = $m[1];
                if (preg_match("/'IntrBkSttlmAmt':\s*'([^']+)'/", $dictStr, $m)) $fields['Amount'] = $m[1];
                if (preg_match("/'CdtrNm':\s*'([^']+)'/", $dictStr, $m)) $fields['CdtrNm'] = $m[1];
                if (preg_match("/'CdtrAcctId':\s*'([^']+)'/", $dictStr, $m)) $fields['CdtrAcctId'] = $m[1];
                if (preg_match("/'DbtrNm':\s*'([^']+)'/", $dictStr, $m)) $fields['DbtrNm'] = $m[1];
                if (preg_match("/'DbtrAcctId':\s*'([^']+)'/", $dictStr, $m)) $fields['DbtrAcctId'] = $m[1];
                if (preg_match("/'TxSts':\s*'([^']+)'/", $dictStr, $m)) $fields['TxSts'] = $m[1];
                if (preg_match("/'Rsn':\s*'([^']+)'/", $dictStr, $m)) $fields['Rsn'] = $m[1];
                if (preg_match("/'MrchntCtgyCd':\s*'([^']+)'/", $dictStr, $m)) $fields['MrchntCtgyCd'] = $m[1];
                if (preg_match("/'MsgId':\s*'([^']+)'/", $dictStr, $m)) $fields['MsgId'] = $m[1];
                
                if (!empty($fields)) {
                    $results[] = [
                        'Date' => $timestamp,
                        'Status' => $statusText,
                        'Color' => $statusColor,
                        'InstrId' => $fields['InstrId'] ?? '',
                        'TxId' => $fields['TxId'] ?? '',
                        'Amount' => $fields['Amount'] ?? '',
                        'CdtrNm' => $fields['CdtrNm'] ?? '',
                        'CdtrAcctId' => $fields['CdtrAcctId'] ?? '',
                        'DbtrNm' => $fields['DbtrNm'] ?? '',
                        'DbtrAcctId' => $fields['DbtrAcctId'] ?? '',
                        'TxSts' => $fields['TxSts'] ?? '',
                        'Rsn' => $fields['Rsn'] ?? '',
                        'MrchntCtgyCd' => $fields['MrchntCtgyCd'] ?? '',
                        'MsgId' => $fields['MsgId'] ?? ''
                    ];
                    continue;
                }
            }
        }
        
        // TYPE 3: InstapayISO20022SuccessMessage Data
        if (stripos($entry, 'InstapayISO20022SuccessMessage Data:') !== false) {
            if (preg_match("/InstapayISO20022SuccessMessage Data:\s*\{(.+?)\}/s", $entry, $dataMatch)) {
                $dictStr = '{' . $dataMatch[1] . '}';
                
                $fields = [];
                if (preg_match("/'InstrId':\s*'([^']+)'/", $dictStr, $m)) $fields['InstrId'] = $m[1];
                if (preg_match("/'TxId':\s*'([^']+)'/", $dictStr, $m)) $fields['TxId'] = $m[1];
                if (preg_match("/'IntrBkSttlmAmt':\s*'([^']+)'/", $dictStr, $m)) $fields['Amount'] = $m[1];
                if (preg_match("/'CdtrNm':\s*'([^']+)'/", $dictStr, $m)) $fields['CdtrNm'] = $m[1];
                if (preg_match("/'CdtrAcctId':\s*'([^']+)'/", $dictStr, $m)) $fields['CdtrAcctId'] = $m[1];
                if (preg_match("/'DbtrNm':\s*'([^']+)'/", $dictStr, $m)) $fields['DbtrNm'] = $m[1];
                if (preg_match("/'DbtrAcctId':\s*'([^']+)'/", $dictStr, $m)) $fields['DbtrAcctId'] = $m[1];
                if (preg_match("/'TxSts':\s*'([^']+)'/", $dictStr, $m)) $fields['TxSts'] = $m[1];
                if (preg_match("/'Rsn':\s*'([^']+)'/", $dictStr, $m)) $fields['Rsn'] = $m[1];
                if (preg_match("/'MrchntCtgyCd':\s*'([^']+)'/", $dictStr, $m)) $fields['MrchntCtgyCd'] = $m[1];
                if (preg_match("/'MsgId':\s*'([^']+)'/", $dictStr, $m)) $fields['MsgId'] = $m[1];
                
                if (!empty($fields)) {
                    $results[] = [
                        'Date' => $timestamp,
                        'Status' => 'Success Message',
                        'Color' => 'green',
                        'InstrId' => $fields['InstrId'] ?? '',
                        'TxId' => $fields['TxId'] ?? '',
                        'Amount' => $fields['Amount'] ?? '',
                        'CdtrNm' => $fields['CdtrNm'] ?? '',
                        'CdtrAcctId' => $fields['CdtrAcctId'] ?? '',
                        'DbtrNm' => $fields['DbtrNm'] ?? '',
                        'DbtrAcctId' => $fields['DbtrAcctId'] ?? '',
                        'TxSts' => $fields['TxSts'] ?? '',
                        'Rsn' => $fields['Rsn'] ?? '',
                        'MrchntCtgyCd' => $fields['MrchntCtgyCd'] ?? '',
                        'MsgId' => $fields['MsgId'] ?? ''
                    ];
                    continue;
                }
            }
        }
        
        // TYPE 4: CallFunction (QR Generation)
        if (stripos($entry, 'CallFuntion:') !== false || stripos($entry, 'CallFunction:') !== false) {
            if (preg_match("/\{(.+?)\}/s", $entry, $dataMatch)) {
                $dictStr = '{' . $dataMatch[1] . '}';
                
                $merchantId = '';
                $txnamt = '';
                $merchantName = '';
                
                if (preg_match("/'merchantId':\s*'([^']+)'/", $dictStr, $m)) $merchantId = $m[1];
                if (preg_match("/'txnamt':\s*'([^']+)'/", $dictStr, $m)) $txnamt = $m[1];
                if (preg_match("/'merchantName':\s*'([^']+)'/", $dictStr, $m)) $merchantName = $m[1];
                
                if ($merchantId || $txnamt) {
                    $results[] = [
                        'Date' => $timestamp,
                        'Status' => 'QR Request',
                        'Color' => 'blue',
                        'InstrId' => $merchantId,
                        'TxId' => '',
                        'Amount' => $txnamt,
                        'CdtrNm' => $merchantName,
                        'CdtrAcctId' => '',
                        'DbtrNm' => '',
                        'DbtrAcctId' => '',
                        'TxSts' => '',
                        'Rsn' => 'QR Generation',
                        'MrchntCtgyCd' => '',
                        'MsgId' => ''
                    ];
                    continue;
                }
            }
        }
        
        // TYPE 5: P2M Generate QR
        if (stripos($entry, 'P2M Generate QR Data:') !== false || stripos($entry, 'P2M QR Return:') !== false) {
            $results[] = [
                'Date' => $timestamp,
                'Status' => 'QR Generated',
                'Color' => 'blue',
                'InstrId' => '',
                'TxId' => '',
                'Amount' => '',
                'CdtrNm' => '',
                'CdtrAcctId' => '',
                'DbtrNm' => '',
                'DbtrAcctId' => '',
                'TxSts' => '',
                'Rsn' => 'QR Code Created',
                'MrchntCtgyCd' => '',
                'MsgId' => ''
            ];
            continue;
        }
        
        // TYPE 6: Other WARNING logs (callbacks, queries, etc.)
        if (stripos($entry, 'WARNING') !== false && trim($entry) !== '--') {
            $results[] = [
                'Date' => $timestamp,
                'Status' => 'System Log',
                'Color' => 'gray',
                'InstrId' => '',
                'TxId' => '',
                'Amount' => '',
                'CdtrNm' => '',
                'CdtrAcctId' => '',
                'DbtrNm' => '',
                'DbtrAcctId' => '',
                'TxSts' => '',
                'Rsn' => $logType,
                'MrchntCtgyCd' => '',
                'MsgId' => ''
            ];
        }
    }
}

echo json_encode($results);
?>