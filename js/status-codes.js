// ========== BN STATUS CODE LOOKUP DATABASE ==========

const bnStatusCodes = {
  // Aborted codes
  'AB01': 'Aborted Clearing Timeout',
  'AB02': 'Aborted Clearing Fatal Error',
  'AB03': 'Aborted Settlement Timeout',
  'AB04': 'Aborted Settlement Fatal Error',
  'AB05': 'Timeout Creditor Agent',
  'AB06': 'Timeout Instructed Agent',
  'AB07': 'Offline Agent',
  'AB08': 'Offline Creditor Agent',
  'AB09': 'Error Creditor Agent',
  'AB10': 'Error Instructed Agent',
  
  // Account codes
  'AC01': 'Incorrect Account Number',
  'AC02': 'Invalid Debtor Account Number',
  'AC03': 'Invalid Creditor Account Number',
  'AC04': 'Closed Account Number',
  'AC05': 'Closed Debtor Account Number',
  'AC06': 'Blocked Account',
  'AC07': 'Closed Creditor Account Number',
  'AC08': 'Invalid Branch Code',
  'AC09': 'Invalid Account Currency',
  'AC10': 'Invalid Debtor Account Currency',
  'AC11': 'Invalid Creditor Account Currency',
  'AC12': 'Invalid Account Type',
  'AC13': 'Invalid Debtor Account Type',
  'AC14': 'Invalid Creditor Account Type',
  'AC15': 'Account Details Changed',
  
  // Agent codes
  'AG01': 'Transaction Forbidden',
  'AG02': 'Invalid Bank Operation Code',
  'AG03': 'Transaction Not Supported',
  'AG04': 'Invalid Agent Country',
  'AG05': 'Invalid Debtor Agent Country',
  'AG06': 'Invalid Creditor Agent Country',
  'AG07': 'Unsuccessful Direct Debit',
  'AG08': 'Invalid Access Rights',
  'AG09': 'Payment Not Received',
  'AG10': 'Agent Suspended',
  'AG11': 'Creditor Agent Suspended',
  'AGNT': 'Incorrect Agent',
  
  // Amount codes
  'AM01': 'Zero Amount',
  'AM02': 'Not Allowed Amount',
  'AM03': 'Not Allowed Currency',
  'AM04': 'Insufficient Funds',
  'AM05': 'Duplication',
  'AM06': 'Too Low Amount',
  'AM07': 'Blocked Amount',
  'AM09': 'Wrong Amount',
  'AM10': 'Invalid Control Sum',
  'AM11': 'Invalid Transaction Currency',
  'AM12': 'Invalid Amount',
  'AM13': 'Amount Exceeds Clearing System Limit',
  'AM14': 'Amount Exceeds Agreed Limit',
  'AM15': 'Amount Below Clearing System Minimum',
  'AM16': 'Invalid Group Control Sum',
  'AM17': 'Invalid Payment Info Control Sum',
  'AM18': 'Invalid Number Of Transactions',
  'AM19': 'Invalid Group Number Of Transactions',
  'AM20': 'Invalid Payment Info Number Of Transactions',
  'AM21': 'Limit Exceeded',
  'AM22': 'Zero Amount Not Applied',
  'AM23': 'Amount Exceeds Settlement Limit',
  
  // Business codes
  'BE01': 'Inconsistent With End Customer',
  'BE04': 'Missing Creditor Address',
  'BE05': 'Unrecognised Initiating Party',
  'BE06': 'Unknown End Customer',
  'BE07': 'Missing Debtor Address',
  'BE08': 'Missing Debtor Name',
  'BE09': 'Invalid Country',
  'BE10': 'Invalid Debtor Country',
  'BE11': 'Invalid Creditor Country',
  'BE12': 'Invalid Country Of Residence',
  'BE13': 'Invalid Debtor Country Of Residence',
  'BE14': 'Invalid Creditor Country Of Residence',
  'BE15': 'Invalid Identification Code',
  'BE16': 'Invalid Debtor Identification Code',
  'BE17': 'Invalid Creditor Identification Code',
  'BE18': 'Invalid Contact Details',
  'BE19': 'Invalid Charge Bearer Code',
  'BE20': 'Invalid Name Length',
  'BE21': 'Missing Name',
  'BE22': 'Missing Creditor Name',
  
  // Check codes
  'CERI': 'Check ERI',
  'CH03': 'Requested Execution Date Or Requested Collection Date Too Far In Future',
  'CH04': 'Requested Execution Date Or Requested Collection Date Too Far In Past',
  'CH07': 'Element Is Not To Be Used At B-and C-Level',
  'CH09': 'Mandate Changes Not Allowed',
  'CH10': 'Information On Mandate Changes Missing',
  'CH11': 'Creditor Identifier Incorrect',
  'CH12': 'Creditor Identifier Not Unambiguously At Transaction-Level',
  'CH13': 'Original Debtor Account Is Not To Be Used',
  'CH14': 'Original Debtor Agent Is Not To Be Used',
  'CH15': 'Element Content Includes More Than 140 Characters',
  'CH16': 'Element Content Formally Incorrect',
  'CH17': 'Element Not Admitted',
  'CH19': 'Values Will Be Set To Next TARGET day',
  'CH20': 'Decimal Points Not Compatible With Currency',
  'CH21': 'Required Compulsory Element Missing',
  'CH22': 'CORE and B2B within One message',
  
  // Registration codes
  'CNOR': 'Creditor bank is not registered',
  'CURR': 'Incorrect Currency',
  'CUST': 'Requested By Customer',
  'DNOR': 'Debtor bank is not registered',
  
  // Digital signature codes
  'DS01': 'Electronic Signatures Correct',
  'DS02': 'Order Cancelled',
  'DS03': 'Order Not Cancelled',
  'DS04': 'Order Rejected',
  'DS05': 'Order Forwarded For Postprocessing',
  'DS06': 'Transfer Order',
  'DS07': 'Processing OK',
  'DS08': 'Decompression Error',
  'DS09': 'Decryption Error',
  'DS0A': 'Data Sign Requested',
  'DS0B': 'Unknown Data Sign Format',
  'DS0C': 'Signer Certificate Revoked',
  'DS0D': 'Signer Certificate Not Valid',
  'DS0E': 'Incorrect Signer Certificate',
  'DS0F': 'Signer Certification Authority Signer Not Valid',
  'DS0G': 'Not Allowed Payment',
  'DS0H': 'Not Allowed Account',
  'DS0K': 'Not Allowed Number Of Transaction',
  'DS10': 'Signer1 Certificate Revoked',
  'DS11': 'Signer1 Certificate Not Valid',
  'DS12': 'Incorrect Signer1 Certificate',
  'DS13': 'Signer Certification Authority Signer1 Not Valid',
  'DS14': 'User Does Not Exist',
  'DS15': 'Identical Signature Found',
  'DS16': 'Public Key Version Incorrect',
  'DS17': 'Different Order Data In Signatures',
  'DS18': 'Repeat Order',
  'DS19': 'Electronic Signature Rights Insufficient',
  'DS20': 'Signer2 Certificate Revoked',
  'DS21': 'Signer2 Certificate Not Valid',
  'DS22': 'Incorrect Signer2 Certificate',
  'DS23': 'Signer Certification Authority Signer2 Not Valid',
  'DS24': 'Waiting Time Expired',
  'DS25': 'Order File Deleted',
  'DS26': 'User Signed Multiple Times',
  'DS27': 'User Not Yet Activated',
  
  // Date codes
  'DT01': 'Invalid Date',
  'DT02': 'Invalid Creation Date',
  'DT03': 'Invalid Non Processing Date',
  'DT04': 'Future Date Not Supported',
  'DT05': 'Invalid Cut Off Date',
  'DT06': 'Execution Date Changed',
  
  // Duplicate codes
  'DU01': 'Duplicate Message ID',
  'DU02': 'Duplicate Payment Information ID',
  'DU03': 'Duplicate Transaction',
  'DU04': 'Duplicate End To End ID',
  'DU05': 'Duplicate Instruction ID',
  'DUPL': 'Duplicate Payment',
  
  // Error codes
  'ED01': 'Correspondent Bank Not Possible',
  'ED03': 'Balance Info Request',
  'ED05': 'Settlement Failed',
  'ED06': 'Settlement System Not Available',
  'ERIN': 'ERI Option Not Supported',
  
  // File format codes
  'FF01': 'Invalid File Format',
  'FF02': 'Syntax Error',
  'FF03': 'Invalid Payment Type Information',
  'FF04': 'Invalid Service Level Code',
  'FF05': 'Invalid Local Instrument Code',
  'FF06': 'Invalid Category Purpose Code',
  'FF07': 'Invalid Purpose',
  'FF08': 'Invalid End To End Id',
  'FF09': 'Invalid Cheque Number',
  'FF10': 'Bank System Processing Error',
  'FF11': 'Clearing Request Aborted',
  
  // Generic codes
  'G000': 'Payment transferred and not tracked',
  'G001': 'Credit Debit Not Confirmed',
  'G002': 'Credit Debit Not Confirmed',
  'G003': 'Credit Pending Documents',
  'G004': 'Credit Pending Funds',
  'G005': 'Delivered With Service Level',
  'G006': 'Delivered Without Service Level',
  
  // ID codes
  'ID01': 'Corresponding Original File Still Not Sent',
  
  // Mandate codes
  'MD01': 'No Mandate',
  'MD02': 'Missing Mandatory Information In Mandate',
  'MD05': 'Collection Not Due',
  'MD06': 'Refund Request By End Customer',
  'MD07': 'End Customer Deceased',
  
  // Message codes
  'MS02': 'Not Specified Reason Customer Generated',
  'MS03': 'Not Specified Reason Agent Generated',
  'NARR': 'Narrative',
  'NERI': 'No ERI',
  
  // Routing codes
  'RC01': 'Bank Identifier Incorrect',
  'RC02': 'Invalid Bank Identifier',
  'RC03': 'Invalid Debtor Bank Identifier',
  'RC04': 'Invalid Creditor Bank Identifier',
  'RC05': 'Invalid BIC Identifier',
  'RC06': 'Invalid Debtor BIC Identifier',
  'RC07': 'Invalid Creditor BIC Identifier',
  'RC08': 'Invalid Clearing System Member Identifier',
  'RC09': 'Invalid Debtor Clearing System Member Identifier',
  'RC10': 'Invalid Creditor Clearing System Member Identifier',
  'RC11': 'Invalid Intermediary Agent',
  'RC12': 'Missing Creditor Scheme Id',
  'RCON': 'R-Message Conflict',
  
  // Reference codes
  'RF01': 'Not Unique Transaction Reference',
  'RR01': 'Missing Debtor Account or Identification',
  'RR02': 'Missing Debtor Name or Address',
  'RR03': 'Missing Creditor Name or Address',
  'RR04': 'Regulatory Reason',
  'RR05': 'Regulatory Information Invalid',
  'RR06': 'Tax Information Invalid',
  'RR07': 'Remittance Information Invalid',
  'RR08': 'Remittance Information Truncated',
  'RR09': 'Invalid Structured Creditor Reference',
  'RR10': 'Invalid Character Set',
  'RR11': 'Invalid Debtor Agent Service ID',
  'RR12': 'Invalid Party ID',
  
  // Status codes
  'S000': 'Valid Request For Cancellation Acknowledged',
  'S001': 'UETR Flagged For Cancellation',
  'S002': 'Network Stop Of UETR',
  'S003': 'Request For Cancellation Forwarded',
  'S004': 'Request For Cancellation Delivery Acknowledgement',
  
  // Service level codes
  'SL01': 'Specific Service offered by Debtor Agent',
  'SL02': 'Specific Service offered by Creditor Agent',
  'SL11': 'Creditor not on Whitelist of Debtor',
  'SL12': 'Creditor on Blacklist of Debtor',
  'SL13': 'Maximum number of Direct Debit Transactions exceeded',
  'SL14': 'Maximum Direct Debit Transaction Amount exceeded',
  
  // Technical codes
  'TA01': 'Transmission Aborted',
  'TD01': 'No Data Available',
  'TD02': 'File Non Readable',
  'TD03': 'Incorrect File Structure',
  'TM01': 'Invalid Cut Off Time',
  'TS01': 'Transmission Successful',
  'TS04': 'Transfer To Sign By Hand',
  
  // System codes
  '9909': 'IPS Switch system malfunction',
  '9910': 'Receiving Bank - Logged Off',
  '9912': 'Rvc Participant not available',
  '9920': 'Interbank Fee Code invalid',
  '9921': 'Application Criteria is invalid',
  '9922': 'Type of Person is invalid',
  '9923': 'Rate Debit Concept is not numeric',
  '9924': 'Invalid Asset Indicator',
  '9925': 'Invalid Month of Payment',
  '9926': 'Month/Year of Payment is not numeric',
  '9934': 'Snd Participant off line',
  '9946': 'Sending Participant fully suspended',
  '9947': 'Receiving Participant fully suspended',
  '9948': 'Service suspended',
  '9964': 'Invalid Bank Identification',
  
  // Standard codes
  'NOAT': 'Message Type not supported',
  'ACTC': 'Accepted Technical Validation',
  'ACWP': 'Accepted Without Posting',
  'RCVD': 'Received',
  'RJCT': 'Rejected'
};

