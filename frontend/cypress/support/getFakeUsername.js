import faker from 'faker'

/**
 * `faker.unique` isn't that unique; sometimes it returns a previously used username.
 * @returns {string} unique username
 */
export const getFakeUsername = () => {
  let username
  try {
    username = faker.unique(faker.name.firstName, undefined, { maxTime: 50 })
  } catch (e) {
    username = faker.name.firstName()
  }
  // This will make probability of returning the same username 1/1000 of the `faker.unique`.
  const suffix = (Math.random() * 1_000).toFixed()

  return `${username}${suffix}`
}
