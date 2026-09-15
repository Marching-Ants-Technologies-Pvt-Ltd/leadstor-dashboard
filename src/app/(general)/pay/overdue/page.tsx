import CommonPaymentPage from "../CommonScreen";

export default function UpcomingPayment() {
    return <CommonPaymentPage
        title="Payment required to restore access"
        description="Your Leadstor subscription is currently overdue. Complete the payment below and submit your UTR to get your account access restored."
        payType="overdue"
    />
}