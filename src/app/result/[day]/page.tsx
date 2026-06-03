import { MissionFlowPage } from "@/components/MissionFlowPage";

export default function ResultMissionRoute({ params }: { params: { day: string } }) {
  return <MissionFlowPage step="result" day={Number(params.day)} />;
}
