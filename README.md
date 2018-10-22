# elk-connect

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/joekrill/elk-client.svg)](https://greenkeeper.io/)
[![Travis](https://travis-ci.org/joekrill/elk-client.svg?branch=master)](https://travis-ci.org/joekrill/elk-message)
[![Coveralls](https://coveralls.io/repos/github/joekrill/elk-client/badge.svg)](https://coveralls.io/github/joekrill/elk-message)
[![Dev Dependencies](https://david-dm.org/joekrill/elk-client/dev-status.svg)](https://david-dm.org/joekrill/elk-message?type=dev)

A module for connecting to an [Elk M1](https://www.elkproducts.com/product-catalog/m1-gold-cross-platform-control) security system over a TCP connection.

### Usage

Install with NPM or Yarn

```
npm install elk-client
// or
yarn add elk-client
```

```
import { ElkClient } from 'elk-client';

// Parse a message

const client = new ElkClient('elkm1s://someuser:supersecretpassword@192.168.0.251?timeout=30');

client
  .connect()
  .then(() => client.getArmingStatus())    
  .then((armingStatus) => {
    const area1 = armingStatus.getAreaStatus(1);
    console.log('Area 1 status:', ArmingLevel[area1.armingLevel])
  })
  .then(() => client.disconnect())
  .then(() => {
    console.log('Done!');
  })
  .catch((err) => {
    console.error(err);
  });
```
