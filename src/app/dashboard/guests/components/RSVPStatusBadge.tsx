import { Badge } from "@/components/ui/Badge";
import { RSVPStatus } from "@/types/guests";

interface RSVPStatusBadgeProps {
  status: RSVPStatus;
}

export function RSVPStatusBadge({ status }: RSVPStatusBadgeProps) {
  const getStatusConfig = (status: RSVPStatus) => {
    switch (status) {
      case "confirmed":
        return { color: "bg-green-100 text-green-800", label: "Confirmed" };
      case "maybe":
        return { color: "bg-orange-100 text-orange-800", label: "Maybe" };
      case "declined":
        return { color: "bg-red-100 text-red-800", label: "Declined" };
      default:
        return { color: "bg-gray-100 text-gray-800", label: "Pending" };
    }
  };

  const config = getStatusConfig(status);

  return <Badge className={config.color}>{config.label}</Badge>;
}
