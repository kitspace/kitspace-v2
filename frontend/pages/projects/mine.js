import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { List, Button, Modal } from 'semantic-ui-react'

import { Page } from '@/components/Page'
import { getUserRepos } from '@utils/giteaApi'
import { AuthContext } from '@/contexts/AuthContext'
import { deleteRepo } from 'utils/giteaApi'
import styles from './mine.module.scss'

const DeleteModal = ({ projectName }) => {
  const { reload } = useRouter()
  const { csrf } = useContext(AuthContext)

  return (
    <Modal
      trigger={<Button content="Delete" color="red" />}
      header="Heads up!"
      content={`Are you sure you want to delete the ${projectName} project?`}
      actions={[
        'Cancel',
        {
          key: 'delete',
          content: 'Delete',
          negative: true,
          onClick: async () => {
            await deleteRepo(projectName, csrf)
            await reload()
          },
        },
      ]}
    />
  )
}

const Mine = () => {
  const { csrf } = useContext(AuthContext)
  const { push } = useRouter()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const getUserProjects = async () => {
      const repos = await getUserRepos(csrf)
      setProjects(repos)
    }

    if (csrf) {
      getUserProjects().then()
    }
  }, [csrf])

  const projectsList = projects.map(p => {
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
          <DeleteModal projectName={projectFullName} />
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
