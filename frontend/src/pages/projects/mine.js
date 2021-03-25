import React, { useContext } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { List, Button, Loader } from 'semantic-ui-react'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'
import styles from './mine.module.scss'
import { useUserRepos } from '@hooks/Gitea'
import { getUserRepos } from '@utils/giteaApi'

const DeleteModal = dynamic(() => import('@components/DeleteProjectModal'))

export const getServerSideProps = async ({ req }) => {
  const { username } = req.session.user
  const userRepos = await getUserRepos(username)

  return {
    props: { userRepos, username },
  }
}

const Mine = ({ userRepos }) => {
  const { user } = useContext(AuthContext)
  const { push } = useRouter()

  const { repos: projects, isLoading, mutate } = useUserRepos(user?.username, {
    initialData: userRepos,
  })

  if (isLoading || !user) {
    return (
      <Page>
        <Loader active />
      </Page>
    )
  }

  const projectsList = projects?.map(p => {
    const projectFullName = p.full_name
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
        <List.Content floated="right">
          <Button
            color="yellow"
            onClick={async e => {
              e.preventDefault()
              await push(`/projects/update/${projectFullName}`)
            }}
          >
            Update
          </Button>
          <DeleteModal projectName={projectFullName} invalidateCache={mutate} />
        </List.Content>
      </List.Item>
    )
  })

  return (
    <Page reqSignIn>
      <h1>My projects</h1>
      <div className={styles.projectsList}>
        <List divided relaxed>
          {projectsList}
        </List>
      </div>
    </Page>
  )
}

export default Mine
