import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function PatientLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
