import { LectureRessourcePage } from "@/components/pages/LectureRessourcePage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <LectureRessourcePage space="admin" params={params} />;
}
