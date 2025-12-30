





import React from 'react';
import {
  Job,
  UserType,
  CandidatePipelineStats,
  VendorStats,
  ComplaintStats,
  ProcessMetric,
  RoleMetric,
  TeamMemberPerformance,
  AdminMenuItem,
  DashboardProps,
  CandidateMenuItem,
  Ticket,
  Resignation,
  PartnerRequirement,
  StoreSupervisor,
  HireYourselfStats
} from '../types';
import JobPostingForm from './JobPostingForm';
import LogoUploader from './LogoUploader';
import AdminLayout from './admin/AdminLayout';
import AdminDashboardContent from './admin/AdminDashboardContent'; // FIX: Changed import from named export to default export
import CandidateLayout from './candidate/CandidateLayout';
import CandidateDashboardContent from './candidate/CandidateDashboardContent';


const Dashboard: React.FC<DashboardProps> = ({
  userType,
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onDeleteRequirement,
  currentLogoSrc,
  onLogoUpload,
  pipelineStats,
  vendorStats,
  complaintStats,
  partnerRequirementStats,
  hrStats,
  hireYourselfStats,
  candidatesByProcess,
  candidatesByRole,
  teamPerformance,
  requirementBreakdown,
  activeAdminMenuItem,
  onAdminMenuItemClick,
  activeCandidateMenuItem,
  onCandidateMenuItemClick,
  onLogout,
  branding,
  onUpdateBranding,
  currentUser,
  onApplyNow,
  onProfileComplete,
  vendors,
  jobRoles,
  locations,
  stores,
  partnerLogos,
  onUpdateSettings,
  showPopup,
  systemRoles,
  panelConfig,
  demoRequests,
  complaints,
  candidates,
  partnerRequirements,
  resignation,
  supervisors,
  // NEW: Added new settings fields
  quickLinks,
  contactInfo,
  socialMedia,
  salaryRules,
}) => {
  const renderDashboardContent = () => {
    switch (userType) {
      case UserType.ADMIN:
      case UserType.HR:
      case UserType.PARTNER:
      case UserType.TEAMLEAD: // Team Leads now use the AdminLayout
      case UserType.STORE_SUPERVISOR: // Supervisors now use the AdminLayout
      case UserType.TEAM: // Team Members now use the AdminLayout
        return (
          <AdminLayout
            userType={userType} // Pass userType to AdminLayout
            currentLogoSrc={currentLogoSrc}
            onLogoUpload={onLogoUpload}
            onLogout={onLogout}
            activeAdminMenuItem={activeAdminMenuItem} // Pass active menu item
            onAdminMenuItemClick={onAdminMenuItemClick} // Pass click handler
          >
            <AdminDashboardContent
              pipelineStats={pipelineStats}
              vendorStats={vendorStats}
              complaintStats={complaintStats}
              partnerRequirementStats={partnerRequirementStats}
              hrStats={hrStats}
              hireYourselfStats={hireYourselfStats}
              candidatesByProcess={candidatesByProcess}
              candidatesByRole={candidatesByRole}
              teamPerformance={teamPerformance}
              requirementBreakdown={requirementBreakdown}
              jobs={jobs}
              onAddJob={onAddJob}
              onUpdateJob={onUpdateJob}
              onDeleteJob={onDeleteJob}
              onDeleteRequirement={onDeleteRequirement}
              currentLogoSrc={currentLogoSrc} 
              onLogoUpload={onLogoUpload} 
              activeAdminMenuItem={activeAdminMenuItem} // Pass active menu item for conditional rendering
              onAdminMenuItemClick={onAdminMenuItemClick} // Pass handler down
              userType={userType} // Pass userType for section filtering
              branding={branding}
              onUpdateBranding={onUpdateBranding}
              currentUser={currentUser}
              vendors={vendors}
              jobRoles={jobRoles}
              systemRoles={systemRoles}
              locations={locations}
              stores={stores}
              partnerLogos={partnerLogos}
              panelConfig={panelConfig}
              onUpdateSettings={onUpdateSettings}
              showPopup={showPopup}
              demoRequests={demoRequests}
              complaints={complaints}
              candidates={candidates}
              partnerRequirements={partnerRequirements}
              // FIX: Removed 'resignation' prop as it is not part of AdminDashboardContentProps and is only relevant to the candidate dashboard.
              supervisors={supervisors}
              quickLinks={quickLinks}
              contactInfo={contactInfo}
              socialMedia={socialMedia}
              salaryRules={salaryRules}
            />
          </AdminLayout>
        );
      case UserType.CANDIDATE:
        return (
          <CandidateLayout
            userType={userType}
            onLogout={onLogout}
            activeCandidateMenuItem={activeCandidateMenuItem}
            onCandidateMenuItemClick={onCandidateMenuItemClick}
            currentUser={currentUser || null}
          >
            <CandidateDashboardContent
              activeCandidateMenuItem={activeCandidateMenuItem}
              jobs={jobs}
              onApplyNow={onApplyNow}
              onProfileComplete={onProfileComplete}
              currentUser={currentUser || null}
              complaints={complaints}
              resignation={resignation}
              candidates={candidates}
              supervisors={supervisors}
              portalName={branding.portalName}
              logoSrc={currentLogoSrc}
              contactInfo={contactInfo}
            />
          </CandidateLayout>
        );
      default:
        // This should not be reached for logged-in users.
        return <div>Loading dashboard...</div>;
    }
  };

  return <>{renderDashboardContent()}</>;
};

export default Dashboard;
