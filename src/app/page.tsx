import { ChangeOrderGenerator } from "@/components/change-order-generator";

export default function Home() {
  return <ChangeOrderGenerator paymentLink={process.env.NEXT_PUBLIC_PAYMENT_LINK} />;
}
