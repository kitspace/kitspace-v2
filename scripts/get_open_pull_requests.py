#!/usr/bin/env python3
from __future__ import print_function
import json
import os
from urllib.request import urlopen

def get_pulls():
    url = (
        f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/pulls"
    )
    data = urlopen(url).read()
    return json.loads(data)


print(get_pulls())
