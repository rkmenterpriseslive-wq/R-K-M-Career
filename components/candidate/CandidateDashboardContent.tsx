import React from 'react';
// FIX: Import UserType to resolve 'Cannot find name 'UserType'' error.
import { CandidateDashboardContentProps, CandidateMenuItem, UserType, AppUser } from '../../types';
import JobList from '../JobList';
import MyDocumentsView from './MyDocumentsView';
import MyProfileView from './MyProfileView';
import CVGeneratorView from './CVGeneratorView';
import MyPayslipsView from './MyPayslipsView';
import MyAttendanceView from './MyAttendanceView';
import MyInterviewsView from './MyInterviewsView';
import CompanyDocumentsView from './CompanyDocumentsView';
import ResignView from './ResignView';
import HelpCenterView from './HelpCenterView';

const CandidateDashboardContent: React.FC<CandidateDashboardContentProps> = ({ activeCandidateMenuItem, jobs, onApplyNow, onProfileComplete, currentUser }) => {
  const renderContent = () => {
    const isProfileComplete = currentUser?.profile_complete ?? false;

    // If profile is incomplete, only the MyProfile view is truly accessible.
    // App.tsx already forces the active item, this is a visual safeguard.
    if (!isProfileComplete && activeCandidateMenuItem !== CandidateMenuItem.MyProfile) {
        return (
             <div className="text-center p-12 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-gray-800">Complete Your Profile</h3>
                <p className="mt-2 text-gray-600">Please complete your profile from the sidebar to view and apply for jobs.</p>
             </div>
        );
    }
    
    switch (activeCandidateMenuItem) {
      case CandidateMenuItem.ApplyJobs:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Apply for Jobs</h2>
            <JobList jobs={jobs} currentUserType={UserType.CANDIDATE} onApplyNow={onApplyNow} />
          </div>
        );
      case CandidateMenuItem.MyDocuments:
        return <MyDocumentsView />;
      case CandidateMenuItem.MyProfile:
        return <MyProfileView currentUser={currentUser} onProfileComplete={onProfileComplete} />;
      case CandidateMenuItem.CVGenerator:
        return <CVGeneratorView />;
      case CandidateMenuItem.MyPayslips:
        return <MyPayslipsView />;
      case CandidateMenuItem.MyAttendance:
        return <MyAttendanceView />;
      case CandidateMenuItem.MyInterviews:
        return <MyInterviewsView />;
      case CandidateMenuItem.CompanyDocuments:
        return <CompanyDocumentsView />;
      case CandidateMenuItem.Resign:
        return <ResignView />;
      case CandidateMenuItem.HelpCenter:
        return <HelpCenterView />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return <div className="animate-fade-in">{renderContent()}</div>;
};

export default CandidateDashboardContent;
