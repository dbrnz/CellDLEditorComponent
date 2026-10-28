//==============================================================================

import { Logger, LogLevel } from "tslog"

export const logging = new Logger({
    minLevel: LogLevel.WARN,
    type: 'pretty',
    pretty: {
        template: '{{dateIsoStr}}\t{{logLevelName}}\t{{name}}\t',
    }
})

//==============================================================================
//==============================================================================
