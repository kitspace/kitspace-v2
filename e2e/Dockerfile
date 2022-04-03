# The `cypress/included` images don't have any image with edge installed
# so we have to install it manually.

FROM cypress/included:9.5.1
# Install Microsoft Edge
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
    install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/ && \
    sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-dev.list' && \
    rm microsoft.gpg && \
    apt update && \
    apt install microsoft-edge-beta -y

# Install testing dependencies
COPY package.json yarn.lock ./
RUN yarn --prune-lockfile
# Prevent firefox from hanging indefinetly
ENV MOZ_FORCE_DISABLE_E10S 1

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# `command` can be used here, instead we should use `entrypoint`.
# see https://github.com/cypress-io/cypress-docker-images/tree/master/included#entry
ENTRYPOINT [ "/entrypoint.sh" ]
