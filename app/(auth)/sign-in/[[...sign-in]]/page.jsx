import { SignIn } from '@clerk/nextjs'
import React from 'react'

const Page = () => {
  return (
    <div>
      <SignIn/>
    </div>
  )
}

export default Page


// //"use client"
// import { SignIn, useAuth } from '@clerk/nextjs'
// import { useRouter } from 'next/navigation'
// import { useEffect } from 'react'

// const Page = () => {
//   const { isSignedIn } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     if (isSignedIn) {
//       router.push('/dashboard') // Redirect to dashboard or any other page
//     }
//   }, [isSignedIn, router])

//   if (isSignedIn) {
//     return null // Avoid rendering <SignIn /> if already signed in
//   }

//   return (
//     <div>
//       <SignIn />
//     </div>
//   )
// }

// export default Page
