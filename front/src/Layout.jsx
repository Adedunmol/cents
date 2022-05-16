import React from 'react'

import {Nav} from './components'

function Layout({children}) {
  return (
    <>
       <Nav /> 
       {children}
    </>
  )
}

export default Layout