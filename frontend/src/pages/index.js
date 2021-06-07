export const getServerSideProps = async () => ({
  redirect: {
    destination: '/search',
    permanent: true,
  },
})

const Home = () => {}

export default Home
