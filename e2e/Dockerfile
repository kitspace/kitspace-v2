FROM cypress/included:12.3.0

# Install testing dependencies
RUN apt-get install --no-install-recommends -y python3
COPY package.json yarn.lock ./
RUN yarn --prune-lockfile
# Prevent firefox from hanging indefinetly
ENV MOZ_FORCE_DISABLE_E10S 1

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# `command` can be used here, instead we should use `entrypoint`.
# see https://github.com/cypress-io/cypress-docker-images/tree/master/included#entry
ENTRYPOINT [ "/entrypoint.sh" ]
