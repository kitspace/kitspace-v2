#!/usr/bin/env python3
from __future__ import print_function
import json
import math
import subprocess
import time
import os
import sys

if sys.version_info[0] < 3:
    from urllib2 import urlopen
else:
    from urllib.request import urlopen

def get_pulls():
    url = (
        f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/pulls&per_page=100"
    )
    data = urlopen(url).read()
    return json.loads(data)


print(get_pulls())
