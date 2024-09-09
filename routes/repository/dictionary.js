function GetValue(abr) {
  if (abr == "WH") return "WAREHOUSE";
  if (abr == "DLV") return "TO BE DELIVER TO CLIENT";
  if (abr == "NPD") return "NOT PAID";
  if (abr == "SLD") return "SOLD";
  if (abr == "PIC") return "FOR PICKUP TO WAREHOUSE";
  if (abr == "PD") return "PAID";
  if (abr == "NSTK") return "NO STOCKS AVAILABLE";
  if (abr == "REQ") return "REQUEST";
  if (abr == "PND") return "PENDING";
  if (abr == "APD") return "APPROVED";
  if (abr == "ALLOC") return "ALLOCATE SERIALS";
  if (abr == "ALLOCP") return "ALLOCATE PRICE";
  if (abr == "REQB") return "REQUEST BUDGET";
  if (abr == "WAIT") return "WAITING";
  if (abr == "RES") return "RESTOCK";
  if (abr == "FAPR") return "FOR APPROVAL";
  if (abr == "SPR") return "SPARE";
  if (abr == "DLY") return "DEPLOYED";
  if (abr == "RET") return "RETURNED";
  if (abr == "ACT") return "ACTIVE";
  if (abr == "INACT") return "INACTIVE";
  if (abr == "REM") return "REMOVE";
  if (abr == "UPD") return "UPDATE";
  if (abr == "INST") return "INST";
  if (abr == "RSD") return "RESOLVED";
  if (abr == "CLSD") return "CLOSED";
  if (abr == "OSR") return "ONSITE SERVICE REQUEST";
  if (abr == "DND") return "DONE";
  if (abr == "ASGN") return "ASSIGNED";
  if (abr == "RPRD") return "REPAIRED";
  if (abr == "TRFR") return "TRANSFER";
  if (abr == "DFCT") return "DEFECTIVE";
  if (abr == "RPLD") return "REPLACED";
  if (abr == "RPMT") return "REPLACEMENT";
}

//#region STATUS CODE
function RPLD() {
  return "RPLD";
}
function RPMT() {
  return "RPMT";
}

function WH() {
  return "WH";
}

function DFCT() {
  return "DFCT";
}

function DLV() {
  return "DLV";
}

function NPD() {
  return "NPD";
}

function SLD() {
  return "SLD";
}

function PIC() {
  return "PIC";
}

function PD() {
  return "PD";
}

function NSTK() {
  return "NSTK";
}

function REQ() {
  return "REQ";
}

function PND() {
  return "PND";
}

function APD() {
  return "APD";
}

function ALLOC() {
  return "ALLOC";
}

function REQB() {
  return "REQB";
}

function WAIT() {
  return "WAIT";
}

function ALLOCP() {
  return "ALLOCP";
}

function RES() {
  return "RES";
}

function FAPR() {
  return "FAPR";
}

function SPR() {
  return "SPR";
}

function DLY() {
  return "DLY";
}

function RET() {
  return "RET";
}

function ACT() {
  return "ACT";
}

function REM() {
  return "REM";
}

function UPD() {
  return "UPD";
}

function INST() {
  return "INST";
}

function INACT() {
  return "INACT";
}

function RSD() {
  return "RSD";
}

function CLSD() {
  return "CLSD";
}

function OSR() {
  return "OSR";
}
function DND() {
  return "DND";
}

function ASGN() {
  return "ASGN";
}

function RPRD() {
  return "RPRD";
}

function TRFR() {
  return "TRFR";
}
//#endregion
//ENUM


module.exports = {
  GetValue,
  ACT,
  INACT,
  PD,
  NPD,
  RPLD,
  RPMT,
  WH,
  DFCT,
  DLV,
  SLD,
  PIC,
  NSTK,
  REQ,
  PND,
  APD,
  ALLOC,
  REQB,
  WAIT,
  ALLOCP,
  RES,
  FAPR,
  SPR,
  DLY,
};
