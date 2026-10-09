import { RenvoiApplication } from "@/components/Application";
import { BulleAssistance } from "@/components/public/BulleAssistance";
import { EnTetePublique, PiedPublique } from "@/components/public/CadreVitrine";
import { Scenes } from "@/components/public/Scenes";
import "./vitrine.css";

export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marque min-h-screen flex flex-col [@media(display-mode:standalone)]:invisible">
      <RenvoiApplication />
      <div className="vitrine-sombre flex flex-col min-h-screen">
        <EnTetePublique />
        {children}
        <PiedPublique />
        <BulleAssistance />
        <Scenes />
      </div>
    </div>
  );
}
