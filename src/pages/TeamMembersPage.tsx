import PageContainer from '../components/PageContainer';
import TeamMembersSection from '../components/TeamMembersSection';
import { Users, Globe, ShieldCheck } from 'lucide-react';

export default function TeamMembersPage() {
  return (
    <PageContainer title="Team 404 Err · Project Members">
      <div className="space-y-8 max-w-[1700px] mx-auto pb-16 font-sans">
        {/* Top Attribution Banner */}
        <div className="bg-[#232A3D] border border-[#48516A] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src="/assets/aistudio/image_0bb54710.png"
              alt="NASA Space Apps Challenge"
              className="h-10 sm:h-12 w-auto object-contain shrink-0"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#A6B7D4]">
                <span>NASA International Space Apps Challenge 2026</span>
                <span aria-hidden="true">·</span>
                <span>Nagpur Benchmark Observatory</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F0EBDD] font-space">
                EARTH TRACE · Team 404 Err Roster
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#B5BDCC]">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#A6B7D4]" />
              <span>Core Research & Engineering Unit</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#D28B71]" />
              <span>Earth System Trend Detective</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5 text-[#35C98B]">
              <ShieldCheck className="w-4 h-4" />
              <span>Open Science Attribution</span>
            </span>
          </div>
        </div>

        {/* Interactive Members Roster Grid */}
        <div className="bg-[#232A3D] border border-[#48516A] rounded-2xl p-5 sm:p-8 shadow-xl">
          <TeamMembersSection />
        </div>
      </div>
    </PageContainer>
  );
}
