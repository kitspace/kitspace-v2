import faker from 'faker'

/**
 * `faker.unique` isn't that unique; sometimes it returns a previously used username.
 * @returns {{username: string, email: string, password: string}}}}}
 */
export const getFakeUser = () => {
  let username
  try {
    // It might fail to find unique username in the specified `maxTime`
    username = faker.unique(faker.internet.userName, undefined, { maxTime: 50 })
  } catch (e) {
    username = faker.internet.userName()
  }
  // This will make probability of returning the same username 1/1000 of the `faker.unique`.
  const suffix = (Math.random() * 1_000).toFixed()

  return {
    email: `${username}@example.com`,
    password: 'password',
    username: `${username}${suffix}`,
  }
}
