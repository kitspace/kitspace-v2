import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import _ from 'lodash'
import { List } from 'semantic-ui-react'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos, getUserRepos } from '@utils/giteaApi'
import styles from './mine.module.scss'
import { useUserRepos } from '@hooks/Gitea'

export const getStaticPaths = async () => {
  const allRepos = await getAllRepos()
  // Fetch all the repos and get the unique usernames from it
  const paths =
    _.uniq(allRepos?.map(p => ({ params: { user: p.owner.login } }))) || []

  return { paths, fallback: true }
}

export const getStaticProps = async ({ params }) => {
  const userRepos = await getUserRepos(params.user)

  return {
    props: {
      userRepos,
      username: params.user,
    },
    // Regenerate the static version each day.
    // Even If there was an update `useUserRepos` will grab the latest update on mount.
    revalidate: Number(process.env.USER_ISR_INTERVAL) || 86400,
  }
}

const User = ({ userRepos, username }) => {
  const { user } = useContext(AuthContext)
  const { replace } = useRouter()

  const { repos: projects } = useUserRepos(username, { initialData: userRepos })

  useEffect(() => {
    // Redirect the user to `projects/mine` on accessing `project/{their username}` page.
    if (username === user?.login) {
      replace('/projects/mine')
    }
  }, [user])

  const projectsList = projects?.map(p => {
    const lastUpdateDate = new Date(p.updated_at)

    return (
      <List.Item key={p.name}>
        <List.Icon name="folder" size="large" verticalAlign="middle" />
        <List.Content>
          <List.Header as="a" className={styles.projectHeader}>
            {p.name}
          </List.Header>
          <List.Description>
            Updated at {lastUpdateDate.toDateString()}
          </List.Description>
        </List.Content>
      </List.Item>
    )
  })

  return (
    <Page>
      <h1>Projects by {username}</h1>
      <div className={styles.projectsList}>
        <List divided relaxed>
          {projectsList}
        </List>
      </div>
    </Page>
  )
}

export default User
