import { ChangeOrderGenerator } from "@/components/change-order-generator";

export default function Home() {
  return (
    <ChangeOrderGenerator
      pilotLink={process.env.NEXT_PUBLIC_PILOT_LINK || process.env.NEXT_PUBLIC_PAYMENT_LINK}
    />
  );
}
