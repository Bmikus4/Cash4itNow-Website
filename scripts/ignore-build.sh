#!/bin/sh
# Vercel's ignored-build step: exit 0 skips the build, anything else builds.
#
# A deploy hook rebuilds the commit that is already deployed, so its commit equals the previous
# deployment's: that build must run, because what changed is the platform's posts, not this code.
# Any other commit builds only when something the site is built from changed. A previous commit that
# is not in the clone makes git diff fail, which builds: the safe direction.
P=${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}
[ "$P" = "$VERCEL_GIT_COMMIT_SHA" ] && exit 1
git diff --quiet "$P" HEAD -- src scripts public index.html middleware.js vercel.json vite.config.js tailwind.config.js postcss.config.js jsconfig.json package.json package-lock.json .puppeteerrc.cjs
