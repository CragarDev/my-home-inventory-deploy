import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import axios from 'axios'
import ItemsList from './ItemsList'
import { Container, Typography } from '@mui/material'

const Dashboard = props => {
  const [loggedInUserId, setLoggedInUserId] = useState('')
  // console.log('DASHBOARD__Logged in user id: ', loggedInUserId)
  const [loggedInUserFirstName, setLoggedInUserFirstName] = useState('')
  const [loggedInUserLastName, setLoggedInUserLastName] = useState('')
  const [loggedInUserEmail, setLoggedInUserEmail] = useState('')

  const [deleteToggle, setDeleteToggle] = useState(false)

  const { loggedInUserToggle, setLoggedInUserToggle } = props

  const [errors, setErrors] = useState({})

  const history = useHistory()

  // getting logged in user id
  useEffect(() => {
    // console.log('Dashboard')

    axios
      .get('http://localhost:8000/api/user/loggedInUser', {
        withCredentials: true
      })
      .then(res => {
        console.log(
          'GETTING LOGGED IN USER__res.data.results._id ==>',
          res.data.results._id
        )
        if (res.data.results) {
          // this means there is a user logged in
          setLoggedInUserId(res.data.results._id)
          // console.log('useEffect__setLoggedInUserId: ', loggedInUserId)
          setLoggedInUserFirstName(res.data.results.firstName)
          setLoggedInUserLastName(res.data.results.lastName)
          setLoggedInUserEmail(res.data.results.email)
        }
      })
      .catch(err => {
        console.log('GETTING LOGGED IN USER__res.data ==>ERROR:', err)
        setLoggedInUserToggle(!loggedInUserToggle)
        history.push('/login')
      })
  }, [])

  return (
    <>
      <div
        className='bgImgDashboard'
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Container>
          <Typography
            sx={{ marginTop: '200px', height: '100px', paddingTop: '15px' }}
            variant='h3'
            className='text-center text-dark'
            bgcolor={'warning.main'}
          >
            Welcome{' '}
            <span className='text-success fw-bold h1'>
              {loggedInUserFirstName}
            </span>
            , to My Home Inventory
          </Typography>
          {/* <ItemsList /> */}
          {/* <Category /> */}
          <ItemsList
            deleteToggle={deleteToggle}
            setDeleteToggle={setDeleteToggle}
            loggedInUserId={loggedInUserId}
          ></ItemsList>
        </Container>
      </div>
    </>
  )
}

export default Dashboard
