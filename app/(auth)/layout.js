//the code wrritten here will effect both signin and signup 
import React from 'react'

const AuthLayout = ({children}) => {
//NOw we will check if user is already onboarderd then we will redirect them 
  return (
    <div className='flex justify-center pt-40'>
        {children}
    </div>
  )
}

export default AuthLayout