import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, ArrowRight } from 'lucide-react';
import memberSuyogImg from '../../photos/Suyog.jpg';
import memberSudhanshuImg from '../../photos/Sudhanshu.JPG.jpeg';
import memberChitrasenImg from '../../photos/Chitrasen.JPG.jpeg';
import memberNishantImg from '../../photos/Nishant.JPG.jpeg';
import memberShreyImg from '../assets/images/member_shrey_patle_1794716012599.jpg';

function Instagram({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export interface TeamMember {
  id: string;
  name: string;
  statusIndicator: string;
  role: string;
  focusArea: string;
  instaHandle: string;
  photoUrl: string;
  bio: string;
}

export const TEAM_404_MEMBERS: TeamMember[] = [
  {
    id: 'member-suyog-sontakke',
    name: 'Suyog Sontakke',
    statusIndicator: 'Active Researcher',
    role: 'Lead Systems Architect',
    focusArea: 'NASA POWER Pipeline & Full-Stack Core',
    instaHandle: '@suyog_sontakke',
    photoUrl: memberSuyogImg,
    bio: 'Architected the EARTH TRACE geospatial platform, NASA POWER / MERRA-2 ingestion pipeline, and scientific telemetry interfaces.'
  },
  {
    id: 'member-sudhanshu-dangre',
    name: 'Sudhanshu Dangre',
    statusIndicator: 'Data Analyst',
    role: 'Atmospheric Data Scientist',
    focusArea: 'Mann-Kendall & Non-Parametric Kernel',
    instaHandle: '@sudhanshu_d13',
    photoUrl: memberSudhanshuImg,
    bio: 'Engineered the non-parametric Mann-Kendall rank correlation test, tied-group variance corrections, and Sen’s slope estimators.'
  },
  {
    id: 'member-chitrasen-gautam',
    name: 'Chitrasen Gautam',
    statusIndicator: 'AI & Risk Researcher',
    role: 'Climate AI & Risk Analyst',
    focusArea: '72-Hour Blindspot & Grounded Synthesis',
    instaHandle: '@chitrasen.in',
    photoUrl: memberChitrasenImg,
    bio: 'Developed the 72-Hour Blindspot latency decision matrix, GDACS/INFORM multi-hazard integration, and zero-hallucination AI synthesis.'
  },
  {
    id: 'member-nishant-gaikwad',
    name: 'Nishant Gaikwad',
    statusIndicator: 'UI & 3D Designer',
    role: '3D Geospatial & Telemetry Lead',
    focusArea: '3D Earth Observatory & LiDAR Point Cloud',
    instaHandle: '@nishant_stories',
    photoUrl: memberNishantImg,
    bio: 'Designed the Three.js orbital observatory, CALIOP vertical atmospheric curtain shaders, and interactive terrain elevation meshes.'
  },
  {
    id: 'member-shrey-patle',
    name: 'Shrey Patle',
    statusIndicator: 'Active Researcher',
    role: 'Environmental Systems Engineer',
    focusArea: 'Multi-Layer Spectral & Boundary Physics',
    instaHandle: '@_ishrey',
    photoUrl: memberShreyImg,
    bio: 'Built the planetary boundary layer simulation, environmental spectral layer deck, and publication-grade scientific report exports.'
  }
];

function formatInstagramUrl(handle: string): string {
  const clean = handle
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/+$/, '');
  return `https://instagram.com/${clean || 'nasa'}`;
}

interface TeamMembersSectionProps {
  compact?: boolean;
  showDedicatedPageLink?: boolean;
}

export default function TeamMembersSection({
  compact = false,
  showDedicatedPageLink = false
}: TeamMembersSectionProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6 font-sans">
      {/* Section Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#48516A] pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A6B7D4]">
            <span>Team 404 Err</span>
            <span aria-hidden="true">·</span>
            <span>5 Core Members</span>
            <span aria-hidden="true">·</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight font-space">
            Team 404 Err — Members
          </h2>
          <p className="text-xs sm:text-sm text-[#B5BDCC] max-w-2xl leading-relaxed">
            The five engineers and researchers behind EARTH TRACE for the NASA International Space Apps Challenge 2026.
          </p>
        </div>

        {showDedicatedPageLink && (
          <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
            <Link
              to="/members"
              className="px-3.5 py-2 rounded-lg bg-[#232A3D] hover:bg-[#353D55] text-[#A6B7D4] border border-[#48516A] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Open Full Members Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 5-Member Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {TEAM_404_MEMBERS.map((member, index) => {
          const imgFailed = Boolean(failedImages[member.id]);
          const instaUrl = formatInstagramUrl(member.instaHandle);

          return (
            <article
              key={member.id}
              className="bg-[#353D55] border border-[#48516A] hover:border-[#A6B7D4] rounded-2xl overflow-hidden flex flex-col justify-between transition-colors group"
            >
              <div>
                {/* 1:1 Portrait Container */}
                <div className="relative aspect-square w-full bg-[#1D2436] overflow-hidden border-b border-[#48516A]">
                  {!imgFailed && member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={`${member.name} — ${member.role}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages(prev => ({ ...prev, [member.id]: true }))
                      }
                      className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1D2436] text-[#A6B7D4] p-6 text-center">
                      <Users className="w-12 h-12 mb-2 opacity-75" />
                      <span className="text-base font-bold text-[#F0EBDD] font-space">
                        {member.name}
                      </span>
                      <span className="text-xs font-mono text-[#838FA3] mt-0.5">
                        {member.role}
                      </span>
                    </div>
                  )}

                  {/* Measured Contrast Scrim at Bottom of Portrait */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#171B2B]/95 via-[#171B2B]/55 to-transparent pointer-events-none" />

                  {/* Bottom-Left Editorial Index, Name & Status Indicator Overlay */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 pointer-events-none">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-[#B5BDCC] tracking-wide">
                        0{index + 1} · {member.role}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#F0EBDD] leading-tight font-space truncate">
                        {member.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-[#35C98B]">
                        <span aria-hidden="true">●</span>
                        <span className="font-semibold text-[#F0EBDD]">{member.statusIndicator}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Details Body */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A6B7D4]">
                    <span className="text-[#35C98B] font-semibold">{member.statusIndicator}</span>
                    <span className="text-[#838FA3]" aria-hidden="true">·</span>
                    <span className="truncate">{member.focusArea}</span>
                  </div>

                  {!compact && (
                    <p className="text-xs text-[#B5BDCC] leading-relaxed">
                      {member.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer: Clickable Instagram Handle */}
              <div className="px-4 py-3 bg-[#232A3D] border-t border-[#48516A] flex items-center justify-between gap-2">
                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#F0EBDD] hover:text-[#D28B71] transition-colors min-w-0 group/insta"
                >
                  <Instagram className="w-4 h-4 text-[#D28B71] shrink-0" />
                  <span className="truncate">{member.instaHandle}</span>
                  <ExternalLink className="w-3 h-3 text-[#838FA3] group-hover/insta:text-[#D28B71] shrink-0 transition-colors" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
