<?php
header('Content-Type: application/json');

if (isset($_FILES['logfile'])) {
    $raw = file_get_contents($_FILES['logfile']['tmp_name']);
} elseif (isset($_POST['logs'])) {
    $raw = $_POST['logs'];
} else {
    echo json_encode(['error' => 'No logs received.']);
    exit;
}

$lines = explode("\n", $raw);
$results = [];

foreach ($lines as $line) {
    if (preg_match("/CALL sp_instapayInwardTransactionMerchant/", $line)) {
        // Extract date - handles both "2025-11-03 04:03:22" and "2025-11-03 04:03:22 AM"
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

echo json_encode($results);
?>