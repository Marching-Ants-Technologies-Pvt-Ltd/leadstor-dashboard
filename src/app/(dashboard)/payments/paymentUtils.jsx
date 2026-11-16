export const STATUS = {
    "0": "Not Paid",
    "1": "Paid by Cash",
    "2": "Paid by Cheque",
    "3": "Paid by Card Swipe",
    "4": "Paid by PayTm",
    "5": "Paid Online",
    "6": "Paid by GooglePay",
    "7": "Paid by PhonePe",
    "8": "Paid by Loan",
    "9": "Paid by Bank Transfer",
    "10": "Refund by Cash",
    "11": "Refund by Cheque",
    "12": "Refund by Online",
    "13": "Refund by Bank Transfer",
};

export const MonthNameAsKey = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
};

export const MonthNameByIndex = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

// The installment endpoints can answer with an empty body or a wrapped object,
// so only a real list is safe to render. Anything else would crash on .map().
export const toInstallmentList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.installments)) return data.installments;
    return null;
};