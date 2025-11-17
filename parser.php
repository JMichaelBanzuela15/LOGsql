<?php
// Start output buffering to catch any unwanted output
ob_start();

// Completely disable all error reporting and display
error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 0);

// Set JSON header immediately
header('Content-Type: application/json; charset=utf-8');

// Clean any output buffer
ob_clean();

// Function to clean and normalize input
function cleanInput($data) {
    // Remove BOM if present
    $data = preg_replace('/^\xEF\xBB\xBF/', '', $data);
    
    // Normalize line endings
    $data = str_replace(["\r\n", "\r"], "\n", $data);
    
    // Remove null bytes
    $data = str_replace("\0", '', $data);
    
    // Convert to UTF-8 if needed
    if (!mb_check_encoding($data, 'UTF-8')) {
        $data = mb_convert_encoding($data, 'UTF-8', 'auto');
    }
    
    return $data;
}

// Function to safely return JSON
function returnJson($data) {
    ob_clean();
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    ob_end_flush();
    exit;
}

// Get input
$raw = '';
$mode = 'sql';

try {
    if (isset($_FILES['logfile']) && isset($_FILES['logfile']['tmp_name']) && is_uploaded_file($_FILES['logfile']['tmp_name'])) {
        $raw = @file_get_contents($_FILES['logfile']['tmp_name']);
        $mode = isset($_POST['mode']) ? $_POST['mode'] : 'sql';
    } elseif (isset($_POST['logs'])) {
        $raw = $_POST['logs'];
        $mode = isset($_POST['mode']) ? $_POST['mode'] : 'sql';
    } else {
        returnJson(['error' => 'No logs received.']);
    }
    
    if (empty($raw)) {
        returnJson(['error' => 'Empty log content received.']);
    }
    
    // Clean the input
    $raw = cleanInput($raw);
    
} catch (Exception $e) {
    returnJson(['error' => 'Error reading input: ' . $e->getMessage()]);
}

$results = [];

