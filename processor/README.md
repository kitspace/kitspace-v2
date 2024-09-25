# Kitspace v2 Asset Processor

This is a NodeJS app that processes Kitspace specific assets such as printed
circuit board files and bill of materials and uploads them to an S3 comptible
service.


## S3 object schema

```
files/[user]/[repo]/[git-rev]/kitspace-yaml.json
files/[user]/[repo]/[git-rev]/[project]/processor-report.json
files/[user]/[repo]/[git-rev]/[project]/bom-info.json
files/[user]/[repo]/[git-rev]/[project]/gerber-info.json
files/[user]/[repo]/[git-rev]/[project]/images/bottom.svg
files/[user]/[repo]/[git-rev]/[project]/images/layout.svg
files/[user]/[repo]/[git-rev]/[project]/images/top-large.png
files/[user]/[repo]/[git-rev]/[project]/images/top-with-background.png
files/[user]/[repo]/[git-rev]/[project]/images/top.png
files/[user]/[repo]/[git-rev]/[project]/images/top.svg
files/[user]/[repo]/[git-rev]/[project]/interactive_bom.json
files/[user]/[repo]/[git-rev]/[project]/readme.html
files/[user]/[repo]/[git-rev]/[project]/${project === "_" ? repo : project}-${gitShortHash}-gerbers.zip
```

- `[git-rev]` can be `HEAD`
- `[project]` is `_` when it's a project not using `multi:` in kitspace.yaml



## Development

###  Adding dependencies

Changing dependencies requires you to restart the development container.

```
cd processor
yarn add <new dependency>
cd ..
docker-compose restart processor
```


## Staging

On the staging servers the processor uses actual AWS S3 buckets rather than a
Minio Docker container. To clear out the data SSH into the staging server and
remove the bucket. E.g.:

```
ssh deploy@review.staging.kitspace.dev 'aws s3 rm s3://kitspace-staging-review --recursive'
```

You also need to purge the Bunny CDN cache via the bunny.net Dashboard. 
