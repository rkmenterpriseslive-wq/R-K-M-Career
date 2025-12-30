import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Job, UserType } from '../types';
import Button from './Button';
import JobDetailModal from './JobDetailModal'; // Import the new modal

const JobList = lazy(() => import('./JobList'));

interface JobsPageProps {
  jobs: Job[];
  onApplyNow: (job: Job) => void;
  currentUserType: UserType;
  onBackToDashboard?: () => void; // New optional prop
}

const JobsPage: React.FC<JobsPageProps> = ({ jobs, onApplyNow, currentUserType, onBackToDashboard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All Types');
  const [experienceFilter, setExperienceFilter] = useState('All Levels');
  const [jobRoleFilter, setJobRoleFilter] = useState('All Roles');
  const [salaryFilter, setSalaryFilter] = useState('All Salaries');
  const [detailedJob, setDetailedJob] = useState<Job | null>(null); // State for the modal

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9; // Display 9 jobs per page

  const allFilteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = job.jobCity.toLowerCase().includes(locationQuery.toLowerCase()) || job.locality.toLowerCase().includes(locationQuery.toLowerCase());
      const matchesJobType = jobTypeFilter === 'All Types' || job.jobType === jobTypeFilter;
      const matchesExperience = experienceFilter === 'All Levels' || job.experienceLevel === experienceFilter;
      const matchesJobRole = jobRoleFilter === 'All Roles' || job.title === jobRoleFilter;
      
      const matchesSalary = salaryFilter === 'All Salaries' || (() => {
        const salaryNum = parseFloat(job.salaryRange.replace(/[^0-9.]/g, '')) || 0; // Extract number from salary string
        if (salaryFilter === 'Below 20k') return salaryNum < 20000;
        if (salaryFilter === '20k-30k') return salaryNum >= 20000 && salaryNum < 30000;
        if (salaryFilter === '30k+') return salaryNum >= 30000;
        return true;
      })();

      return matchesSearch && matchesLocation && matchesJobType && matchesExperience && matchesJobRole && matchesSalary;
    });
  }, [jobs, searchQuery, locationQuery, jobTypeFilter, experienceFilter, jobRoleFilter, salaryFilter]);

  // Calculate total pages
  const totalPages = Math.ceil(allFilteredJobs.length / jobsPerPage);

  // Get jobs for the current page
  const currentJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return allFilteredJobs.slice(startIndex, endIndex);
  }, [allFilteredJobs, currentPage, jobsPerPage]);


  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setJobTypeFilter('All Types');
    setExperienceFilter('All Levels');
    setJobRoleFilter('All Roles');
    setSalaryFilter('All Salaries');
    setCurrentPage(1); // Reset to first page
  };

  const jobTypes = ['All Types', 'Full-time', 'Part-time', 'Contract'];
  const experienceLevels = ['All Levels', 'Fresher', '1-3 Years', '3-5 Years', '5+ Years'];
  const uniqueJobRoles = useMemo(() => ['All Roles', ...new Set(jobs.map(job => job.title))], [jobs]);
  const salaryRanges = ['All Salaries', 'Below 20k', '20k-30k', '30k+'];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {onBackToDashboard && (
        <div className="mb-6 flex justify-start">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Button>
        </div>
      )}
      <h1 className="text-4xl font-extrabold text-blue-800 text-center">Explore Opportunities</h1>
      <p className="text-gray-600 mt-1 text-center">{allFilteredJobs.length} jobs found</p>

      {/* Search Bars */}
      <div className="mt-6 bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative flex-grow w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <input
            type="text"
            placeholder="Location"
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <svg className="h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <h3 className="text-xl font-bold text-gray-800">Filters</h3>
          </div>
          <div className="space-y-6">
            {/* Job Type Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Job Type</label>
              <select value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} className="mt-2 block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                {jobTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </div>
            {/* Experience Level Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Experience Level</label>
              <select value={experienceFilter} onChange={e => setExperienceFilter(e.target.value)} className="mt-2 block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                {experienceLevels.map(level => <option key={level}>{level}</option>)}
              </select>
            </div>
            {/* Job Role Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Job Role</label>
              <select value={jobRoleFilter} onChange={e => setJobRoleFilter(e.target.value)} className="mt-2 block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                {uniqueJobRoles.map(role => <option key={role}>{role}</option>)}
              </select>
            </div>
            {/* Salary Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Salary</label>
              <select value={salaryFilter} onChange={e => setSalaryFilter(e.target.value)} className="mt-2 block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                {salaryRanges.map(range => <option key={range}>{range}</option>)}
              </select>
            </div>

            <Button onClick={clearFilters} className="w-full justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600">
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {currentJobs.length > 0 ? (
            <>
              <Suspense fallback={<div className="text-center p-8">Loading jobs...</div>}>
                <JobList 
                  jobs={currentJobs} 
                  currentUserType={currentUserType} 
                  onApplyNow={onApplyNow} 
                  onViewDetails={setDetailedJob}
                />
              </Suspense>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav className="flex justify-center items-center gap-2 mt-8" aria-label="Pagination">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-6 rounded-full mb-6">
                  <svg className="h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">No jobs found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search criteria.</p>
              <Button onClick={clearFilters} variant="primary" className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      <JobDetailModal 
        job={detailedJob} 
        onClose={() => setDetailedJob(null)} 
        onApply={onApplyNow} 
      />
    </div>
  );
};

export default JobsPage;
