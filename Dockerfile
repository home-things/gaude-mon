FROM hayd/alpine-deno:1.8.2

# The port that your application listens to.
EXPOSE 8080

WORKDIR /app

# Prefer not to run as root.
USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when src/deps.ts is modified).
# Ideally cache src/deps.ts will download and compile _all_ external files used in src/index.ts.
# COPY src/deps.ts .
# RUN deno cache src/deps.ts

# These steps will be re-run upon each file change in your working directory:
ADD . .
# Compile the src/index app so that it doesn't need to be compiled each startup/entry.
RUN deno cache src/index.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "src/index.ts"]
