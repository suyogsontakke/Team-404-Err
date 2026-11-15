/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import OverviewDashboard from './pages/OverviewDashboard';
import EarthExplorer from './pages/EarthExplorer';
import VariableExplorer from './pages/VariableExplorer';
import TrendDetective from './pages/TrendDetective';
import LocationComparison from './pages/LocationComparison';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';
import MethodologyAbout from './pages/MethodologyAbout';
import BlindspotSimulator from './pages/BlindspotSimulator';
import GlobalDisasterWatch from './pages/GlobalDisasterWatch';
import EarthObservatoryPage from './pages/EarthObservatoryPage';
import TeamMembersPage from './pages/TeamMembersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Screen Landing Page - Standalone above all sections */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/overview" element={<LandingPage />} />

        {/* Operational Dashboard & Analytical Modules */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<OverviewDashboard />} />
          <Route path="/disaster-watch" element={<GlobalDisasterWatch />} />
          <Route path="/observatory" element={<EarthObservatoryPage />} />
          <Route path="/earth-explorer" element={<EarthExplorer />} />
          <Route path="/variable-explorer" element={<VariableExplorer />} />
          <Route path="/trend-detective" element={<TrendDetective />} />
          <Route path="/blindspot" element={<BlindspotSimulator />} />
          <Route path="/comparison" element={<LocationComparison />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/members" element={<TeamMembersPage />} />
          <Route path="/about" element={<MethodologyAbout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

