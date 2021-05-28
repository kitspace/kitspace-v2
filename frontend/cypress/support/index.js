import 'cypress-fail-fast'
import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector.js'

installLogsCollector()

import './commands'
