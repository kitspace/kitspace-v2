import React from 'react'
import { List } from 'semantic-ui-react'
import { isEmpty } from 'lodash'

import { Page } from '@components/Page'
import { getUserRepos, userExists } from '@utils/giteaApi'
import styles from './mine.module.scss'
import { useUserRepos } from '@hooks/Gitea'

export const getServerSideProps = async ({ params, req }) => {
  const userRepos = await getUserRepos(params.user)
  const username = req.session?.user?.username

  if (username === params.user) {
    return {
      redirect: {
        destination: '/projects/mine',
        permanent: true,
      },
    }
  } else if (isEmpty(userRepos) && !(await userNotFound)) {
    return {
      notFound: true,
    }
  } else {
    return {
      props: {
        userRepos,
        username: params.user,
      },
    }
  }
}

const User = ({ userRepos, username }) => {
  const { repos: projects } = useUserRepos(username, { initialData: userRepos })

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
