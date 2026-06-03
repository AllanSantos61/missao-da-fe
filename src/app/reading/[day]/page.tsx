import { MissionFlowPage } from "@/components/MissionFlowPage";

export default function ReadingMissionRoute({ params }: { params: { day: string } }) {
  return <MissionFlowPage step="reading" day={Number(params.day)} />;
}
