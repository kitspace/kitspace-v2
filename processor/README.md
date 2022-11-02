# Kitspace v2 Asset Processor

This is a NodeJS and [Express](https://expressjs.com/) server that processes Kitspace specific assets such as printed circuit board files and bill of materials.

## Development

###  Adding dependencies

Changing dependencies requires you to restart the development container.

```
cd processor
yarn add <new dependency>
cd ..
docker-compose restart processor
```

