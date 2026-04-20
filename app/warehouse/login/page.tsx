import { WarehouseLoginForm } from "./WarehouseLoginForm";

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function WarehouseLoginPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  return <WarehouseLoginForm reason={reason} />;
}
