// This file is auto-generated. Do not edit manually.

import * as gen from './gen/index'

export const api = {
healthCheck: gen.healthCheck,
ai: {
  chat: gen.chat,
},
auth: {
  magiclink: {
    request: gen.magiclinkRequest,
    verify: gen.magiclinkVerify,
  },
  session: {
    logout: gen.logout,
    refresh: gen.refresh,
  },
},
test: {
  authed: gen.testAuthed,
  magicLink: {
    last: gen.getLastMagicLinkToken,
  },
},
}
