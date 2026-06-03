import { MissionFlowPage } from "@/components/MissionFlowPage";

export default function QuizMissionRoute({ params }: { params: { day: string } }) {
  return <MissionFlowPage step="quiz" day={Number(params.day)} />;
}
