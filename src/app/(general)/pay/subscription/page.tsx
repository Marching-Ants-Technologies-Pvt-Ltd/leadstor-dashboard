import CommonPaymentPage from "../CommonScreen";

export default function UpcomingPayment() {
    return <CommonPaymentPage
        title="Upcoming Payment"
        description="Your next Leadstor subscription payment is due soon. Complete the payment by the due date to keep your account access active."
        payType="upcoming"
    />
}