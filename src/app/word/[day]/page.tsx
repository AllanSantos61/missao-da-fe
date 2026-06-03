import { MissionFlowPage } from "@/components/MissionFlowPage";

export default function WordMissionRoute({ params }: { params: { day: string } }) {
  return <MissionFlowPage step="word" day={Number(params.day)} />;
}
