// lib/constants.js

export const classData = {
    "6": ["GOLAP", "SHAPLA", "BELI", "SHEULY", "TAGAR", "BAKUL", "RAJANIGANDHA"],
    "7": ["DOYEL", "KOYEL", "MOYNA", "TIYA", "EAGLE", "KOKIL"],
    "8": ["SHITOLOKKHA", "MEGHNA", "PADMA", "JAMUNA"],
    "9": ["LAL", "SABUJ"],
    "10": ["AAM", "JAM"]
};

export const studentFeeTypes = ["TUITION FEE", "VEHICLE FEE", "ADMISSION", "RE-ADMISSION", "HALF YEARLY EXAM", "YEARLY EXAM"];
export const classFeeTypes = ["MONTHLY TEST", "DIARY", "TIE", "BAG", "SPORTS", "ID CARD", "ID CARD HOLDER", "ID CARD RIBBON", "MILAD", "OTHERS"];
export const allFeeTypes = [...studentFeeTypes, ...classFeeTypes];
export const expenseTypes = ["Salaries", "Utilities", "Maintenance", "Supplies", "Other"];
export const employeeTypes = ["Assistant Teacher", "Accounts Officer", "Computer Operator", "Office Staff", "Assistant Head Teacher", "Head Teacher"];
export const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];