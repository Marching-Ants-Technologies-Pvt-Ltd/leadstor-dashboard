export const WHATSAPP_SUPPORT= "https://wa.me/918600074862"
export const EMAIL_SUPPORT = "solutions@leadstor.in"
export const BUSINESS_NAME = "Marching Ants Technologies Pvt. Ltd "

export interface BankDetailsType {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
}

export interface UpiDetailsType {
    upiId: string;
    name: string;
}

export const bankDetails: BankDetailsType = {
    accountName: BUSINESS_NAME,
    accountNumber: "169705000591",
    ifsc: "ICIC0001697",
    bankName: "ICICI Bank",
    branch: "Rose Valley, Aundh Annexe, Pimple Saudagar, Pune - 411027",
};

export const upiDetails: UpiDetailsType = {
    upiId: "MarchingAnts@icici",
    name: BUSINESS_NAME,
};