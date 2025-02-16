import React from 'react'
import Head from '@components/Head'
import NavBar from '@components/NavBar'
import styles from './index.module.scss'

type ContentProps = {
  contentFullSize: boolean
  children: React.ReactNode
}

type ContainerProps = {
  contentFullSize: boolean
  children: React.ReactNode
}

type PageProps = {
  title: string
  initialQuery?: string
  contentFullSize?: boolean
  children: React.ReactNode
}

const Content = ({ contentFullSize, children }: ContentProps) => {
  return <Container contentFullSize={contentFullSize}>{children}</Container>
}

const Container = ({ contentFullSize, children }: ContainerProps) => (
  <main
    className={contentFullSize ? styles.minimalContainer : styles.container}
    data-cy="page-container"
  >
    {children}
  </main>
)

const Page = ({ title, contentFullSize = false, children }: PageProps) => {
  return (
    <>
      <Head title={title} />
      <NavBar />
      <Content contentFullSize={contentFullSize}>{children}</Content>
    </>
  )
}

export default Page
