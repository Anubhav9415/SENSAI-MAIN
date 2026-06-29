import { getResume } from '@/actions/resume'
import { getOnboardingStatus } from '@/actions/user'
import { redirect } from 'next/navigation'
import React from 'react'
import ResumeBuilder from './_components/resume-builder';

const ResumePage = async() => {
    const { isOnboarded } = await getOnboardingStatus();
    if (!isOnboarded) {
        redirect("/onboarding");
    }

    const resume = await getResume();

  return (
    <div className='container mx-auto py-6 '>
        <ResumeBuilder initialContent={resume?.content}/>
    </div>
  )
}

export default ResumePage