try {
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
                    'ContactNumber' => isset($fields['ContactNumber']) ? $fields['ContactNumber'] : $contactFromLog,
                    'FirstName' => isset($fields['FirstName']) ? $fields['FirstName'] : '',
                    'LastName' => isset($fields['LastName']) ? $fields['LastName'] : '',
                    'Birthday' => isset($fields['Birthday']) ? $fields['Birthday'] : '',
                    'BirthPlace' => isset($fields['BirthPlace']) ? $fields['BirthPlace'] : '',
                    'Gender' => isset($fields['Gender']) ? $fields['Gender'] : '',
                    'Nationality' => isset($fields['Nationality']) ? $fields['Nationality'] : '',
                    'Address' => isset($fields['Address']) ? $fields['Address'] : ''
                ];
            }
        }
    } else {
        // ========== SQL LOGS PARSER - PARSE ALL LOG TYPES ==========
        
        $entries = [];
        
        // First, try to split by >>>>> markers (original format)
        $entries1 = preg_split('/(?=>{5}\s+\d{4}-\d{2}-\d{2})/', $raw, -1, PREG_SPLIT_NO_EMPTY);
        
        // Also try to split by date pattern at start of line (new format: 2025-11-03 04:03:22 AM | ...)
        $entries2 = preg_split('/(?=^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM)\s+\|)/m', $raw, -1, PREG_SPLIT_NO_EMPTY);
        
        // Use whichever method found more entries
        if (count($entries2) > count($entries1)) {
            $entries = $entries2;
        } else {
            $entries = $entries1;
        }
        
        // If still no entries, try line-by-line parsing
        if (empty($entries) || (count($entries) === 1 && strlen($entries[0]) > 1000)) {
            $lines = explode("\n", $raw);
            $currentEntry = '';
            
            foreach ($lines as $line) {
                // Check if line starts a new entry (either format)
                if (preg_match('/>{5}\s+\d{4}-\d{2}-\d{2}/', $line) || 
                    preg_match('/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM)\s+\|/', $line)) {
                    if (!empty($currentEntry)) {
                        $entries[] = trim($currentEntry);
                    }
                    $currentEntry = $line;
                } else {
                    $currentEntry .= "\n" . $line;
                }
            }
            
            if (!empty($currentEntry)) {
                $entries[] = trim($currentEntry);
            }
        }
        
        foreach ($entries as $entry) {
            if (trim($entry) === '' || trim($entry) === '--') continue;
            
            // Extract timestamp - try both formats
            $timestamp = '';
            
            // Format 1: >>>>> 2025-11-03 04:03:22 AM
            if (preg_match('/>{5}\s+(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}(?:\s*(?:AM|PM))?)/', $entry, $dateMatch)) {
                $timestamp = $dateMatch[1];
            }
            // Format 2: 2025-11-03 04:03:22 AM | ...
            elseif (preg_match('/^(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM))/', $entry, $dateMatch)) {
                $timestamp = $dateMatch[1];
            }
            
            // Extract log type and module
            $logType = 'Unknown';
            if (preg_match('/\|\s+([^\s]+(?:\s+>\s+[^\s]+)*)\s+---\s+(WARNING|INFO|ERROR)/', $entry, $typeMatch)) {
                $logType = $typeMatch[1];
            }
            
            // Determine base status from log level and content
            $statusText = 'Info';
            $statusColor = 'blue';
            
            // Check for log level indicators
            $isWarning = stripos($entry, '--- WARNING') !== false;
            $isError = stripos($entry, '--- ERROR') !== false;
            $isInfo = stripos($entry, '--- INFO') !== false;
            
            // Determine status based on content and log level
            if (stripos($entry, 'Deadlock') !== false || (stripos($entry, "'Deadlock'") !== false)) {
                $statusText = 'Deadlock';
                $statusColor = 'orange';
            } elseif ($isError || stripos($entry, 'operation failed') !== false || stripos($entry, "'operation failed'") !== false) {
                $statusText = 'Failed';
                $statusColor = 'red';
            } elseif ($isWarning && stripos($entry, 'Deadlock') !== false) {
                $statusText = 'Deadlock';
                $statusColor = 'orange';
            } elseif (stripos($entry, 'Accepted') !== false || stripos($entry, "'Accepted'") !== false || 
                      stripos($entry, 'Success') !== false || stripos($entry, 'successful') !== false ||
                      ($isInfo && stripos($entry, 'operation successful') !== false)) {
                $statusText = 'Accepted';
                $statusColor = 'green';
            } elseif ($isWarning) {
                $statusText = 'Warning';
                $statusColor = 'orange';
            }
            
            // TYPE 1: SQL CALL Transactions - Handle both single and multi-line JSON
            if (stripos($entry, 'CALL sp_instapayInwardTransactionMerchant') !== false) {
                $jsonStr = null;
                
                // Find the JSON object - it's the parameter that contains {"InstrId"
                // Look for the pattern: '{"InstrId":"...",...}'
                
                // Method 1: Find position of {"InstrId" and extract JSON by matching braces
                $instrIdPos = stripos($entry, '{"InstrId"');
                if ($instrIdPos !== false) {
                    // Find the opening brace before InstrId
                    $braceStart = strrpos(substr($entry, 0, $instrIdPos), '{');
                    if ($braceStart !== false) {
                        // Now find the matching closing brace
                        $depth = 0;
                        $braceEnd = $braceStart;
                        $inString = false;
                        $escapeNext = false;
                        
                        for ($i = $braceStart; $i < strlen($entry); $i++) {
                            $char = $entry[$i];
                            
                            if ($escapeNext) {
                                $escapeNext = false;
                                continue;
                            }
                            
                            if ($char === '\\') {
                                $escapeNext = true;
                                continue;
                            }
                            
                            if ($char === '"' && !$escapeNext) {
                                $inString = !$inString;
                                continue;
                            }
                            
                            if (!$inString) {
                                if ($char === '{') {
                                    $depth++;
                                } elseif ($char === '}') {
                                    $depth--;
                                    if ($depth === 0) {
                                        $braceEnd = $i;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        if ($depth === 0 && $braceEnd > $braceStart) {
                            $jsonStr = substr($entry, $braceStart, $braceEnd - $braceStart + 1);
                        }
                    }
                }
                
                // Method 2: Fallback - try regex patterns
                if (!$jsonStr) {
                    // Pattern: Find JSON in single quotes that contains InstrId
                    if (preg_match("/'\s*(\{[^}]*\"InstrId\"[^}]*\})\s*'/", $entry, $jsonMatch)) {
                        $jsonStr = $jsonMatch[1];
                    }
                    // Pattern: Direct match without quotes
                    elseif (preg_match('/(\{\"InstrId\"[^}]+\})/', $entry, $jsonMatch)) {
                        $jsonStr = $jsonMatch[1];
                    }
                }
                
                if ($jsonStr) {
                    // The JSON should already be valid, but clean it up
                    $jsonStr = trim($jsonStr);
                    
                    // Try to decode directly first
                    $data = @json_decode($jsonStr, true);
                    
                    // If JSON decode failed, extract fields manually using regex
                    if (!$data || !is_array($data)) {
                        $data = [];
                        // Extract all JSON fields using regex patterns
                        if (preg_match('/"InstrId"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['InstrId'] = $m[1];
                        if (preg_match('/"TxId"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['TxId'] = $m[1];
                        if (preg_match('/"IntrBkSttlmAmt"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['IntrBkSttlmAmt'] = $m[1];
                        if (preg_match('/"CdtrNm"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['CdtrNm'] = $m[1];
                        if (preg_match('/"CdtrAcctId"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['CdtrAcctId'] = $m[1];
                        if (preg_match('/"DbtrNm"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['DbtrNm'] = $m[1];
                        if (preg_match('/"DbtrAcctId"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['DbtrAcctId'] = $m[1];
                        if (preg_match('/"TxSts"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['TxSts'] = $m[1];
                        if (preg_match('/"Rsn"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['Rsn'] = $m[1];
                        if (preg_match('/"MrchntCtgyCd"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['MrchntCtgyCd'] = $m[1];
                        if (preg_match('/"MsgDefIdr"\s*:\s*"([^"]+)"/', $jsonStr, $m)) $data['MsgId'] = $m[1];
                    }
                    
                    // Only add if we got at least InstrId or TxId
                    if (!empty($data) && (isset($data['InstrId']) || isset($data['TxId']))) {
                        $results[] = [
                            'Date' => $timestamp,
                            'Status' => $statusText,
                            'Color' => $statusColor,
                            'InstrId' => isset($data['InstrId']) ? $data['InstrId'] : '',
                            'TxId' => isset($data['TxId']) ? $data['TxId'] : '',
                            'Amount' => isset($data['IntrBkSttlmAmt']) ? $data['IntrBkSttlmAmt'] : '',
                            'CdtrNm' => isset($data['CdtrNm']) ? $data['CdtrNm'] : '',
                            'CdtrAcctId' => isset($data['CdtrAcctId']) ? $data['CdtrAcctId'] : '',
                            'DbtrNm' => isset($data['DbtrNm']) ? $data['DbtrNm'] : '',
                            'DbtrAcctId' => isset($data['DbtrAcctId']) ? $data['DbtrAcctId'] : '',
                            'TxSts' => isset($data['TxSts']) ? $data['TxSts'] : '',
                            'Rsn' => isset($data['Rsn']) ? $data['Rsn'] : '',
                            'MrchntCtgyCd' => isset($data['MrchntCtgyCd']) ? $data['MrchntCtgyCd'] : '',
                            'MsgId' => isset($data['MsgId']) ? $data['MsgId'] : ''
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
                            'InstrId' => isset($fields['InstrId']) ? $fields['InstrId'] : '',
                            'TxId' => isset($fields['TxId']) ? $fields['TxId'] : '',
                            'Amount' => isset($fields['Amount']) ? $fields['Amount'] : '',
                            'CdtrNm' => isset($fields['CdtrNm']) ? $fields['CdtrNm'] : '',
                            'CdtrAcctId' => isset($fields['CdtrAcctId']) ? $fields['CdtrAcctId'] : '',
                            'DbtrNm' => isset($fields['DbtrNm']) ? $fields['DbtrNm'] : '',
                            'DbtrAcctId' => isset($fields['DbtrAcctId']) ? $fields['DbtrAcctId'] : '',
                            'TxSts' => isset($fields['TxSts']) ? $fields['TxSts'] : '',
                            'Rsn' => isset($fields['Rsn']) ? $fields['Rsn'] : '',
                            'MrchntCtgyCd' => isset($fields['MrchntCtgyCd']) ? $fields['MrchntCtgyCd'] : '',
                            'MsgId' => isset($fields['MsgId']) ? $fields['MsgId'] : ''
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
                            'InstrId' => isset($fields['InstrId']) ? $fields['InstrId'] : '',
                            'TxId' => isset($fields['TxId']) ? $fields['TxId'] : '',
                            'Amount' => isset($fields['Amount']) ? $fields['Amount'] : '',
                            'CdtrNm' => isset($fields['CdtrNm']) ? $fields['CdtrNm'] : '',
                            'CdtrAcctId' => isset($fields['CdtrAcctId']) ? $fields['CdtrAcctId'] : '',
                            'DbtrNm' => isset($fields['DbtrNm']) ? $fields['DbtrNm'] : '',
                            'DbtrAcctId' => isset($fields['DbtrAcctId']) ? $fields['DbtrAcctId'] : '',
                            'TxSts' => isset($fields['TxSts']) ? $fields['TxSts'] : '',
                            'Rsn' => isset($fields['Rsn']) ? $fields['Rsn'] : '',
                            'MrchntCtgyCd' => isset($fields['MrchntCtgyCd']) ? $fields['MrchntCtgyCd'] : '',
                            'MsgId' => isset($fields['MsgId']) ? $fields['MsgId'] : ''
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
} catch (Exception $e) {
    returnJson(['error' => 'Error parsing logs: ' . $e->getMessage()]);
}

// Always return JSON, even if empty
returnJson($results);
?>