// Function to lookup status code and return description
function lookupStatusCode(code) {
  if (!code) return null;
  
  // Clean the code (remove whitespace, convert to uppercase)
  const cleanCode = code.toString().trim().toUpperCase();
  
  return bnStatusCodes[cleanCode] || null;
}

// Function to get status category and severity
function getStatusCodeInfo(code) {
  if (!code) return null;
  
  const description = lookupStatusCode(code);
  if (!description) return null;
  
  const cleanCode = code.toString().trim().toUpperCase();
  
  // Determine severity based on code prefix
  let severity = 'info';
  let category = 'General';
  
  if (cleanCode.startsWith('AB')) {
    severity = 'error';
    category = 'Aborted Transaction';
  } else if (cleanCode.startsWith('AC')) {
    severity = 'error';
    category = 'Account Issue';
  } else if (cleanCode.startsWith('AG')) {
    severity = 'error';
    category = 'Agent Issue';
  } else if (cleanCode.startsWith('AM')) {
    severity = 'error';
    category = 'Amount Issue';
  } else if (cleanCode.startsWith('BE')) {
    severity = 'error';
    category = 'Business Error';
  } else if (cleanCode.startsWith('CH')) {
    severity = 'warning';
    category = 'Check/Validation';
  } else if (cleanCode.startsWith('D')) {
    severity = 'error';
    category = 'Data/Digital Signature';
  } else if (cleanCode.startsWith('ED')) {
    severity = 'error';
    category = 'Error';
  } else if (cleanCode.startsWith('FF')) {
    severity = 'error';
    category = 'File Format';
  } else if (cleanCode.startsWith('G')) {
    severity = 'info';
    category = 'Generic Status';
  } else if (cleanCode.startsWith('MD')) {
    severity = 'error';
    category = 'Mandate';
  } else if (cleanCode.startsWith('RC')) {
    severity = 'error';
    category = 'Routing';
  } else if (cleanCode.startsWith('RR')) {
    severity = 'error';
    category = 'Regulatory/Reference';
  } else if (cleanCode.startsWith('S0')) {
    severity = 'success';
    category = 'Success/Cancellation';
  } else if (cleanCode.startsWith('SL')) {
    severity = 'warning';
    category = 'Service Level';
  } else if (cleanCode.startsWith('T')) {
    severity = 'error';
    category = 'Technical';
  } else if (cleanCode.match(/^\d/)) {
    severity = 'error';
    category = 'System Error';
  } else if (cleanCode === 'ACTC' || cleanCode === 'ACWP' || cleanCode === 'RCVD') {
    severity = 'success';
    category = 'Accepted';
  } else if (cleanCode === 'RJCT') {
    severity = 'error';
    category = 'Rejected';
  }
  
  return {
    code: cleanCode,
    description: description,
    category: category,
    severity: severity
  };
}

// Export functions for use in app.js
window.lookupStatusCode = lookupStatusCode;
window.getStatusCodeInfo = getStatusCodeInfo;