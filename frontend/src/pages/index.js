export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: '/search',
      permanent: true
    }
  }
}

const Home = () => { }

export default Home
