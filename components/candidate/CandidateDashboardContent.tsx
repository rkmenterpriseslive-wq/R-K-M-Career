
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { CandidateDashboardContentProps, CandidateMenuItem, UserType, AppUser, Ticket, Resignation, Job } from '../../types';
import Button from '../Button'; // Import Button component

// Dynamically import view components for code splitting
const JobList = lazy(() => import('../JobList'));
const MyDocumentsView = lazy(() => import('./MyDocumentsView'));
const MyProfileView = lazy(() => import('./MyProfileView'));
const CVGeneratorView = lazy(() => import('./CVGeneratorView'));
const MyPayslipsView = lazy(() => import('./MyPayslipsView'));
const MyAttendanceView = lazy(() => import('./MyAttendanceView'));
const MyInterviewsView = lazy(() => import('./MyInterviewsView'));
const CompanyDocumentsView = lazy(() => import('./CompanyDocumentsView'));
const ResignView = lazy(() => import('./ResignView'));
const HelpCenterView = lazy(() => import('./HelpCenterView'));
const JobsPage = lazy(() => import('../JobsPage')); // Import JobsPage here for internal use


const CandidateDashboardContent: React.FC<CandidateDashboardContentProps> = ({ activeCandidateMenuItem, jobs, onApplyNow, onProfileComplete, currentUser, complaints, resignation, candidates, supervisors, portalName, logoSrc, contactInfo }) => {
  const isProfileComplete = currentUser?.profile_complete ?? false;
  const [showAllJobsList, setShowAllJobsList] = useState(false); // New state for showing all jobs

  const { recommendedJobs } = useMemo(() => { // Removed otherJobs from destructuring
    if (!isProfileComplete || !currentUser?.city || !currentUser.highestQualification || !currentUser.totalExperience) {
        return { recommendedJobs: [] }; // No otherJobs returned
    }

    const qualificationRank: Record<string, number> = {
        '10th Pass': 1, '12th Pass': 2, 'Diploma': 3,
        'Graduate': 4, 'Post Graduate': 5, 'Ph.D.': 6, 'Other': 0,
    };

    const getExperienceInYears = (expString?: string): number => {
        if (!expString) return 0;
        const yearsMatch = expString.match(/(\d+)\s*Years/);
        return yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
    };

    const doesExperienceMatch = (candidateExpYears: number, jobExpLevel: string): boolean => {
        switch (jobExpLevel) {
            case 'Fresher': return candidateExpYears === 0;
            case '1-3 Years': return candidateExpYears >= 1 && candidateExpYears <= 3;
            case '3-5 Years': return candidateExpYears >= 3 && candidateExpYears <= 5;
            case '5+ Years': return candidateExpYears >= 5;
            default: return true;
        }
    };
    
    const candidateExpYears = getExperienceInYears(currentUser.totalExperience);
    const candidateQualificationRank = qualificationRank[currentUser.highestQualification] || 0;
    const candidateCity = currentUser.city.toLowerCase().trim();

    const recommended: Job[] = [];

    jobs.forEach(job => {
        const jobQualificationRank = qualificationRank[job.minQualification] || 0;
        const jobCity = job.jobCity.toLowerCase().trim();
        
        const qualificationMatch = candidateQualificationRank >= jobQualificationRank;
        const experienceMatch = doesExperienceMatch(candidateExpYears, job.experienceLevel);
        const locationMatch = jobCity.includes(candidateCity) || candidateCity.includes(jobCity);

        if (qualificationMatch && experienceMatch && locationMatch) {
            recommended.push(job);
        }
    });

    return { recommendedJobs: recommended }; // No otherJobs returned
  }, [jobs, currentUser, isProfileComplete]);


  const renderContent = () => {
    // If profile is incomplete, only the MyProfile view is truly accessible.
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
          <div className="space-y-10">
            {showAllJobsList ? (
                <JobsPage
                    jobs={jobs}
                    onApplyNow={onApplyNow}
                    currentUserType={UserType.CANDIDATE}
                    onBackToDashboard={() => setShowAllJobsList(false)} // Pass callback to go back
                />
            ) : (
                <>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Recommended For You</h2>
                        <p className="text-gray-500 mt-1">Based on your profile, we think you'll be a great fit for these roles.</p>
                        <div className="mt-4">
                            {recommendedJobs.length > 0 ? (
                                <JobList jobs={recommendedJobs} currentUserType={UserType.CANDIDATE} onApplyNow={onApplyNow} />
                            ) : (
                                <div className="bg-white p-8 rounded-lg text-center text-gray-500 border border-gray-200">
                                    <p>No jobs match your profile right now.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <Button 
                            onClick={() => setShowAllJobsList(true)} // Toggle to show all jobs
                            variant="primary" 
                            size="lg" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4"
                        >
                            Search All Jobs
                        </Button>
                    </div>
                </>
            )}
          </div>
        );
      case CandidateMenuItem.MyDocuments:
        return <MyDocumentsView currentUser={currentUser} />;
      case CandidateMenuItem.MyProfile:
        return <MyProfileView currentUser={currentUser} onProfileComplete={onProfileComplete} />;
      case CandidateMenuItem.CVGenerator:
        return <CVGeneratorView />;
      case CandidateMenuItem.MyPayslips:
        return <MyPayslipsView />;
      case CandidateMenuItem.MyAttendance:
        return <MyAttendanceView currentUser={currentUser} />;
      case CandidateMenuItem.MyInterviews:
        return <MyInterviewsView currentUser={currentUser} candidates={candidates || []} supervisors={supervisors} />;
      case CandidateMenuItem.CompanyDocuments:
        return <CompanyDocumentsView />;
      case CandidateMenuItem.Resign:
        return <ResignView currentUser={currentUser} resignation={resignation || null} />;
      case CandidateMenuItem.HelpCenter:
        return <HelpCenterView currentUser={currentUser} complaints={complaints || []} />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="animate-fade-in">
        <Suspense fallback={<div className="flex items-center justify-center p-12 text-gray-500">Loading Page...</div>}>
            {renderContent()}
        </Suspense>
    </div>
  );
};

export default CandidateDashboardContent;
