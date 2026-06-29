import { getAssessments } from '@/actions/interview'
import { getOnboardingStatus } from '@/actions/user'
import { redirect } from 'next/navigation'
import React from 'react'
import StatsCard from './_components/stats-card';
import PerformanceChart from './_components/performance-chart';
import QuizList from './_components/quiz-list';

const InterviewPage = async() => {
  const { isOnboarded } = await getOnboardingStatus();
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const assessments=await getAssessments();
  return (
    <div>
      <div>
        <h1 className='text-6xl font-bold gradient-title mb-5'>Interview Preparation</h1>

        <div className='space-y-6'>
          <StatsCard assessments={assessments}/>
          <PerformanceChart assessments={assessments}/>
          <QuizList assessments={assessments}/>
        </div>
      </div>
    </div>
  )
}

export default InterviewPage